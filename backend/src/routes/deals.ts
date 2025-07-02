import express, { Request, Response, NextFunction } from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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
  createdAt: string;
}

const router = express.Router();

// Get all deals
router.get("/", (async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Deals"
      })
    );

    res.json({ data: (result.Items as Deal[]) || [] });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Get deal by ID
router.get("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Deals",
        Key: { id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "Deal not found" });
    }

    res.json({ data: result.Item as Deal });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Create new deal
router.post("/", (async (req: Request, res: Response, next: NextFunction) => {
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
router.delete("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

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
