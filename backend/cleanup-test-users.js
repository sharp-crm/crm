const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
require('dotenv').config();

const clientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
  }
};

if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...\n');

  try {
    // Find all test users
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "contains(email, :testDomain1) OR contains(email, :testDomain2) OR contains(email, :testDomain3)",
        ExpressionAttributeValues: {
          ":testDomain1": "phonetest",
          ":testDomain2": "emailtest",
          ":testDomain3": "deletetest"
        }
      })
    );

    const testUsers = scanResult.Items || [];
    console.log(`Found ${testUsers.length} test users to clean up:`);
    
    testUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - Phone: ${user.phoneNumber || 'N/A'}`);
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found to clean up');
      return;
    }

    // Mark all test users as deleted
    console.log('\nMarking test users as deleted...');
    for (const user of testUsers) {
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: "Users",
            Key: { email: user.email },
            UpdateExpression: "SET isDeleted = :isDeleted, deletedAt = :deletedAt, deletedBy = :deletedBy",
            ExpressionAttributeValues: {
              ":isDeleted": true,
              ":deletedAt": new Date().toISOString(),
              ":deletedBy": "CLEANUP_SCRIPT"
            }
          })
        );
        console.log(`  ✅ Marked ${user.email} as deleted`);
      } catch (error) {
        console.log(`  ❌ Failed to delete ${user.email}:`, error.message);
      }
    }

    console.log('\n✅ Test user cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function main() {
  try {
    await cleanupTestUsers();
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupTestUsers }; 