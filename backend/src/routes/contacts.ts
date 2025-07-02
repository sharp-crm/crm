import { Router, RequestHandler } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from "uuid";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

const router = Router();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Get all contacts for tenant
const getAllContacts: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const result = await docClient.send(new QueryCommand({
      TableName: "Contacts",
      IndexName: "TenantIdIndex",
      KeyConditionExpression: "tenantId = :tenantId",
      ExpressionAttributeValues: {
        ":tenantId": tenantId
      }
    }));

    res.json({ data: result.Items || [] });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get contact by ID (tenant-aware)
const getContactById: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const result = await docClient.send(new GetCommand({
      TableName: "Contacts",
      Key: { id: req.params.id }
    }));

    if (!result.Item) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    // Check if contact belongs to the same tenant
    if (result.Item.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ data: result.Item });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new contact
const createContact: RequestHandler = async (req: any, res) => {
  try {
    const { name, email, phone, company, position, status } = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const contact = {
      id,
      name,
      email,
      phone,
      company,
      position,
      status: status || 'Active',
      tenantId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: "Contacts",
      Item: contact
    }));

    res.status(201).json({ message: "Contact created successfully", data: contact });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update contact
const updateContact: RequestHandler = async (req: any, res) => {
  try {
    const { name, email, phone, company, position, status } = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    // First check if contact exists and belongs to tenant
    const existingContact = await docClient.send(new GetCommand({
      TableName: "Contacts",
      Key: { id: req.params.id }
    }));

    if (!existingContact.Item || existingContact.Item.tenantId !== tenantId) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    const timestamp = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: "Contacts",
      Key: { id: req.params.id },
      UpdateExpression: "set #name = :name, email = :email, phone = :phone, company = :company, #position = :position, #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#position": "position",
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":email": email,
        ":phone": phone,
        ":company": company,
        ":position": position,
        ":status": status,
        ":updatedAt": timestamp
      },
      ReturnValues: "ALL_NEW"
    }));

    if (!result.Attributes) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    res.json({ message: "Contact updated successfully", data: result.Attributes });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete contact
const deleteContact: RequestHandler = async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    // First check if contact exists and belongs to tenant
    const existingContact = await docClient.send(new GetCommand({
      TableName: "Contacts",
      Key: { id: req.params.id }
    }));

    if (!existingContact.Item || existingContact.Item.tenantId !== tenantId) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    await docClient.send(new DeleteCommand({
      TableName: "Contacts",
      Key: { id: req.params.id }
    }));

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.get("/", getAllContacts);
router.get("/:id", getContactById);
router.post("/", createContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
