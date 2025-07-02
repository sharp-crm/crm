const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
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

async function debugPhoneIndex() {
  console.log('🔍 Debugging Phone Number Index\n');

  try {
    // 1. Check if PhoneNumberIndex exists
    console.log('1. Checking table structure...');
    const tableDesc = await client.send(
      new DescribeTableCommand({ TableName: "Users" })
    );
    
    const indexes = tableDesc.Table?.GlobalSecondaryIndexes || [];
    const phoneIndex = indexes.find(index => index.IndexName === "PhoneNumberIndex");
    
    if (phoneIndex) {
      console.log('✅ PhoneNumberIndex exists');
      console.log('   - Status:', phoneIndex.IndexStatus);
      console.log('   - Key Schema:', phoneIndex.KeySchema);
    } else {
      console.log('❌ PhoneNumberIndex not found!');
      console.log('Available indexes:', indexes.map(i => i.IndexName));
      return;
    }

    // 2. Scan all users to see phone numbers
    console.log('\n2. Scanning all users with phone numbers...');
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "attribute_exists(phoneNumber)"
      })
    );

    console.log(`Found ${scanResult.Items?.length || 0} users with phone numbers:`);
    scanResult.Items?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - Phone: "${user.phoneNumber}" (Type: ${typeof user.phoneNumber})`);
    });

    // 3. Test specific phone number query
    const testPhone = '+1111222333';
    console.log(`\n3. Testing query for phone: "${testPhone}"`);
    
    try {
      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: "Users",
          IndexName: "PhoneNumberIndex",
          KeyConditionExpression: "phoneNumber = :phoneNumber",
          ExpressionAttributeValues: {
            ":phoneNumber": testPhone
          }
        })
      );

      console.log(`Query result: Found ${queryResult.Items?.length || 0} users with phone ${testPhone}`);
      queryResult.Items?.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - Phone: "${user.phoneNumber}"`);
      });
    } catch (error) {
      console.log('❌ Query failed:', error.message);
    }

    // 4. Test with scan to double-check
    console.log(`\n4. Double-checking with scan for phone: "${testPhone}"`);
    const scanPhoneResult = await docClient.send(
      new ScanCommand({
        TableName: "Users",
        FilterExpression: "phoneNumber = :phoneNumber",
        ExpressionAttributeValues: {
          ":phoneNumber": testPhone
        }
      })
    );

    console.log(`Scan result: Found ${scanPhoneResult.Items?.length || 0} users with phone ${testPhone}`);
    scanPhoneResult.Items?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - Phone: "${user.phoneNumber}"`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

async function main() {
  try {
    await debugPhoneIndex();
    console.log('\n✅ Phone index debug completed!');
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { debugPhoneIndex }; 