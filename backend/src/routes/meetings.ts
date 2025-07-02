import express from "express";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dynamoClient";
import { v4 as uuidv4 } from "uuid";
import { createError } from "../middlewares/errorHandler";

const router = express.Router();

// Get all meetings for current user
router.get("/", async (req, res, next) => {
  try {
    const currentUser = (req as any).user?.email;
    const { startDate, endDate, status } = req.query;
    
    let filterExpression = "contains(attendees, :currentUser)";
    const expressionAttributeValues: any = {
      ":currentUser": currentUser
    };

    if (status) {
      filterExpression += " AND #status = :status";
      expressionAttributeValues[":status"] = status;
    }

    if (startDate && endDate) {
      filterExpression += " AND startTime BETWEEN :startDate AND :endDate";
      expressionAttributeValues[":startDate"] = startDate;
      expressionAttributeValues[":endDate"] = endDate;
    }

    const result = await docClient.send(
      new ScanCommand({
        TableName: "Meetings",
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(status && {
          ExpressionAttributeNames: {
            "#status": "status"
          }
        })
      })
    );

    // Sort by start time
    const meetings = (result.Items || [])
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    res.json({ data: meetings });
  } catch (error) {
    next(error);
  }
});

// Get meeting by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user?.email;
    
    const result = await docClient.send(
      new GetCommand({
        TableName: "Meetings",
        Key: { id }
      })
    );

    if (!result.Item) {
      throw createError("Meeting not found", 404);
    }

    // Check if user is an attendee
    if (!result.Item.attendees?.includes(currentUser)) {
      throw createError("Access denied", 403);
    }

    res.json({ data: result.Item });
  } catch (error) {
    next(error);
  }
});

// Create new meeting
router.post("/", async (req, res, next) => {
  try {
    const { 
      title, 
      attendees = [],
      startTime, 
      endTime, 
      location, 
      description,
      type = 'meeting'
    } = req.body;

    if (!title || !startTime || !endTime) {
      throw createError("Title, start time, and end time are required", 400);
    }

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      throw createError("End time must be after start time", 400);
    }

    const id = uuidv4();
    const createdBy = (req as any).user?.email;
    const createdAt = new Date().toISOString();

    // Ensure creator is in attendees list
    const allAttendees = [...new Set([createdBy, ...attendees])];

    const meeting = {
      id,
      title,
      attendees: allAttendees,
      startTime,
      endTime,
      location: location || 'Virtual Meeting',
      description: description || '',
      status: 'Scheduled',
      type,
      createdBy,
      createdAt,
      updatedAt: createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: "Meetings",
        Item: meeting
      })
    );

    res.status(201).json({ data: meeting });
  } catch (error) {
    next(error);
  }
});

// Update meeting
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = (req as any).user?.email;

    // First check if meeting exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Meetings",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Meeting not found", 404);
    }

    // Only creator or attendees can update
    if (getResult.Item.createdBy !== currentUser && 
        !getResult.Item.attendees?.includes(currentUser)) {
      throw createError("Access denied", 403);
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'createdBy' && key !== 'createdAt' && value !== undefined) {
        // Validate time updates
        if (key === 'startTime' || key === 'endTime') {
          const time = new Date(value as string);
          if (isNaN(time.getTime())) {
            throw createError(`Invalid ${key}`, 400);
          }
        }

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
      throw createError("No valid fields to update", 400);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Meetings",
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes });
  } catch (error) {
    next(error);
  }
});

// Delete meeting
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user?.email;

    // First check if meeting exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Meetings",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Meeting not found", 404);
    }

    // Only creator can delete
    if (getResult.Item.createdBy !== currentUser) {
      throw createError("Access denied. Only meeting creator can delete.", 403);
    }

    await docClient.send(
      new DeleteCommand({
        TableName: "Meetings",
        Key: { id }
      })
    );

    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Cancel meeting (update status)
router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user?.email;
    const { reason } = req.body;

    // First check if meeting exists and user has access
    const getResult = await docClient.send(
      new GetCommand({
        TableName: "Meetings",
        Key: { id }
      })
    );

    if (!getResult.Item) {
      throw createError("Meeting not found", 404);
    }

    // Only creator can cancel
    if (getResult.Item.createdBy !== currentUser) {
      throw createError("Access denied. Only meeting creator can cancel.", 403);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: "Meetings",
        Key: { id },
        UpdateExpression: "SET #status = :status, cancellationReason = :reason, cancelledAt = :cancelledAt, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "Cancelled",
          ":reason": reason || "No reason provided",
          ":cancelledAt": new Date().toISOString(),
          ":updatedAt": new Date().toISOString()
        },
        ReturnValues: "ALL_NEW"
      })
    );

    res.json({ data: result.Attributes });
  } catch (error) {
    next(error);
  }
});

// Get calendar events (simplified format for frontend calendar components)
router.get("/calendar/events", async (req, res, next) => {
  try {
    const currentUser = (req as any).user?.email;
    const { month, year } = req.query;
    
    let filterExpression = "contains(attendees, :currentUser)";
    const expressionAttributeValues: any = {
      ":currentUser": currentUser
    };

    // If month and year provided, filter by that month
    if (month && year) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();
      
      filterExpression += " AND startTime BETWEEN :startOfMonth AND :endOfMonth";
      expressionAttributeValues[":startOfMonth"] = startOfMonth;
      expressionAttributeValues[":endOfMonth"] = endOfMonth;
    }

    const result = await docClient.send(
      new ScanCommand({
        TableName: "Meetings",
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues
      })
    );

    // Transform to calendar event format
    const events = (result.Items || []).map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.startTime.split('T')[0], // YYYY-MM-DD
      time: meeting.startTime.split('T')[1]?.substring(0, 5), // HH:MM
      type: meeting.type || 'meeting',
      attendees: meeting.attendees,
      location: meeting.location,
      status: meeting.status
    }));

    res.json({ data: events });
  } catch (error) {
    next(error);
  }
});

// Get upcoming meetings (next 7 days)
router.get("/upcoming", async (req, res, next) => {
  try {
    const currentUser = (req as any).user?.email;
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const result = await docClient.send(
      new ScanCommand({
        TableName: "Meetings",
        FilterExpression: "contains(attendees, :currentUser) AND startTime BETWEEN :now AND :weekFromNow AND #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":currentUser": currentUser,
          ":now": now.toISOString(),
          ":weekFromNow": weekFromNow.toISOString(),
          ":status": "Scheduled"
        }
      })
    );

    // Sort by start time
    const meetings = (result.Items || [])
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    res.json({ data: meetings });
  } catch (error) {
    next(error);
  }
});

export default router; 