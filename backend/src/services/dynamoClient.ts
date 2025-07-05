import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configure DynamoDB client for local development
const clientConfig: any = {
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey"
  }
};

console.log(`🐳 Using local DynamoDB at http://localhost:8000`);

const client = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table names for easy reference
export const TABLES = {
  USERS: "Users",
  CONTACTS: "Contacts",
  LEADS: "Leads",
  DEALS: "Deals",
  TASKS: "Tasks",
  SUBSIDIARIES: "Subsidiaries",
  DEALERS: "Dealers",
  NOTIFICATIONS: "Notifications",
  REPORTS: "Reports"
};

// Helper function to handle DynamoDB errors
export const handleDynamoError = (error: any, operation: string = "operation") => {
  console.error(`DynamoDB ${operation} error:`, error);
  
  if (error.name === 'ConditionalCheckFailedException') {
    throw new Error('Record has been modified by another user');
  }
  
  if (error.name === 'ValidationException') {
    throw new Error('Invalid data provided');
  }
  
  if (error.name === 'ResourceNotFoundException') {
    throw new Error('Table or item not found');
  }
  
  if (error.name === 'ProvisionedThroughputExceededException') {
    throw new Error('Database is temporarily overloaded, please try again');
  }
  
  // Generic error
  throw new Error(`Database ${operation} failed`);
};

