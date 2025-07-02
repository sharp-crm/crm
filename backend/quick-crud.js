const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

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

// Command line arguments
const [,, command, ...args] = process.argv;
const table = args[0];
const params = args.slice(1);

// Usage function
function showUsage() {
  console.log("🚀 Quick CRUD Commands for Sharp CRM Database");
  console.log("=============================================");
  console.log("");
  console.log("📖 READ:");
  console.log("  node quick-crud.js read <table>");
  console.log("  node quick-crud.js read Users");
  console.log("");
  console.log("➕ CREATE:");
  console.log("  node quick-crud.js create-contact <firstName> <lastName> <email> <company>");
  console.log("  node quick-crud.js create-lead <firstName> <lastName> <email> <company>");
  console.log("  node quick-crud.js create-deal <title> <amount> <contactId>");
  console.log("  node quick-crud.js create-task <title> <description> <assignedTo>");
  console.log("");
  console.log("🗑️  DELETE:");
  console.log("  node quick-crud.js delete <table> <id>");
  console.log("  node quick-crud.js delete Contacts contact-id-here");
  console.log("");
  console.log("📊 STATS:");
  console.log("  node quick-crud.js stats");
  console.log("");
  console.log("Examples:");
  console.log("  node quick-crud.js create-contact John Doe john@example.com 'Acme Corp'");
  console.log("  node quick-crud.js create-lead Jane Smith jane@company.com 'Big Company'");
  console.log("  node quick-crud.js read Contacts");
  console.log("  node quick-crud.js stats");
}

// READ operation
async function readTable(tableName) {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: tableName
    }));
    
    console.log(`📖 ${tableName} Records:`);
    console.log("═".repeat(50));
    
    if (response.Items && response.Items.length > 0) {
      response.Items.forEach((item, index) => {
        console.log(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
        console.log("─".repeat(30));
      });
      console.log(`\n📊 Total: ${response.Items.length} records`);
    } else {
      console.log("📭 No records found");
    }
  } catch (error) {
    console.log(`❌ Error reading ${tableName}: ${error.message}`);
  }
}

// CREATE operations
async function createContact(firstName, lastName, email, company) {
  const record = {
    id: uuidv4(),
    firstName,
    lastName,
    email,
    company,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    await docClient.send(new PutCommand({
      TableName: "Contacts",
      Item: record
    }));
    console.log("✅ Contact created:");
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    console.log(`❌ Error creating contact: ${error.message}`);
  }
}

async function createLead(firstName, lastName, email, company) {
  const record = {
    id: uuidv4(),
    firstName,
    lastName,
    email,
    company,
    status: "new",
    source: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    await docClient.send(new PutCommand({
      TableName: "Leads",
      Item: record
    }));
    console.log("✅ Lead created:");
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    console.log(`❌ Error creating lead: ${error.message}`);
  }
}

async function createDeal(title, amount, contactId) {
  const record = {
    id: uuidv4(),
    title,
    amount: parseFloat(amount) || 0,
    contactId,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    await docClient.send(new PutCommand({
      TableName: "Deals",
      Item: record
    }));
    console.log("✅ Deal created:");
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    console.log(`❌ Error creating deal: ${error.message}`);
  }
}

async function createTask(title, description, assignedTo) {
  const record = {
    id: uuidv4(),
    title,
    description,
    assignedTo,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    await docClient.send(new PutCommand({
      TableName: "Tasks",
      Item: record
    }));
    console.log("✅ Task created:");
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    console.log(`❌ Error creating task: ${error.message}`);
  }
}

// DELETE operation
async function deleteRecord(tableName, id) {
  try {
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { id }
    }));
    console.log(`✅ Record deleted from ${tableName}: ${id}`);
  } catch (error) {
    console.log(`❌ Error deleting record: ${error.message}`);
  }
}

// STATS operation
async function showStats() {
  const tables = [
    "Users", "Contacts", "Leads", "Deals", "Tasks", 
    "Accounts", "Subsidiaries", "Dealers", "Notifications", 
    "Meetings", "Reports"
  ];
  
  console.log("📊 Database Statistics");
  console.log("═".repeat(30));
  
  for (const tableName of tables) {
    try {
      const response = await docClient.send(new ScanCommand({
        TableName: tableName,
        Select: "COUNT"
      }));
      console.log(`📋 ${tableName.padEnd(15)}: ${response.Count} records`);
    } catch (error) {
      console.log(`📋 ${tableName.padEnd(15)}: Error`);
    }
  }
}

// Main execution
async function main() {
  if (!command) {
    showUsage();
    return;
  }
  
  switch (command) {
    case 'read':
      if (!table) {
        console.log("❌ Please specify table name");
        return;
      }
      await readTable(table);
      break;
      
    case 'create-contact':
      if (args.length < 4) {
        console.log("❌ Usage: create-contact <firstName> <lastName> <email> <company>");
        return;
      }
      await createContact(args[0], args[1], args[2], args[3]);
      break;
      
    case 'create-lead':
      if (args.length < 4) {
        console.log("❌ Usage: create-lead <firstName> <lastName> <email> <company>");
        return;
      }
      await createLead(args[0], args[1], args[2], args[3]);
      break;
      
    case 'create-deal':
      if (args.length < 3) {
        console.log("❌ Usage: create-deal <title> <amount> <contactId>");
        return;
      }
      await createDeal(args[0], args[1], args[2]);
      break;
      
    case 'create-task':
      if (args.length < 3) {
        console.log("❌ Usage: create-task <title> <description> <assignedTo>");
        return;
      }
      await createTask(args[0], args[1], args[2]);
      break;
      
    case 'delete':
      if (!table || !args[1]) {
        console.log("❌ Usage: delete <table> <id>");
        return;
      }
      await deleteRecord(table, args[1]);
      break;
      
    case 'stats':
      await showStats();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      showUsage();
  }
}

main().catch(console.error); 