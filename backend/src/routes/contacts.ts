import { Router, RequestHandler } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from "uuid";

const router = Router();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Get all contacts
const getAllContacts: RequestHandler = async (req, res) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: "Contacts",
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": req.body.userId
      }
    }));

    res.json({ contacts: result.Items || [] });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get contact by ID
const getContactById: RequestHandler = async (req, res) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: "Contacts",
      Key: { id: req.params.id }
    }));

    if (!result.Item) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    res.json({ contact: result.Item });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new contact
const createContact: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, company, status, source, userId } = req.body;
    const timestamp = new Date().toISOString();

    const contact = {
      id: `contact_${timestamp}`,
      name,
      email,
      phone,
      company,
      status,
      source,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: "Contacts",
      Item: contact
    }));

    res.status(201).json({ message: "Contact created successfully", contact });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update contact
const updateContact: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body;
    const timestamp = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: "Contacts",
      Key: { id: req.params.id },
      UpdateExpression: "set #name = :name, email = :email, phone = :phone, company = :company, #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":email": email,
        ":phone": phone,
        ":company": company,
        ":status": status,
        ":updatedAt": timestamp
      },
      ReturnValues: "ALL_NEW"
    }));

    if (!result.Attributes) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    res.json({ message: "Contact updated successfully", contact: result.Attributes });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete contact
const deleteContact: RequestHandler = async (req, res) => {
  try {
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
