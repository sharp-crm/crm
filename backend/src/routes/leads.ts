import express, { Request, Response, NextFunction } from "express";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  value: number;
  status: string;
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

// Get all leads for tenant
router.get("/", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "Leads",
        IndexName: "TenantIdIndex",
        KeyConditionExpression: "tenantId = :tenantId",
        ExpressionAttributeValues: {
          ":tenantId": tenantId
        }
      })
    );

    res.json({ data: (result.Items as Lead[]) || [] });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Get lead by ID (tenant-aware)
router.get("/:id", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Leads",
        Key: { id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Check if lead belongs to the same tenant
    if (result.Item.tenantId !== tenantId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ data: result.Item as Lead });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Create new lead
router.post("/", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, company, email, phone, source, value, status = "New" } = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const lead: Lead = {
      id,
      name,
      company,
      email,
      phone,
      source,
      value: Number(value) || 0,
      status,
      tenantId,
      createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Leads",
        Item: lead
      })
    );

    res.status(201).json({ data: lead });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Update lead
router.put("/:id", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    // First check if lead exists and belongs to tenant
    const existingLead = await docClient.send(
      new GetCommand({
        TableName: "Leads",
        Key: { id }
      })
    );

    if (!existingLead.Item || existingLead.Item.tenantId !== tenantId) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'tenantId') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    }

    if (updateExpressions.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Leads",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes as Lead });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Delete lead
router.delete("/:id", (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    // First check if lead exists and belongs to tenant
    const existingLead = await docClient.send(
      new GetCommand({
        TableName: "Leads",
        Key: { id }
      })
    );

    if (!existingLead.Item || existingLead.Item.tenantId !== tenantId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: "Leads",
        Key: { id }
      })
    );

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

export default router;
