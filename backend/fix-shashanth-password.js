const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

// Configure client for local DynamoDB
const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey"
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function fixShashanth() {
  try {
    const hashedPassword = "$2a$10$TUpV8KXKxRwSptERFw0d5.pR/LZg4klrFThUJsNSNlJfL5D3h6biS";
    
    await docClient.send(new UpdateCommand({
      TableName: "Users",
      Key: { email: "shashanth@sharp.com" },
      UpdateExpression: "SET password = :password, updatedAt = :timestamp",
      ExpressionAttributeValues: {
        ":password": hashedPassword,
        ":timestamp": new Date().toISOString()
      }
    }));
    
    console.log("✅ Shashanth's password has been properly hashed");
  } catch (error) {
    console.error("❌ Error updating password:", error.message);
  }
}

fixShashanth(); 