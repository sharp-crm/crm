import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configure DynamoDB client
const clientConfig: any = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
  }
};

// Use local endpoint if specified (for Docker DynamoDB Local)
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  console.log(`🐳 Using local DynamoDB at ${process.env.DYNAMODB_ENDPOINT}`);
} else {
  console.log(`☁️ Using AWS DynamoDB in region ${clientConfig.region}`);
}

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
  ACCOUNTS: "Accounts",
  SUBSIDIARIES: "Subsidiaries",
  DEALERS: "Dealers",
  NOTIFICATIONS: "Notifications",
  MEETINGS: "Meetings",
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

