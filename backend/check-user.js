require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Configure DynamoDB client
const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
  }
};

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

async function checkUser() {
  try {
    console.log('Checking user data...');
    const result = await docClient.send(new GetCommand({
      TableName: 'Users',
      Key: { email: 'john@sharp.com' }
    }));
    
    console.log('User from DB:', JSON.stringify(result.Item, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser(); 