import { Router, RequestHandler } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from "uuid";

const router = Router();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Get all subsidiaries
const getAllSubsidiaries: RequestHandler = async (req, res) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: "Subsidiaries",
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": req.body.userId
      }
    }));

    res.json({ subsidiaries: result.Items || [] });
  } catch (error) {
    console.error('Get subsidiaries error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get subsidiary by ID
const getSubsidiaryById: RequestHandler = async (req, res) => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id }
    }));

    if (!result.Item) {
      res.status(404).json({ message: "Subsidiary not found" });
      return;
    }

    res.json({ subsidiary: result.Item });
  } catch (error) {
    console.error('Get subsidiary error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new subsidiary
const createSubsidiary: RequestHandler = async (req, res) => {
  try {
    const { name, industry, location, employees, revenue, parentCompany, status, userId } = req.body;
    const timestamp = new Date().toISOString();

    const subsidiary = {
      id: `subsidiary_${timestamp}`,
      name,
      industry,
      location,
      employees,
      revenue,
      parentCompany,
      status,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: "Subsidiaries",
      Item: subsidiary
    }));

    res.status(201).json({ message: "Subsidiary created successfully", subsidiary });
  } catch (error) {
    console.error('Create subsidiary error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update subsidiary
const updateSubsidiary: RequestHandler = async (req, res) => {
  try {
    const { name, industry, location, employees, revenue, parentCompany, status } = req.body;
    const timestamp = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id },
      UpdateExpression: "set #name = :name, industry = :industry, #location = :location, employees = :employees, revenue = :revenue, parentCompany = :parentCompany, #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#location": "location",
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":industry": industry,
        ":location": location,
        ":employees": employees,
        ":revenue": revenue,
        ":parentCompany": parentCompany,
        ":status": status,
        ":updatedAt": timestamp
      },
      ReturnValues: "ALL_NEW"
    }));

    if (!result.Attributes) {
      res.status(404).json({ message: "Subsidiary not found" });
      return;
    }

    res.json({ message: "Subsidiary updated successfully", subsidiary: result.Attributes });
  } catch (error) {
    console.error('Update subsidiary error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete subsidiary
const deleteSubsidiary: RequestHandler = async (req, res) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: "Subsidiaries",
      Key: { id: req.params.id }
    }));

    res.json({ message: "Subsidiary deleted successfully" });
  } catch (error) {
    console.error('Delete subsidiary error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.get("/", getAllSubsidiaries);
router.get("/:id", getSubsidiaryById);
router.post("/", createSubsidiary);
router.put("/:id", updateSubsidiary);
router.delete("/:id", deleteSubsidiary);

export default router;
