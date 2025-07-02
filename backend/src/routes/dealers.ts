import express, { Request, Response, NextFunction } from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";

interface Dealer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  territory: string;
  status: string;
  createdAt: string;
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

// Get all dealers
router.get("/", (async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Dealers"
      })
    );

    res.json({ data: (result.Items as Dealer[]) || [] });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Get dealer by ID
router.get("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Dealers",
        Key: { id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "Dealer not found" });
    }

    res.json({ data: result.Item as Dealer });
  } catch (error) {
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
      createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Dealers",
        Item: dealer
      })
    );

    res.status(201).json({ data: dealer });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Update dealer
router.put("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
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
    next(error);
  }
}) as express.RequestHandler);

// Delete dealer
router.delete("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await docClient.send(
      new DeleteCommand({
        TableName: "Dealers",
        Key: { id }
      })
    );

    res.json({ message: "Dealer deleted successfully" });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

export default router;
