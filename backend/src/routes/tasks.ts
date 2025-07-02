import express, { Request, Response, NextFunction } from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  type: string;
  createdAt: string;
}

const router = express.Router();

// Get all tasks
router.get("/", (async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Tasks"
      })
    );

    res.json({ data: (result.Items as Task[]) || [] });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Get task by ID
router.get("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Tasks",
        Key: { id }
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ data: result.Item as Task });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Create new task
router.post("/", (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      title, 
      description, 
      priority = "Medium", 
      status = "Open", 
      dueDate, 
      assignee,
      type = "Follow-up"
    } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const task: Task = {
      id,
      title,
      description,
      priority,
      status,
      dueDate,
      assignee,
      type,
      createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Tasks",
        Item: task
      })
    );

    res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Update task
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
        TableName: "Tasks",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes as Task });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Delete task
router.delete("/:id", (async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await docClient.send(
      new DeleteCommand({
        TableName: "Tasks",
        Key: { id }
      })
    );

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

export default router;

export const getTasks = async (): Promise<Task[]> => {
  const result = await docClient.send(new ScanCommand({ TableName: "Tasks" }));
  return result.Items as Task[];
};