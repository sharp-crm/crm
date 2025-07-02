require('dotenv').config();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

console.log('Testing DynamoDB connection...');
console.log('DYNAMODB_ENDPOINT:', process.env.DYNAMODB_ENDPOINT);

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function testConnection() {
  try {
    console.log('Attempting to query user: shashanth@sharp.com');
    const result = await docClient.send(new GetCommand({
      TableName: "Users",
      Key: { email: "shashanth@sharp.com" }
    }));
    
    if (result.Item) {
      console.log('✅ User found:', result.Item.email, result.Item.firstName);
      console.log('Password hash length:', result.Item.password?.length);
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection(); 