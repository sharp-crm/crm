import { 
  DynamoDBClient, 
  CreateTableCommand, 
  DescribeTableCommand,
  ListTablesCommand,
  DeleteTableCommand
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const clientConfig: any = {
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

const docClient = DynamoDBDocumentClient.from(client);

const tables = [
  {
    TableName: "Users",
    KeySchema: [
      { AttributeName: "email", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "email", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "tenantId", AttributeType: "S" },
      { AttributeName: "createdBy", AttributeType: "S" },
      { AttributeName: "phoneNumber", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserIdIndex",
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" }
        ],
        Projection: {
          ProjectionType: "ALL"
        }
      },
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
        IndexName: "CreatedByIndex",
        KeySchema: [
          { AttributeName: "createdBy", KeyType: "HASH" }
        ],
        Projection: {
          ProjectionType: "ALL"
        }
      },
      {
        IndexName: "PhoneNumberIndex",
        KeySchema: [
          { AttributeName: "phoneNumber", KeyType: "HASH" }
        ],
        Projection: {
          ProjectionType: "ALL"
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Contacts",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Leads",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Deals",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Tasks",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Accounts",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Subsidiaries",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Dealers",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Notifications",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Meetings",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "Reports",
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  {
    TableName: "RefreshTokens",
    KeySchema: [
      { AttributeName: "jti", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "jti", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserTokensIndex",
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" }
        ],
        Projection: {
          ProjectionType: "ALL"
        }
      }
    ],
    BillingMode: "PAY_PER_REQUEST"
  }
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTable(tableConfig: any): Promise<void> {
  try {
    console.log(`Creating table: ${tableConfig.TableName}`);
    await client.send(new CreateTableCommand(tableConfig));
    console.log(`✓ Table ${tableConfig.TableName} created successfully`);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`✓ Table ${tableConfig.TableName} already exists`);
    } else {
      console.error(`✗ Failed to create table ${tableConfig.TableName}:`, error.message);
      throw error;
    }
  }
}

async function waitForTableActive(tableName: string): Promise<void> {
  console.log(`Waiting for table ${tableName} to become active...`);
  let tableActive = false;
  while (!tableActive) {
    try {
      const result = await client.send(new DescribeTableCommand({ TableName: tableName }));
      if (result.Table?.TableStatus === 'ACTIVE') {
        tableActive = true;
        console.log(`Table ${tableName} is now active`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error checking table status: ${error}`);
      throw error;
    }
  }
}

async function createSuperAdmin(): Promise<void> {
  try {
    const email = "john@sharp.com";
    
    // Wait for Users table to become active
    await waitForTableActive("Users");
    
    // Check if super admin already exists
    const existingUser = await docClient.send(
      new GetCommand({
        TableName: "Users",
        Key: { email }
      })
    );

    if (existingUser.Item) {
      console.log("✓ Super admin user already exists");
      return;
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash("sharp123", 10);
    const userId = uuidv4();
    const timestamp = new Date().toISOString();

    const superAdmin = {
      userId,
      email,
      password: hashedPassword,
      username: "John Sharp",
      firstName: "John",
      lastName: "Sharp",
      role: "SUPER_ADMIN", // Changed from ADMIN to SUPER_ADMIN
      tenantId: "SUPER_ADMIN_TENANT", // Super admin has special tenant
      createdBy: "SYSTEM", // Super admin is created by system
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };

    await docClient.send(
      new PutCommand({
        TableName: "Users",
        Item: superAdmin
      })
    );

    console.log("✓ Super admin user created successfully");
  } catch (error) {
    console.error("✗ Failed to create super admin user:", error);
    throw error;
  }
}

export async function initializeDatabase(): Promise<void> {
  console.log("🚀 Initializing DynamoDB tables...\n");
  
  try {
    // List existing tables
    const existingTables = await client.send(new ListTablesCommand({}));
    console.log("Existing tables:", existingTables.TableNames || []);
    
    // Create tables
    for (const tableConfig of tables) {
      const exists = await tableExists(tableConfig.TableName);
      if (!exists) {
        await createTable(tableConfig);
      } else {
        console.log(`✓ Table ${tableConfig.TableName} already exists`);
      }
    }

    // Create super admin user
    await createSuperAdmin();
    
    console.log("\n✅ Database initialization completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Database initialization failed:", error);
    process.exit(1);
  }
}

export const createTables = async () => {
  try {
    // Create Users table
    await docClient.send(
      new CreateTableCommand({
        TableName: "Users",
        AttributeDefinitions: [
          { AttributeName: "userId", AttributeType: "S" },
          { AttributeName: "email", AttributeType: "S" }
        ],
        KeySchema: [
          { AttributeName: "email", KeyType: "HASH" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "UserIdIndex",
            KeySchema: [
              { AttributeName: "userId", KeyType: "HASH" }
            ],
            Projection: {
              ProjectionType: "ALL"
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      })
    );

    // Create RefreshTokens table
    await docClient.send(
      new CreateTableCommand({
        TableName: "RefreshTokens",
        AttributeDefinitions: [
          { AttributeName: "jti", AttributeType: "S" },
          { AttributeName: "userId", AttributeType: "S" }
        ],
        KeySchema: [
          { AttributeName: "jti", KeyType: "HASH" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "UserTokensIndex",
            KeySchema: [
              { AttributeName: "userId", KeyType: "HASH" }
            ],
            Projection: {
              ProjectionType: "ALL"
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      })
    );

    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

export const deleteTables = async () => {
  try {
    await docClient.send(new DeleteTableCommand({ TableName: "Users" }));
    await docClient.send(new DeleteTableCommand({ TableName: "RefreshTokens" }));
    console.log("Tables deleted successfully");
  } catch (error) {
    console.error("Error deleting tables:", error);
    throw error;
  }
};

export const initDatabase = async () => {
  try {
    await deleteTables();
  } catch (error) {
    console.log("Tables don't exist yet");
  }
  await createTables();
};

// If this script is run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Database setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database setup failed:", error);
      process.exit(1);
    });
} 