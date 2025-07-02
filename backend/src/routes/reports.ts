import express from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";
import { createError } from "../middlewares/errorHandler";

const router = express.Router();

// Get all reports for current user
router.get("/", async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { type, status } = req.query;
    
    let filterExpression = "createdBy = :userId";
    const expressionAttributeValues: any = {
      ":userId": userId
    };

    if (type) {
      filterExpression += " AND reportType = :type";
      expressionAttributeValues[":type"] = type;
    }

    if (status) {
      filterExpression += " AND #status = :status";
      expressionAttributeValues[":status"] = status;
    }

    const result = await docClient.send(
      new ScanCommand({
        TableName: "Reports",
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(status && {
          ExpressionAttributeNames: {
            "#status": "status"
          }
        })
      })
    );

    // Sort by creation date descending
    const reports = (result.Items || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ data: reports });
  } catch (error) {
    next(error);
  }
});

// Get report by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    if (!result.Item) {
      throw createError("Report not found", 404);
    }

    // Check access - user can access their own reports or shared reports
    if (result.Item.createdBy !== userId && !result.Item.sharedWith?.includes(userId)) {
      throw createError("Access denied", 403);
    }

    res.json({ data: result.Item });
  } catch (error) {
    next(error);
  }
});

// Create new report
router.post("/", async (req, res, next) => {
  try {
    const { 
      name, 
      description,
      reportType, // 'sales', 'leads', 'contacts', 'deals', 'tasks', 'custom'
      filters,
      columns,
      chartType,
      schedule,
      isPublic = false
    } = req.body;

    if (!name || !reportType) {
      throw createError("Name and report type are required", 400);
    }

    const id = uuidv4();
    const userId = (req as any).user?.userId;
    const createdAt = new Date().toISOString();

    const report = {
      id,
      name,
      description: description || '',
      reportType,
      filters: filters || {},
      columns: columns || [],
      chartType: chartType || 'table',
      schedule: schedule || null,
      isPublic,
      isFavorite: false,
      status: 'active',
      createdBy: userId,
      createdAt,
      updatedAt: createdAt,
      lastRun: null,
      runCount: 0,
      sharedWith: []
    };

    await docClient.send(
      new PutCommand({
        TableName: "Reports",
        Item: report
      })
    );

    res.status(201).json({ data: report });
  } catch (error) {
    next(error);
  }
});

// Update report
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = (req as any).user?.userId;

    // First check if report exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Report not found", 404);
    }

    // Only creator can update
    if (getResult.Item.createdBy !== userId) {
      throw createError("Access denied. Only report creator can update.", 403);
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'createdBy' && key !== 'createdAt' && value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
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
        TableName: "Reports",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes });
  } catch (error) {
    next(error);
  }
});

// Delete report
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // First check if report exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Report not found", 404);
    }

    // Only creator can delete
    if (getResult.Item.createdBy !== userId) {
      throw createError("Access denied. Only report creator can delete.", 403);
    }

    await docClient.send(
      new DeleteCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Run report and get data
router.post("/:id/run", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // Get report configuration
    const reportResult = await docClient.send(
      new GetCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    if (!reportResult.Item) {
      throw createError("Report not found", 404);
    }

    // Check access
    if (reportResult.Item.createdBy !== userId && 
        !reportResult.Item.sharedWith?.includes(userId) && 
        !reportResult.Item.isPublic) {
      throw createError("Access denied", 403);
    }

    const report = reportResult.Item;
    let data: any[] = [];

    // Generate report data based on type
    switch (report.reportType) {
      case 'sales':
        const dealsResult = await docClient.send(new ScanCommand({ TableName: "Deals" }));
        data = dealsResult.Items || [];
        break;
      
      case 'leads':
        const leadsResult = await docClient.send(new ScanCommand({ TableName: "Leads" }));
        data = leadsResult.Items || [];
        break;
      
      case 'contacts':
        const contactsResult = await docClient.send(new ScanCommand({ TableName: "Contacts" }));
        data = contactsResult.Items || [];
        break;
      
      case 'tasks':
        const tasksResult = await docClient.send(new ScanCommand({ TableName: "Tasks" }));
        data = tasksResult.Items || [];
        break;
      
      default:
        throw createError("Unsupported report type", 400);
    }

    // Apply filters if specified
    if (report.filters && Object.keys(report.filters).length > 0) {
      data = data.filter(item => {
        return Object.entries(report.filters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    // Select only specified columns if configured
    if (report.columns && report.columns.length > 0) {
      data = data.map(item => {
        const filteredItem: any = {};
        report.columns.forEach((column: string) => {
          if (item[column] !== undefined) {
            filteredItem[column] = item[column];
          }
        });
        return filteredItem;
      });
    }

    // Update report run statistics
    await docClient.send(
      new UpdateCommand({
        TableName: "Reports",
        Key: { id },
        UpdateExpression: "SET lastRun = :lastRun, runCount = runCount + :increment",
        ExpressionAttributeValues: {
          ":lastRun": new Date().toISOString(),
          ":increment": 1
        }
      })
    );

    res.json({ 
      data: {
        reportInfo: {
          id: report.id,
          name: report.name,
          type: report.reportType,
          runAt: new Date().toISOString(),
          recordCount: data.length
        },
        results: data
      }
    });
  } catch (error) {
    next(error);
  }
});

// Toggle favorite status
router.patch("/:id/favorite", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { isFavorite } = req.body;

    // First check if report exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Report not found", 404);
    }

    // Check access
    if (getResult.Item.createdBy !== userId && 
        !getResult.Item.sharedWith?.includes(userId) && 
        !getResult.Item.isPublic) {
      throw createError("Access denied", 403);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Reports",
        Key: { id },
        UpdateExpression: "SET isFavorite = :isFavorite",
        ExpressionAttributeValues: {
          ":isFavorite": !!isFavorite
        },
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes });
  } catch (error) {
    next(error);
  }
});

// Get favorite reports
router.get("/favorites/list", async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Reports",
        FilterExpression: "(createdBy = :userId OR contains(sharedWith, :userId) OR isPublic = :isPublic) AND isFavorite = :isFavorite",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":isPublic": true,
          ":isFavorite": true
        }
      })
    );

    const reports = (result.Items || [])
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({ data: reports });
  } catch (error) {
    next(error);
  }
});

// Get scheduled reports
router.get("/scheduled/list", async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Reports",
        FilterExpression: "createdBy = :userId AND attribute_exists(schedule)",
        ExpressionAttributeValues: {
          ":userId": userId
        }
      })
    );

    const reports = (result.Items || [])
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({ data: reports });
  } catch (error) {
    next(error);
  }
});

// Share report with other users
router.post("/:id/share", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds, isPublic } = req.body;
    const userId = (req as any).user?.userId;

    // First check if report exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Reports",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Report not found", 404);
    }

    // Only creator can share
    if (getResult.Item.createdBy !== userId) {
      throw createError("Access denied. Only report creator can share.", 403);
    }

    const updateExpression = [];
    const expressionAttributeValues: any = {};

    if (userIds && Array.isArray(userIds)) {
      updateExpression.push("sharedWith = :sharedWith");
      expressionAttributeValues[":sharedWith"] = userIds;
    }

    if (typeof isPublic === 'boolean') {
      updateExpression.push("isPublic = :isPublic");
      expressionAttributeValues[":isPublic"] = isPublic;
    }

    if (updateExpression.length === 0) {
      throw createError("No sharing settings provided", 400);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Reports",
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}, updatedAt = :updatedAt`,
        ExpressionAttributeValues: {
          ...expressionAttributeValues,
          ":updatedAt": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes });
  } catch (error) {
    next(error);
  }
});

export default router; 