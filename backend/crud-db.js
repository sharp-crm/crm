const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const readline = require('readline');
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

// Interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const tables = [
  "Users", "Contacts", "Leads", "Deals", "Tasks", 
  "Accounts", "Subsidiaries", "Dealers", "Notifications", 
  "Meetings", "Reports"
];

// Helper function to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Display menu
function showMenu() {
  console.log("\n🗃️  Manual CRUD Database Interface");
  console.log("=====================================");
  console.log("1. 📖 READ - View records");
  console.log("2. ➕ CREATE - Add new record");
  console.log("3. ✏️  UPDATE - Modify existing record");
  console.log("4. 🗑️  DELETE - Remove record");
  console.log("5. 📊 STATS - Show table statistics");
  console.log("6. 🚪 EXIT");
  console.log("=====================================");
}

// Show available tables
function showTables() {
  console.log("\n📋 Available Tables:");
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table}`);
  });
}

// READ Operations
async function readRecords() {
  showTables();
  const tableChoice = await ask("\n🔍 Select table number to read: ");
  const tableName = tables[parseInt(tableChoice) - 1];
  
  if (!tableName) {
    console.log("❌ Invalid table selection");
    return;
  }
  
  try {
    console.log(`\n📖 Reading from ${tableName}...`);
    const response = await docClient.send(new ScanCommand({
      TableName: tableName
    }));
    
    if (response.Items && response.Items.length > 0) {
      console.log(`\n📊 Found ${response.Items.length} records:\n`);
      response.Items.forEach((item, index) => {
        console.log(`${index + 1}. ${JSON.stringify(item, null, 2)}`);
        console.log("─".repeat(50));
      });
    } else {
      console.log("📭 No records found");
    }
  } catch (error) {
    console.log(`❌ Error reading ${tableName}: ${error.message}`);
  }
}

// CREATE Operations
async function createRecord() {
  showTables();
  const tableChoice = await ask("\n➕ Select table number to add record: ");
  const tableName = tables[parseInt(tableChoice) - 1];
  
  if (!tableName) {
    console.log("❌ Invalid table selection");
    return;
  }
  
  console.log(`\n📝 Creating new record in ${tableName}`);
  console.log("Enter field values (press Enter for empty, 'null' for null):");
  
  const record = {};
  
  // Common fields based on table
  switch (tableName) {
    case "Users":
      record.userId = uuidv4();
      record.email = await ask("📧 Email: ");
      record.password = await ask("🔒 Password (will be hashed): ");
      record.firstName = await ask("👤 First Name: ");
      record.lastName = await ask("👤 Last Name: ");
      record.username = await ask("🏷️  Username: ");
      record.role = await ask("🎭 Role (USER/ADMIN): ") || "USER";
      record.isDeleted = false;
      break;
      
    case "Contacts":
      record.id = uuidv4();
      record.firstName = await ask("👤 First Name: ");
      record.lastName = await ask("👤 Last Name: ");
      record.email = await ask("📧 Email: ");
      record.company = await ask("🏢 Company: ");
      record.phone = await ask("📞 Phone: ");
      break;
      
    case "Leads":
      record.id = uuidv4();
      record.firstName = await ask("👤 First Name: ");
      record.lastName = await ask("👤 Last Name: ");
      record.email = await ask("📧 Email: ");
      record.company = await ask("🏢 Company: ");
      record.status = await ask("📊 Status (new/contacted/qualified/lost): ") || "new";
      record.source = await ask("📍 Source: ");
      break;
      
    case "Deals":
      record.id = uuidv4();
      record.title = await ask("📋 Deal Title: ");
      record.amount = parseFloat(await ask("💰 Amount: ")) || 0;
      record.status = await ask("📊 Status (open/won/lost): ") || "open";
      record.contactId = await ask("👤 Contact ID: ");
      break;
      
    case "Tasks":
      record.id = uuidv4();
      record.title = await ask("📋 Task Title: ");
      record.description = await ask("📝 Description: ");
      record.status = await ask("📊 Status (pending/completed): ") || "pending";
      record.assignedTo = await ask("👤 Assigned To (User ID): ");
      record.dueDate = await ask("📅 Due Date (YYYY-MM-DD): ");
      break;
      
    default:
      record.id = uuidv4();
      record.name = await ask("🏷️  Name: ");
      record.description = await ask("📝 Description: ");
  }
  
  // Add timestamps
  record.createdAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  
  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: record
    }));
    
    console.log("\n✅ Record created successfully!");
    console.log("📄 Created record:", JSON.stringify(record, null, 2));
  } catch (error) {
    console.log(`❌ Error creating record: ${error.message}`);
  }
}

// UPDATE Operations
async function updateRecord() {
  showTables();
  const tableChoice = await ask("\n✏️  Select table number to update: ");
  const tableName = tables[parseInt(tableChoice) - 1];
  
  if (!tableName) {
    console.log("❌ Invalid table selection");
    return;
  }
  
  // First show existing records
  console.log(`\n📖 Current records in ${tableName}:`);
  const scanResponse = await docClient.send(new ScanCommand({
    TableName: tableName
  }));
  
  if (!scanResponse.Items || scanResponse.Items.length === 0) {
    console.log("📭 No records found to update");
    return;
  }
  
  scanResponse.Items.forEach((item, index) => {
    console.log(`${index + 1}. ID: ${item.id || item.userId || item.email} - ${item.firstName || item.title || item.name || 'Record'}`);
  });
  
  const recordChoice = await ask("\n🎯 Select record number to update: ");
  const selectedRecord = scanResponse.Items[parseInt(recordChoice) - 1];
  
  if (!selectedRecord) {
    console.log("❌ Invalid record selection");
    return;
  }
  
  console.log("\n📝 Current record:", JSON.stringify(selectedRecord, null, 2));
  
  const field = await ask("\n🏷️  Field name to update: ");
  const newValue = await ask(`📝 New value for ${field}: `);
  
  // Determine the key for the update
  const key = selectedRecord.id ? { id: selectedRecord.id } : 
              selectedRecord.userId ? { userId: selectedRecord.userId } :
              { email: selectedRecord.email };
  
  try {
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${field} = :value, updatedAt = :timestamp`,
      ExpressionAttributeValues: {
        ':value': newValue,
        ':timestamp': new Date().toISOString()
      }
    }));
    
    console.log("✅ Record updated successfully!");
  } catch (error) {
    console.log(`❌ Error updating record: ${error.message}`);
  }
}

// DELETE Operations
async function deleteRecord() {
  showTables();
  const tableChoice = await ask("\n🗑️  Select table number to delete from: ");
  const tableName = tables[parseInt(tableChoice) - 1];
  
  if (!tableName) {
    console.log("❌ Invalid table selection");
    return;
  }
  
  // Show existing records
  console.log(`\n📖 Current records in ${tableName}:`);
  const scanResponse = await docClient.send(new ScanCommand({
    TableName: tableName
  }));
  
  if (!scanResponse.Items || scanResponse.Items.length === 0) {
    console.log("📭 No records found to delete");
    return;
  }
  
  scanResponse.Items.forEach((item, index) => {
    console.log(`${index + 1}. ID: ${item.id || item.userId || item.email} - ${item.firstName || item.title || item.name || 'Record'}`);
  });
  
  const recordChoice = await ask("\n🎯 Select record number to delete: ");
  const selectedRecord = scanResponse.Items[parseInt(recordChoice) - 1];
  
  if (!selectedRecord) {
    console.log("❌ Invalid record selection");
    return;
  }
  
  const confirm = await ask(`\n⚠️  Are you sure you want to delete this record? (yes/no): `);
  if (confirm.toLowerCase() !== 'yes') {
    console.log("❌ Delete cancelled");
    return;
  }
  
  const key = selectedRecord.id ? { id: selectedRecord.id } : 
              selectedRecord.userId ? { userId: selectedRecord.userId } :
              { email: selectedRecord.email };
  
  try {
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: key
    }));
    
    console.log("✅ Record deleted successfully!");
  } catch (error) {
    console.log(`❌ Error deleting record: ${error.message}`);
  }
}

// Show table statistics
async function showStats() {
  console.log("\n📊 Database Statistics");
  console.log("=====================");
  
  for (const tableName of tables) {
    try {
      const response = await docClient.send(new ScanCommand({
        TableName: tableName,
        Select: "COUNT"
      }));
      console.log(`📋 ${tableName}: ${response.Count} records`);
    } catch (error) {
      console.log(`📋 ${tableName}: Error - ${error.message}`);
    }
  }
}

// Main menu loop
async function main() {
  console.log("🎉 Welcome to Sharp CRM Manual Database CRUD Interface!");
  
  while (true) {
    showMenu();
    const choice = await ask("\n🎯 Select operation (1-6): ");
    
    switch (choice) {
      case '1':
        await readRecords();
        break;
      case '2':
        await createRecord();
        break;
      case '3':
        await updateRecord();
        break;
      case '4':
        await deleteRecord();
        break;
      case '5':
        await showStats();
        break;
      case '6':
        console.log("👋 Goodbye!");
        rl.close();
        return;
      default:
        console.log("❌ Invalid choice. Please select 1-6.");
    }
    
    await ask("\n⏸️  Press Enter to continue...");
  }
}

// Start the application
main().catch(console.error); 