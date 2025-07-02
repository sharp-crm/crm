const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
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

async function testPhoneUniqueness() {
  console.log("🧪 Testing phone number uniqueness...");
  
  const testPhone = "+1234567890";
  const testUsers = [
    {
      userId: uuidv4(),
      email: "test1@phone.com",
      username: "Test User 1",
      firstName: "Test",
      lastName: "User1",
      password: await bcrypt.hash("password123", 10),
      role: "SALES_REP",
      tenantId: "test-tenant",
      createdBy: "SYSTEM",
      phoneNumber: testPhone,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      userId: uuidv4(),
      email: "test2@phone.com", 
      username: "Test User 2",
      firstName: "Test",
      lastName: "User2",
      password: await bcrypt.hash("password123", 10),
      role: "SALES_REP",
      tenantId: "test-tenant",
      createdBy: "SYSTEM",
      phoneNumber: testPhone, // Same phone number - should fail
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    // Create first user
    console.log("Creating first user with phone:", testPhone);
    await docClient.send(
      new PutCommand({
        TableName: "Users",
        Item: testUsers[0]
      })
    );
    console.log("✅ First user created successfully");

    // Try to create second user with same phone number
    console.log("Attempting to create second user with same phone:", testPhone);
    try {
      await docClient.send(
        new PutCommand({
          TableName: "Users",
          Item: testUsers[1],
          ConditionExpression: "attribute_not_exists(email)" // This won't catch phone uniqueness
        })
      );
      console.log("⚠️  Second user created - phone uniqueness not enforced at DB level");
    } catch (error) {
      console.log("✅ Second user creation failed as expected:", error.message);
    }

    // Check if both users exist (they shouldn't if uniqueness works)
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "phoneNumber = :phone",
        ExpressionAttributeValues: {
          ":phone": testPhone
        }
      })
    );

    console.log(`\n📊 Users found with phone ${testPhone}:`, scanResult.Items?.length || 0);
    if (scanResult.Items && scanResult.Items.length > 1) {
      console.log("⚠️  Multiple users found with same phone number - application-level validation needed");
    }

    // Cleanup test users
    console.log("\n🧹 Cleaning up test users...");
    for (const user of testUsers) {
      try {
        await docClient.send(
          new PutCommand({
            TableName: "Users",
            Item: {
              email: user.email,
              isDeleted: true,
              deletedAt: new Date().toISOString()
            }
          })
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    console.log("✅ Cleanup completed");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function main() {
  try {
    await testPhoneUniqueness();
    console.log("\n✅ Phone uniqueness test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testPhoneUniqueness }; 