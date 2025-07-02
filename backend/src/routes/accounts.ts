import express from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";
import { createError } from "../middlewares/errorHandler";

const router = express.Router();

// Get all accounts
router.get("/", async (req, res, next) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Accounts"
      })
    );

    res.json({ data: result.Items || [] });
  } catch (error) {
    next(error);
  }
});

// Get account by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Accounts",
        Key: { id }
      })
    );

    if (!result.Item) {
      throw createError("Account not found", 404);
    }

    res.json({ data: result.Item });
  } catch (error) {
    next(error);
  }
});

// Create new account
router.post("/", async (req, res, next) => {
  try {
    const { 
      name, 
      industry, 
      revenue, 
      employees, 
      website, 
      status = "Active",
      owner,
      address,
      phone,
      email,
      description
    } = req.body;

    if (!name) {
      throw createError("Account name is required", 400);
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const account = {
      id,
      name,
      industry,
      revenue: Number(revenue) || 0,
      employees: Number(employees) || 0,
      website,
      status,
      owner: owner || (req as any).user?.email,
      address,
      phone,
      email,
      description,
      createdAt,
      updatedAt: createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Accounts",
        Item: account
      })
    );

    res.status(201).json({ data: account });
  } catch (error) {
    next(error);
  }
});

// Update account
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = 
          (key === 'revenue' || key === 'employees') 
            ? Number(value) || 0 
            : value;
      }
    }

    // Add updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      throw createError("No valid fields to update", 400);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Accounts",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    if (!result.Attributes) {
      throw createError("Account not found", 404);
    }

    res.json({ data: result.Attributes });
  } catch (error) {
    next(error);
  }
});

// Delete account
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    await docClient.send(
      new DeleteCommand({
        TableName: "Accounts",
        Key: { id }
      })
    );

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get accounts by industry
router.get("/industry/:industry", async (req, res, next) => {
  try {
    const { industry } = req.params;
    
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Accounts",
        FilterExpression: "industry = :industry",
        ExpressionAttributeValues: {
          ":industry": industry
        }
      })
    );

    res.json({ data: result.Items || [] });
  } catch (error) {
    next(error);
  }
});

// Get accounts by owner
router.get("/owner/:owner", async (req, res, next) => {
  try {
    const { owner } = req.params;
    
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Accounts",
        FilterExpression: "#owner = :owner",
        ExpressionAttributeNames: {
          "#owner": "owner"
        },
        ExpressionAttributeValues: {
          ":owner": owner
        }
      })
    );

    res.json({ data: result.Items || [] });
  } catch (error) {
    next(error);
  }
});

export default router; 