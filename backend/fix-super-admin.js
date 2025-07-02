require('dotenv').config();
const { docClient } = require('./src/services/dynamoClient');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

async function updateSuperAdmin() {
  try {
    console.log('Updating super admin (john@sharp.com) with SUPER_ADMIN role...');
    
    const result = await docClient.send(
      new UpdateCommand({
        TableName: 'Users',
        Key: { email: 'john@sharp.com' },
        UpdateExpression: 'SET #role = :role, tenantId = :tenantId, createdBy = :createdBy, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#role': 'role'
        },
        ExpressionAttributeValues: {
          ':role': 'SUPER_ADMIN',
          ':tenantId': null,
          ':createdBy': null,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      })
    );
    
    console.log('✅ Super admin updated successfully:', {
      email: result.Attributes.email,
      role: result.Attributes.role,
      tenantId: result.Attributes.tenantId,
      createdBy: result.Attributes.createdBy
    });
  } catch (error) {
    console.error('❌ Error updating super admin:', error);
  }
}

updateSuperAdmin(); 