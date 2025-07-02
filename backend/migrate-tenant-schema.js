require('dotenv').config();
const { DynamoDBClient, DeleteTableCommand, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

async function backupExistingUsers() {
  console.log('📦 Backing up existing users...');
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: "Users"
    }));
    
    console.log(`✅ Found ${result.Items?.length || 0} users to backup`);
    return result.Items || [];
  } catch (error) {
    console.error('❌ Error backing up users:', error);
    return [];
  }
}

async function recreateUsersTable() {
  console.log('🔄 Recreating Users table with new schema...');
  
  try {
    // Delete existing table
    console.log('Deleting existing Users table...');
    await client.send(new DeleteTableCommand({ TableName: "Users" }));
    
    // Wait a bit for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create new table with updated schema
    console.log('Creating new Users table...');
    await client.send(new CreateTableCommand({
      TableName: "Users",
      KeySchema: [
        { AttributeName: "email", KeyType: "HASH" }
      ],
      AttributeDefinitions: [
        { AttributeName: "email", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "tenantId", AttributeType: "S" },
        { AttributeName: "createdBy", AttributeType: "S" }
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
        }
      ],
      BillingMode: "PAY_PER_REQUEST"
    }));
    
    // Wait for table to become active
    console.log('Waiting for table to become active...');
    let tableActive = false;
    while (!tableActive) {
      try {
        const result = await client.send(new DescribeTableCommand({ TableName: "Users" }));
        if (result.Table?.TableStatus === 'ACTIVE') {
          tableActive = true;
          console.log('✅ Users table is now active');
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
  } catch (error) {
    console.error('❌ Error recreating table:', error);
    throw error;
  }
}

async function migrateUsers(backupUsers) {
  console.log('🚀 Migrating users with new schema...');
  
  for (const user of backupUsers) {
    try {
      // Determine the new fields based on existing data
      let role = user.role || 'SALES_REP';
      let tenantId = null;
      let createdBy = null;
      
             // Handle super admin (john@sharp.com)
       if (user.email === 'john@sharp.com') {
         role = 'SUPER_ADMIN';
         tenantId = 'SUPER_ADMIN_TENANT'; // Use a special value instead of null for GSI
         createdBy = 'SYSTEM'; // Use a special value instead of null for GSI
       } else if (user.role === 'ADMIN') {
         // Existing admins get their own tenant ID
         tenantId = uuidv4();
         createdBy = 'SUPER_ADMIN'; // Assume they were created by super admin
       } else {
         // Other users get a default tenant for now
         tenantId = 'default-tenant';
         createdBy = 'ADMIN';
       }
      
      const migratedUser = {
        ...user,
        role,
        tenantId,
        createdBy,
        updatedAt: new Date().toISOString(),
        isDeleted: user.isDeleted || false
      };
      
      await docClient.send(new PutCommand({
        TableName: "Users",
        Item: migratedUser
      }));
      
      console.log(`✅ Migrated user: ${user.email} (${role}, tenant: ${tenantId || 'null'})`);
      
    } catch (error) {
      console.error(`❌ Error migrating user ${user.email}:`, error);
    }
  }
}

async function runMigration() {
  console.log('🔄 Starting Tenant Schema Migration\n');
  
  try {
    // Step 1: Backup existing users
    const backupUsers = await backupExistingUsers();
    
    if (backupUsers.length === 0) {
      console.log('No users found to migrate. Creating fresh super admin...');
      
      // Just recreate table and create super admin
      await recreateUsersTable();
      
      // Create super admin
      const hashedPassword = await bcrypt.hash("sharp123", 10);
      const userId = uuidv4();
      const timestamp = new Date().toISOString();

             const superAdmin = {
         userId,
         email: "john@sharp.com",
         password: hashedPassword,
         username: "John Sharp",
         firstName: "John",
         lastName: "Sharp",
         role: "SUPER_ADMIN",
         tenantId: "SUPER_ADMIN_TENANT",
         createdBy: "SYSTEM",
         createdAt: timestamp,
         updatedAt: timestamp,
         isDeleted: false
       };

      await docClient.send(new PutCommand({
        TableName: "Users",
        Item: superAdmin
      }));
      
      console.log("✅ Super admin created successfully");
      
    } else {
      // Step 2: Recreate table with new schema
      await recreateUsersTable();
      
      // Step 3: Migrate users with new fields
      await migrateUsers(backupUsers);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('- Users table recreated with tenantId and createdBy fields');
    console.log('- Added Global Secondary Indexes for efficient querying');
    console.log('- Super admin role updated to SUPER_ADMIN');
    console.log('- Tenant hierarchy system is now active');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 