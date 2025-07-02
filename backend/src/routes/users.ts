import express from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createError } from "../middlewares/errorHandler";

const router = express.Router();

// Role-based permissions mapping
const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: [
    "CREATE_ADMIN", "DELETE_ADMIN", "VIEW_ALL_TENANTS", "MANAGE_SYSTEM",
    "CREATE_USER", "UPDATE_USER", "DELETE_USER", "VIEW_ALL_REPORTS", "MANAGE_ROLES",
    "CREATE_LEAD", "UPDATE_LEAD", "VIEW_LEADS", "VIEW_TEAM_REPORTS", "UPDATE_OWN_LEADS"
  ],
  ADMIN: [
    "CREATE_USER", "UPDATE_USER", "DELETE_USER", "VIEW_TENANT_REPORTS", "MANAGE_TENANT_ROLES",
    "CREATE_LEAD", "UPDATE_LEAD", "VIEW_LEADS", "VIEW_TEAM_REPORTS", "UPDATE_OWN_LEADS"
  ],
  SALES_MANAGER: [
    "CREATE_LEAD", "UPDATE_LEAD", "VIEW_LEADS", "VIEW_TEAM_REPORTS", "UPDATE_OWN_LEADS"
  ],
  SALES_REP: [
    "CREATE_LEAD", "VIEW_LEADS", "UPDATE_OWN_LEADS"
  ],
};

// Get all users for the same tenant (hierarchical)
router.get("/tenant-users", async (req, res, next) => {
  try {
    const currentUser = (req as any).user;
    if (!currentUser) {
      throw createError("User not found in token", 401);
    }

    // Scan all users
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Users"
      })
    );

    let users = result.Items || [];

    // Filter out deleted users first
    users = users.filter(user => !user.isDeleted);

    // Filter based on user role and tenant hierarchy
    if (currentUser.role === 'SUPER_ADMIN') {
      // Super admin sees only super admins (themselves) and admins (since they can only create admins)
      users = users.filter(user => 
        user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
      );
    } else if (currentUser.role === 'ADMIN') {
      // Admin sees only users in their tenant (same tenantId)
      users = users.filter(user => 
        user.tenantId === currentUser.tenantId && user.role !== 'SUPER_ADMIN'
      );
    } else {
      // Other roles see only users in their tenant with same or lower roles
      const roleHierarchy = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
      const currentRoleIndex = roleHierarchy.indexOf(currentUser.role);
      
      users = users.filter(user => {
        const userRoleIndex = roleHierarchy.indexOf(user.role);
        return user.tenantId === currentUser.tenantId && 
               userRoleIndex <= currentRoleIndex &&
               user.role !== 'SUPER_ADMIN';
      });
    }

    const mappedUsers = users.map(user => ({
      id: user.userId,
      userId: user.userId,
      firstName: user.firstName || user.username?.split(' ')[0] || '',
      lastName: user.lastName || user.username?.split(' ')[1] || '',
      name: user.username,
      email: user.email,
      role: user.role || 'SALES_REP',
      tenantId: user.tenantId,
      createdBy: user.createdBy,
      permissions: rolePermissions[user.role?.toUpperCase()] || [],
      isDeleted: user.isDeleted || false,
      createdAt: user.createdAt,
      phoneNumber: user.phoneNumber
    }));

    res.json({ data: mappedUsers });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get("/", async (req, res, next) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'ADMIN') {
      throw createError("Access denied. Admin role required.", 403);
    }

    const result = await docClient.send(
      new ScanCommand({
        TableName: "Users"
      })
    );

    const users = (result.Items || []).map(user => ({
      id: user.userId,
      userId: user.userId,
      firstName: user.firstName || user.username?.split(' ')[0] || '',
      lastName: user.lastName || user.username?.split(' ')[1] || '',
      name: user.username,
      email: user.email,
      role: user.role || 'SALES_REP',
      permissions: rolePermissions[user.role?.toUpperCase()] || [],
      isDeleted: user.isDeleted || false,
      createdAt: user.createdAt,
      phoneNumber: user.phoneNumber
    }));

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First find the user by userId to get their email (since email is the primary key)
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": id
        }
      })
    );

    const user = scanResult.Items?.[0];
    if (!user) {
      throw createError("User not found", 404);
    }

    const responseUser = {
      id: user.userId,
      userId: user.userId,
      firstName: user.firstName || user.username?.split(' ')[0] || '',
      lastName: user.lastName || user.username?.split(' ')[1] || '',
      name: user.username,
      email: user.email,
      role: user.role || 'SALES_REP',
      permissions: rolePermissions[user.role?.toUpperCase()] || [],
      isDeleted: user.isDeleted || false,
      createdAt: user.createdAt,
      phoneNumber: user.phoneNumber
    };

    res.json({ data: responseUser });
  } catch (error) {
    next(error);
  }
});

// Create new user
router.post("/", async (req, res, next) => {
  try {
    const currentUser = (req as any).user;
    const userRole = currentUser?.role;
    
    // Check permissions based on role hierarchy
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      throw createError("Access denied. Admin or Super Admin role required.", 403);
    }

    const { email, password, username, firstName, lastName, role = "SALES_REP", phoneNumber } = req.body;

    if (!email || !password || !username) {
      throw createError("Email, password, and username are required", 400);
    }

    // Validate role creation permissions
    const requestedRole = role.toUpperCase();
    
    if (userRole === 'SUPER_ADMIN') {
      // Super admins can ONLY create admins
      if (requestedRole !== 'ADMIN') {
        throw createError("Super admins can only create admins", 403);
      }
    } else if (userRole === 'ADMIN') {
      // Admins cannot create other admins or super admins
      if (requestedRole === 'ADMIN') {
        throw createError("Admins cannot create other admins", 403);
      }
      if (requestedRole === 'SUPER_ADMIN') {
        throw createError("Admins cannot create super admins", 403);
      }
    } else {
      // Other roles cannot create admins or super admins
      if (requestedRole === 'ADMIN' || requestedRole === 'SUPER_ADMIN') {
        throw createError("Insufficient permissions to create admin or super admin", 403);
      }
    }

    // Check if user already exists with this email
    const existingUser = await docClient.send(
      new GetCommand({
        TableName: "Users",
        Key: { email }
      })
    );

    if (existingUser.Item) {
      throw createError("User already exists with this email", 400);
    }

    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      const existingPhoneUser = await docClient.send(
        new QueryCommand({
          TableName: "Users",
          IndexName: "PhoneNumberIndex",
          KeyConditionExpression: "phoneNumber = :phoneNumber",
          ExpressionAttributeValues: {
            ":phoneNumber": phoneNumber
          }
        })
      );

      if (existingPhoneUser.Items && existingPhoneUser.Items.length > 0) {
        throw createError("User already exists with this phone number", 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Determine tenant assignment
    let tenantId = "default-tenant";
    let createdBy = currentUser.userId;

    if (userRole === 'SUPER_ADMIN') {
      // Super admin only creates admins - each gets their own tenant ID
      tenantId = uuidv4();
    } else if (userRole === 'ADMIN') {
      // Admin creating user - assign to admin's tenant
      tenantId = currentUser.tenantId;
    }

    const user = {
      userId,
      email,
      username,
      firstName: firstName || '',
      lastName: lastName || '',
      password: hashedPassword,
      role: requestedRole,
      tenantId,
      createdBy,
      phoneNumber,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(
      new PutCommand({
        TableName: "Users",
        Item: user
      })
    );

    const responseUser = {
      id: userId,
      userId,
      firstName: firstName || '',
      lastName: lastName || '',
      name: username,
      email,
      role: requestedRole,
      tenantId,
      createdBy,
      permissions: rolePermissions[requestedRole] || [],
      isDeleted: false,
      createdAt: user.createdAt,
      phoneNumber
    };

    res.status(201).json({ data: responseUser });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUserId = (req as any).user?.userId;
    const currentUserRole = (req as any).user?.role;

    // Users can update their own profile, admins and super admins can update anyone
    if (currentUserId !== id && !['ADMIN', 'SUPER_ADMIN'].includes(currentUserRole)) {
      throw createError("Access denied. You can only update your own profile.", 403);
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'userId' && key !== 'email' && value !== undefined) {
        // Hash password if being updated
        if (key === 'password' && value) {
          const hashedPassword = await bcrypt.hash(value as string, 10);
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = hashedPassword;
        } else if (key === 'role' && ['ADMIN', 'SUPER_ADMIN'].includes(currentUserRole)) {
          // Only admins and super admins can update roles
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = (value as string).toUpperCase();
        } else if (key !== 'role') {
          updateExpressions.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      }
    }

    if (updateExpressions.length === 0) {
      throw createError("No valid fields to update", 400);
    }

    // First get the user to find their email (since email is the primary key)
    const getUserResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": id
        }
      })
    );

    const userToUpdate = getUserResult.Items?.[0];
    if (!userToUpdate) {
      throw createError("User not found", 404);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Users",
        Key: { email: userToUpdate.email },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    if (!result.Attributes) {
      throw createError("User not found", 404);
    }

    const updatedUser = {
      id: result.Attributes.userId,
      userId: result.Attributes.userId,
      firstName: result.Attributes.firstName || '',
      lastName: result.Attributes.lastName || '',
      name: result.Attributes.username,
      email: result.Attributes.email,
      role: result.Attributes.role || 'SALES_REP',
      permissions: rolePermissions[result.Attributes.role?.toUpperCase()] || [],
      isDeleted: result.Attributes.isDeleted || false,
      createdAt: result.Attributes.createdAt,
      phoneNumber: result.Attributes.phoneNumber
    };

    res.json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
});

// Soft delete user
router.put("/:id/soft-delete", async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const currentUserRole = currentUser?.role;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)) {
      throw createError("Access denied. Admin or Super Admin role required.", 403);
    }

    // First, get the user to delete to check permissions
    const getUserResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": id
        }
      })
    );

    const userToDelete = getUserResult.Items?.[0];
    if (!userToDelete) {
      throw createError("User not found", 404);
    }

    // Check deletion permissions based on tenant hierarchy
    if (currentUserRole === 'ADMIN') {
      // Admins can only delete users in their own tenant, but not other admins
      if (userToDelete.tenantId !== currentUser.tenantId) {
        throw createError("Cannot delete user from different tenant", 403);
      }
      if (userToDelete.role === 'ADMIN') {
        throw createError("Admins cannot delete other admins", 403);
      }
      if (userToDelete.role === 'SUPER_ADMIN') {
        throw createError("Admins cannot delete super admins", 403);
      }
    } else if (currentUserRole === 'SUPER_ADMIN') {
      // Super admin can delete admins and users, but not other super admins
      if (userToDelete.role === 'SUPER_ADMIN' && userToDelete.userId !== currentUser.userId) {
        throw createError("Super admin cannot delete other super admins", 403);
      }
    }

    // Prevent self-deletion
    if (userToDelete.userId === currentUser.userId) {
      throw createError("Cannot delete your own account", 403);
    }

    // Perform soft delete using email as key
    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Users",
        Key: { email: userToDelete.email },
        UpdateExpression: "SET isDeleted = :isDeleted, updatedAt = :updatedAt, deletedBy = :deletedBy, deletedAt = :deletedAt",
        ExpressionAttributeValues: {
          ":isDeleted": true,
          ":updatedAt": new Date().toISOString(),
          ":deletedBy": currentUser.userId,
          ":deletedAt": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
    );

    if (!result.Attributes) {
      throw createError("Failed to delete user", 500);
    }

    res.json({ message: "User soft deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get user profile (current user)
router.get("/profile/me", async (req, res, next) => {
  try {
    const email = (req as any).user?.email;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Users",
        Key: { email }
      })
    );

    if (!result.Item) {
      throw createError("User not found", 404);
    }

    const user = {
      id: result.Item.userId,
      userId: result.Item.userId,
      firstName: result.Item.firstName || '',
      lastName: result.Item.lastName || '',
      name: result.Item.username,
      email: result.Item.email,
      role: result.Item.role || 'SALES_REP',
      tenantId: result.Item.tenantId,
      createdBy: result.Item.createdBy,
      permissions: rolePermissions[result.Item.role?.toUpperCase()] || [],
      isDeleted: result.Item.isDeleted || false,
      createdAt: result.Item.createdAt,
      phoneNumber: result.Item.phoneNumber
    };

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

export default router; 