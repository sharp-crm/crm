import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../services/dynamoClient';

// Deal interface based on AddNewModal fields + auditing
export interface Deal {
  id: string;
  // Required fields from AddNewModal
  dealOwner: string;
  dealName: string;
  leadSource: string;
  stage: string;
  amount: number;
  
  // Optional fields from AddNewModal  
  description?: string;
  account?: string;
  
  // Additional fields for deal functionality
  value?: number; // same as amount for backward compatibility
  probability?: number;
  closeDate?: string;
  
  // Auditing fields
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedBy?: string;
  isDeleted: boolean;
  deletedAt?: string;
  userId: string;
  tenantId: string;
}

export interface CreateDealInput {
  dealOwner: string;
  dealName: string;
  leadSource: string;
  stage: string;
  amount: number;
  description?: string;
  account?: string;
  probability?: number;
  closeDate?: string;
}

export interface UpdateDealInput {
  dealOwner?: string;
  dealName?: string;
  leadSource?: string;
  stage?: string;
  amount?: number;
  description?: string;
  account?: string;
  probability?: number;
  closeDate?: string;
}

export class DealsService {
  private tableName = 'Deals';

  // Create a new deal
  async createDeal(input: CreateDealInput, userId: string, userEmail: string, tenantId: string): Promise<Deal> {
    const timestamp = new Date().toISOString();
    const dealId = uuidv4();

    const deal: Deal = {
      id: dealId,
      dealOwner: input.dealOwner,
      dealName: input.dealName,
      leadSource: input.leadSource,
      stage: input.stage,
      amount: input.amount,
      description: input.description,
      account: input.account || 'Unknown',
      value: input.amount, // Set value same as amount for backward compatibility
      probability: input.probability || this.getDefaultProbability(input.stage),
      closeDate: input.closeDate || this.getDefaultCloseDate(),
      createdBy: userEmail,
      createdAt: timestamp,
      updatedBy: userEmail,
      updatedAt: timestamp,
      isDeleted: false,
      userId,
      tenantId
    };

    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: deal,
      ConditionExpression: 'attribute_not_exists(id)'
    }));

    return deal;
  }

  // Get default probability based on stage
  private getDefaultProbability(stage: string): number {
    switch (stage) {
      case 'Need Analysis': return 10;
      case 'Value Proposition': return 25;
      case 'Identify Decision Makers': return 50;
      case 'Negotiation/Review': return 75;
      case 'Closed Won': return 100;
      case 'Closed Lost': return 0;
      case 'Closed Lost to Competition': return 0;
      default: return 25;
    }
  }

  // Get default close date (30 days from now)
  private getDefaultCloseDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  // Get deal by ID (with tenant and soft delete check)
  async getDealById(id: string, tenantId: string): Promise<Deal | null> {
    const result = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));

    if (!result.Item || result.Item.tenantId !== tenantId || result.Item.isDeleted) {
      return null;
    }

    return result.Item as Deal;
  }

  // Get all deals for a tenant (excluding soft deleted)
  async getDealsByTenant(tenantId: string, includeDeleted = false): Promise<Deal[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TenantIdIndex',
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: includeDeleted ? undefined : 'isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ...(includeDeleted ? {} : { ':isDeleted': false })
      }
    }));

    return (result.Items || []) as Deal[];
  }

  // Get deals by owner
  async getDealsByOwner(dealOwner: string, tenantId: string): Promise<Deal[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'DealOwnerIndex',
      KeyConditionExpression: 'dealOwner = :dealOwner',
      FilterExpression: 'tenantId = :tenantId AND isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':dealOwner': dealOwner,
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    }));

    return (result.Items || []) as Deal[];
  }

  // Get deals by stage
  async getDealsByStage(stage: string, tenantId: string): Promise<Deal[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'StageIndex',
      KeyConditionExpression: 'stage = :stage',
      FilterExpression: 'tenantId = :tenantId AND isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':stage': stage,
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    }));

    return (result.Items || []) as Deal[];
  }

  // Search deals
  async searchDeals(tenantId: string, query: string): Promise<Deal[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TenantIdIndex',
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted AND (contains(dealName, :query) OR contains(dealOwner, :query) OR contains(account, :query))',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':isDeleted': false,
        ':query': query
      }
    }));

    return (result.Items || []) as Deal[];
  }

  // Update deal
  async updateDeal(id: string, input: UpdateDealInput, userId: string, userEmail: string, tenantId: string): Promise<Deal | null> {
    // First check if deal exists and belongs to tenant
    const existingDeal = await this.getDealById(id, tenantId);
    if (!existingDeal) {
      return null;
    }

    const timestamp = new Date().toISOString();
    
    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {
      ':updatedBy': userEmail,
      ':updatedAt': timestamp
    };

    // Keep track of fields that have been processed to avoid duplicates
    const processedFields = new Set<string>();

    // Add fields to update if they are provided
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && !processedFields.has(key)) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
        processedFields.add(key);
        
        // If amount is updated, also update value for backward compatibility
        if (key === 'amount' && !processedFields.has('value')) {
          updateExpressions.push(`#value = :value`);
          expressionAttributeNames[`#value`] = 'value';
          expressionAttributeValues[`:value`] = value;
          processedFields.add('value');
        }
        
        // If stage is updated, update probability only if not explicitly provided
        if (key === 'stage' && !input.probability && !processedFields.has('probability')) {
          const probability = this.getDefaultProbability(value as string);
          updateExpressions.push(`#probability = :probability`);
          expressionAttributeNames[`#probability`] = 'probability';
          expressionAttributeValues[`:probability`] = probability;
          processedFields.add('probability');
        }
      }
    });

    // Always update audit fields
    updateExpressions.push('#updatedBy = :updatedBy', '#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedBy'] = 'updatedBy';
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const result = await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ConditionExpression: 'tenantId = :tenantId AND isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ':tenantId': tenantId,
        ':isDeleted': false
      },
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes as Deal;
  }

  // Soft delete deal
  async deleteDeal(id: string, userId: string, userEmail: string, tenantId: string): Promise<boolean> {
    const timestamp = new Date().toISOString();

    try {
      await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET isDeleted = :isDeleted, deletedBy = :deletedBy, deletedAt = :deletedAt, updatedBy = :updatedBy, updatedAt = :updatedAt',
        ConditionExpression: 'tenantId = :tenantId AND isDeleted = :currentDeleted',
        ExpressionAttributeValues: {
          ':isDeleted': true,
          ':deletedBy': userEmail,
          ':deletedAt': timestamp,
          ':updatedBy': userEmail,
          ':updatedAt': timestamp,
          ':tenantId': tenantId,
          ':currentDeleted': false
        }
      }));

      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false; // Deal not found or already deleted
      }
      throw error;
    }
  }

  // Restore soft deleted deal
  async restoreDeal(id: string, userId: string, userEmail: string, tenantId: string): Promise<boolean> {
    const timestamp = new Date().toISOString();

    try {
      await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET isDeleted = :isDeleted, updatedBy = :updatedBy, updatedAt = :updatedAt REMOVE deletedBy, deletedAt',
        ConditionExpression: 'tenantId = :tenantId AND isDeleted = :currentDeleted',
        ExpressionAttributeValues: {
          ':isDeleted': false,
          ':updatedBy': userEmail,
          ':updatedAt': timestamp,
          ':tenantId': tenantId,
          ':currentDeleted': true
        }
      }));

      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false; // Deal not found or not deleted
      }
      throw error;
    }
  }

  // Hard delete deal (permanent)
  async hardDeleteDeal(id: string, tenantId: string): Promise<boolean> {
    try {
      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId
        }
      }));

      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false; // Deal not found
      }
      throw error;
    }
  }

  // Get deals statistics
  async getDealsStats(tenantId: string): Promise<any> {
    const deals = await this.getDealsByTenant(tenantId);
    
    const stats = {
      total: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + deal.amount, 0),
      avgValue: deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.amount, 0) / deals.length : 0,
      avgProbability: deals.length > 0 ? deals.reduce((sum, deal) => sum + (deal.probability || 0), 0) / deals.length : 0,
      expectedValue: deals.reduce((sum, deal) => sum + (deal.amount * (deal.probability || 0) / 100), 0),
      byStage: {} as Record<string, number>,
      byOwner: {} as Record<string, number>
    };

    // Group by stage
    deals.forEach(deal => {
      stats.byStage[deal.stage] = (stats.byStage[deal.stage] || 0) + 1;
    });

    // Group by owner
    deals.forEach(deal => {
      stats.byOwner[deal.dealOwner] = (stats.byOwner[deal.dealOwner] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const dealsService = new DealsService();
