const { 
  DynamoDBClient, 
  CreateTableCommand, 
  DeleteTableCommand,
  DescribeTableCommand
} = require("@aws-sdk/client-dynamodb");

// Use local DynamoDB configuration
const clientConfig = {
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey"
  }
};

const client = new DynamoDBClient(clientConfig);

const dealsTableConfig = {
  TableName: "Deals",
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH" }
  ],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "tenantId", AttributeType: "S" },
    { AttributeName: "dealOwner", AttributeType: "S" },
    { AttributeName: "stage", AttributeType: "S" },
    { AttributeName: "createdBy", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "TenantIdIndex",
      KeySchema: [
        { AttributeName: "tenantId", KeyType: "HASH" }
      ],
      Projection: {
        ProjectionType: "ALL"
      }
    },
    {
      IndexName: "DealOwnerIndex",
      KeySchema: [
        { AttributeName: "dealOwner", KeyType: "HASH" }
      ],
      Projection: {
        ProjectionType: "ALL"
      }
    },
    {
      IndexName: "StageIndex",
      KeySchema: [
        { AttributeName: "stage", KeyType: "HASH" }
      ],
      Projection: {
        ProjectionType: "ALL"
      }
    },
    {
      IndexName: "CreatedByIndex",
      KeySchema: [
        { AttributeName: "createdBy", KeyType: "HASH" }
      ],
      Projection: {
        ProjectionType: "ALL"
      }
    }
  ],
  BillingMode: "PAY_PER_REQUEST"
};

async function deleteDealsTable() {
  try {
    console.log("🗑️  Deleting existing Deals table...");
    await client.send(new DeleteTableCommand({ TableName: "Deals" }));
    console.log("✅ Deals table deleted successfully");
    
    // Wait a bit for the table to be deleted
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log("ℹ️  Deals table doesn't exist, skipping deletion");
    } else {
      console.error("❌ Error deleting Deals table:", error.message);
      throw error;
    }
  }
}

async function createDealsTable() {
  try {
    console.log("🔨 Creating Deals table with proper indices...");
    await client.send(new CreateTableCommand(dealsTableConfig));
    console.log("✅ Deals table created successfully");
    
    // Wait for table to become active
    await waitForTableActive("Deals");
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log("ℹ️  Deals table already exists");
    } else {
      console.error("❌ Error creating Deals table:", error.message);
      throw error;
    }
  }
}

async function waitForTableActive(tableName) {
  console.log(`⏳ Waiting for table ${tableName} to become active...`);
  let tableActive = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!tableActive && attempts < maxAttempts) {
    try {
      const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
      if (result.Table?.TableStatus === 'ACTIVE') {
        tableActive = true;
        console.log(`✅ Table ${tableName} is now active`);
      } else {
        console.log(`⏳ Table status: ${result.Table?.TableStatus}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`⏳ Table ${tableName} not found yet, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } else {
        console.error(`❌ Error checking table status: ${error.message}`);
        throw error;
      }
    }
  }
  
  if (!tableActive) {
    throw new Error(`Table ${tableName} did not become active within ${maxAttempts} seconds`);
  }
}

async function recreateDealsTable() {
  try {
    console.log("🚀 Starting Deals table recreation...\n");
    
    await deleteDealsTable();
    await createDealsTable();
    
    console.log("\n🎉 Deals table recreation completed successfully!");
  } catch (error) {
    console.error("\n💥 Deals table recreation failed:", error);
    process.exit(1);
  }
}

// Run the script
recreateDealsTable(); 