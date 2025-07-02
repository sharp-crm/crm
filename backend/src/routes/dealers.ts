import express, { Request, Response, NextFunction } from "express";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "../middlewares/authenticate";

interface Dealer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  territory: string;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

interface DealerResponse {
  data: Dealer;
}

interface DealersResponse {
  data: Dealer[];
}

interface MessageResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
}

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all dealers for the current tenant
router.get("/", (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "Dealers",
        IndexName: "TenantIdIndex",
        KeyConditionExpression: "tenantId = :tenantId",
        ExpressionAttributeValues: {
          ":tenantId": tenantId
        }
      })
    );

    res.json({ data: (result.Items as Dealer[]) || [] });
  } catch (error) {
    console.error('Get dealers error:', error);
    next(error);
  }
}) as express.RequestHandler);

// Get dealer by ID
router.get("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Dealers",
        Key: { id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "Dealer not found" });
    }

    // Verify tenant ownership
    if (result.Item.tenantId !== tenantId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ data: result.Item as Dealer });
  } catch (error) {
    console.error('Get dealer error:', error);
    next(error);
  }
}) as express.RequestHandler);

// Create new dealer
router.post("/", (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      company, 
      location, 
      territory,
      status = "Active"
    } = req.body;
    
    const tenantId = (req as any).user?.tenantId;
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const dealer: Dealer = {
      id,
      name,
      email,
      phone,
      company,
      location,
      territory,
      status,
      tenantId,
      createdAt,
      updatedAt: createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Dealers",
        Item: dealer
      })
    );

    res.status(201).json({ data: dealer });
  } catch (error) {
    console.error('Create dealer error:', error);
    next(error);
  }
}) as express.RequestHandler);

// Update dealer
router.put("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = (req as any).user?.tenantId;
    
    // First verify the dealer exists and belongs to the tenant
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Dealers",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      return res.status(404).json({ error: "Dealer not found" });
    }

    if (getResult.Item.tenantId !== tenantId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'tenantId' && key !== 'createdAt') {
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
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Dealers",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes as Dealer });
  } catch (error) {
    console.error('Update dealer error:', error);
    next(error);
  }
}) as express.RequestHandler);

// Delete dealer
router.delete("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId;

    // First verify the dealer exists and belongs to the tenant
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Dealers",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      return res.status(404).json({ error: "Dealer not found" });
    }

    if (getResult.Item.tenantId !== tenantId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: "Dealers",
        Key: { id }
      })
    );

    res.json({ message: "Dealer deleted successfully" });
  } catch (error) {
    console.error('Delete dealer error:', error);
    next(error);
  }
}) as express.RequestHandler);

export default router;
