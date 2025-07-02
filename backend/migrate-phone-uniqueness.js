const { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const clientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
  }
};

// Use local endpoint if specified
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const client = new DynamoDBClient(clientConfig);

async function addPhoneNumberIndex() {
  try {
    console.log("Adding PhoneNumberIndex to Users table...");
    
    // First check if the index already exists
    const describeResult = await client.send(
      new DescribeTableCommand({ TableName: "Users" })
    );
    
    const existingIndexes = describeResult.Table?.GlobalSecondaryIndexes || [];
    const phoneIndexExists = existingIndexes.some(index => index.IndexName === "PhoneNumberIndex");
    
    if (phoneIndexExists) {
      console.log("PhoneNumberIndex already exists, skipping migration.");
      return;
    }
    
    // Add the new GSI
    const updateCommand = new UpdateTableCommand({
      TableName: "Users",
      AttributeDefinitions: [
        { AttributeName: "phoneNumber", AttributeType: "S" }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: "PhoneNumberIndex",
            KeySchema: [
              { AttributeName: "phoneNumber", KeyType: "HASH" }
            ],
            Projection: {
              ProjectionType: "ALL"
            }
          }
        }
      ]
    });
    
    await client.send(updateCommand);
    console.log("PhoneNumberIndex added successfully!");
    
    // Wait for the index to become active
    console.log("Waiting for index to become active...");
    let indexActive = false;
    while (!indexActive) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const checkResult = await client.send(
        new DescribeTableCommand({ TableName: "Users" })
      );
      
      const phoneIndex = checkResult.Table?.GlobalSecondaryIndexes?.find(
        index => index.IndexName === "PhoneNumberIndex"
      );
      
      if (phoneIndex?.IndexStatus === "ACTIVE") {
        indexActive = true;
        console.log("PhoneNumberIndex is now active!");
      } else {
        console.log(`Index status: ${phoneIndex?.IndexStatus || 'UNKNOWN'}, waiting...`);
      }
    }
    
  } catch (error) {
    console.error("Error adding PhoneNumberIndex:", error);
    throw error;
  }
}

async function main() {
  try {
    await addPhoneNumberIndex();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addPhoneNumberIndex }; 