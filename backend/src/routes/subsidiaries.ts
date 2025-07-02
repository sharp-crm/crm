import { Router, RequestHandler } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "../middlewares/authenticate";

const router = Router();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all subsidiaries for the current tenant
const getAllSubsidiaries: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID is required" });
      return;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: "Subsidiaries",
      IndexName: "TenantIdIndex",
      KeyConditionExpression: "tenantId = :tenantId",
      ExpressionAttributeValues: {
        ":tenantId": tenantId
      }
    }));

    res.json({ data: result.Items || [] });
  } catch (error) {
    console.error('Get subsidiaries error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get subsidiary by ID
const getSubsidiaryById: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    const result = await docClient.send(new GetCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id }
    }));

    if (!result.Item) {
      res.status(404).json({ error: "Subsidiary not found" });
      return;
    }

    // Verify tenant ownership
    if (result.Item.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ data: result.Item });
  } catch (error) {
    console.error('Get subsidiary error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new subsidiary
const createSubsidiary: RequestHandler = async (req, res) => {
  try {
    const { name, email, address, contact, totalEmployees } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const timestamp = new Date().toISOString();

    const subsidiary = {
      id: uuidv4(),
      name,
      email,
      address,
      contact,
      totalEmployees,
      tenantId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: "Subsidiaries",
      Item: subsidiary
    }));

    res.status(201).json({ data: subsidiary });
  } catch (error) {
    console.error('Create subsidiary error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update subsidiary
const updateSubsidiary: RequestHandler = async (req, res) => {
  try {
    const { name, email, address, contact, totalEmployees } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const timestamp = new Date().toISOString();

    // First verify the subsidiary exists and belongs to the tenant
    const getResult = await docClient.send(new GetCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id }
    }));

    if (!getResult.Item) {
      res.status(404).json({ error: "Subsidiary not found" });
      return;
    }

    if (getResult.Item.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id },
      UpdateExpression: "set #name = :name, email = :email, address = :address, contact = :contact, totalEmployees = :totalEmployees, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":email": email,
        ":address": address,
        ":contact": contact,
        ":totalEmployees": totalEmployees,
        ":updatedAt": timestamp
      },
      ReturnValues: "ALL_NEW"
    }));

    if (!result.Attributes) {
      res.status(404).json({ error: "Subsidiary not found" });
      return;
    }

    res.json({ data: result.Attributes });
  } catch (error) {
    console.error('Update subsidiary error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete subsidiary
const deleteSubsidiary: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId;

    // First verify the subsidiary exists and belongs to the tenant
    const getResult = await docClient.send(new GetCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id }
    }));

    if (!getResult.Item) {
      res.status(404).json({ error: "Subsidiary not found" });
      return;
    }

    if (getResult.Item.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await docClient.send(new DeleteCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id }
    }));

    res.json({ message: "Subsidiary deleted successfully" });
  } catch (error) {
    console.error('Delete subsidiary error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.get("/", getAllSubsidiaries);
router.get("/:id", getSubsidiaryById);
router.post("/", createSubsidiary);
router.put("/:id", updateSubsidiary);
router.delete("/:id", deleteSubsidiary);

export default router;
