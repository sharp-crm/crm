import express, { Request, Response, NextFunction } from "express";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";

interface Deal {
  id: string;
  name: string;
  account: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  tenantId: string;
  createdAt: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

const router = express.Router();

// Get all deals for tenant
router.get("/", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "Deals",
        IndexName: "TenantIdIndex",
        KeyConditionExpression: "tenantId = :tenantId",
        ExpressionAttributeValues: {
          ":tenantId": tenantId
        }
      })
    );

    res.json({ data: (result.Items as Deal[]) || [] });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Get deal by ID (tenant-aware)
router.get("/:id", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Deals",
        Key: { id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Check if deal belongs to the same tenant
    if (result.Item.tenantId !== tenantId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ data: result.Item as Deal });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Create new deal
router.post("/", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      name, 
      account, 
      value, 
      stage = "Prospecting", 
      probability = 0, 
      closeDate, 
      owner 
    } = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const deal: Deal = {
      id,
      name,
      account,
      value: Number(value) || 0,
      stage,
      probability: Number(probability) || 0,
      closeDate,
      owner,
      tenantId,
      createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Deals",
        Item: deal
      })
    );

    res.status(201).json({ data: deal });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Update deal
router.put("/:id", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    // First check if deal exists and belongs to tenant
    const existingDeal = await docClient.send(
      new GetCommand({
        TableName: "Deals",
        Key: { id }
      })
    );

    if (!existingDeal.Item || existingDeal.Item.tenantId !== tenantId) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'tenantId') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = key === 'value' || key === 'probability' 
          ? Number(value) || 0 
          : value;
      }
    }

    if (updateExpressions.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Deals",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes as Deal });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Delete deal
router.delete("/:id", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    // First check if deal exists and belongs to tenant
    const existingDeal = await docClient.send(
      new GetCommand({
        TableName: "Deals",
        Key: { id }
      })
    );

    if (!existingDeal.Item || existingDeal.Item.tenantId !== tenantId) {
      return res.status(404).json({ error: "Deal not found" });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: "Deals",
        Key: { id }
      })
    );

    res.json({ message: "Deal deleted successfully" });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

export default router;
