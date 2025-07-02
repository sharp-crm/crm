const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

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

async function viewDatabase() {
  console.log("👀 Viewing Sharp CRM Database Entries\n");
  console.log("=====================================\n");
  
  const tables = [
    "Users", "Contacts", "Leads", "Deals", "Tasks", 
    "Accounts", "Subsidiaries", "Dealers", "Notifications", 
    "Meetings", "Reports"
  ];
  
  for (const tableName of tables) {
    try {
      console.log(`📋 TABLE: ${tableName}`);
      console.log("─".repeat(50));
      
      const response = await docClient.send(new ScanCommand({
        TableName: tableName
      }));
      
      if (response.Items && response.Items.length > 0) {
        console.log(`📊 Found ${response.Items.length} entries:\n`);
        
        response.Items.forEach((item, index) => {
          console.log(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
          console.log("");
        });
      } else {
        console.log("📭 No entries found\n");
      }
      
    } catch (error) {
      console.log(`❌ Error reading ${tableName}: ${error.message}\n`);
    }
  }
}

// Add command line argument support
const args = process.argv.slice(2);
if (args.length > 0) {
  const tableName = args[0];
  console.log(`👀 Viewing table: ${tableName}\n`);
  
  (async () => {
    try {
      const response = await docClient.send(new ScanCommand({
        TableName: tableName
      }));
      
      if (response.Items && response.Items.length > 0) {
        console.log(`📊 Found ${response.Items.length} entries in ${tableName}:\n`);
        response.Items.forEach((item, index) => {
          console.log(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
          console.log("");
        });
      } else {
        console.log(`📭 No entries found in ${tableName}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  })();
} else {
  viewDatabase();
} 