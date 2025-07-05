import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../services/dynamoClient';

// Lead interface based on AddNewModal fields + auditing
export interface Lead {
  id: string;
  // Required fields from AddNewModal
  leadOwner: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  leadSource: string;
  leadStatus: string;
  
  // Optional fields from AddNewModal
  phone?: string;
  title?: string;
  
  // Address fields
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  
  // Additional fields
  description?: string;
  value?: number;
  visibleTo?: string[]; // Array of user IDs who can view this lead
  
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

export interface CreateLeadInput {
  leadOwner: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  leadSource: string;
  leadStatus: string;
  phone?: string;
  title?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  description?: string;
  value?: number;
  visibleTo?: string[]; // Array of user IDs who can view this lead
}

export interface UpdateLeadInput {
  leadOwner?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  leadSource?: string;
  leadStatus?: string;
  phone?: string;
  title?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  description?: string;
  value?: number;
  visibleTo?: string[]; // Array of user IDs who can view this lead
}

export class LeadsService {
  private tableName = 'Leads';

  // Create a new lead
  async createLead(input: CreateLeadInput, userId: string, userEmail: string, tenantId: string): Promise<Lead> {
    const timestamp = new Date().toISOString();
    const leadId = uuidv4();

    const lead: Lead = {
      id: leadId,
      leadOwner: input.leadOwner,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      email: input.email,
      leadSource: input.leadSource,
      leadStatus: input.leadStatus,
      phone: input.phone,
      title: input.title,
      street: input.street,
      area: input.area,
      city: input.city,
      state: input.state,
      country: input.country,
      zipCode: input.zipCode,
      description: input.description,
      value: input.value || 0,
      visibleTo: input.visibleTo || [], // Initialize visibility array
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
      Item: lead,
      ConditionExpression: 'attribute_not_exists(id)'
    }));

    return lead;
  }

  // Get lead by ID (with tenant and visibility check)
  async getLeadById(id: string, tenantId: string, userId: string): Promise<Lead | null> {
    const result = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id }
    }));

    if (!result.Item || 
        result.Item.tenantId !== tenantId || 
        result.Item.isDeleted ||
        (result.Item.visibleTo && 
         result.Item.visibleTo.length > 0 && 
         !result.Item.visibleTo.includes(userId) && 
         result.Item.userId !== userId)) {
      return null;
    }

    return result.Item as Lead;
  }

  // Get all leads for a tenant (excluding soft deleted)
  async getLeadsByTenant(tenantId: string, userId: string, includeDeleted = false): Promise<Lead[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TenantIdIndex',
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: includeDeleted 
        ? '(attribute_not_exists(visibleTo) OR contains(visibleTo, :userId) OR userId = :userId)'
        : 'isDeleted = :isDeleted AND (attribute_not_exists(visibleTo) OR contains(visibleTo, :userId) OR userId = :userId)',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':userId': userId,
        ...(includeDeleted ? {} : { ':isDeleted': false })
      }
    }));

    return (result.Items || []) as Lead[];
  }

  // Get leads by owner
  async getLeadsByOwner(leadOwner: string, tenantId: string): Promise<Lead[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'LeadOwnerIndex',
      KeyConditionExpression: 'leadOwner = :leadOwner',
      FilterExpression: 'tenantId = :tenantId AND isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':leadOwner': leadOwner,
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    }));

    return (result.Items || []) as Lead[];
  }

  // Get lead by email
  async getLeadByEmail(email: string, tenantId: string): Promise<Lead | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      FilterExpression: 'tenantId = :tenantId AND isDeleted = :isDeleted',
      ExpressionAttributeValues: {
        ':email': email,
        ':tenantId': tenantId,
        ':isDeleted': false
      }
    }));

    const leads = result.Items || [];
    return leads.length > 0 ? leads[0] as Lead : null;
  }

  // Update lead
  async updateLead(id: string, input: UpdateLeadInput, userId: string, userEmail: string, tenantId: string): Promise<Lead | null> {
    // First check if lead exists and belongs to tenant
    const existingLead = await this.getLeadById(id, tenantId, userId);
    if (!existingLead) {
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

    // Add fields to update if they are provided
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Always update audit fields
    updateExpressions.push('updatedBy = :updatedBy', 'updatedAt = :updatedAt');

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

    return result.Attributes as Lead;
  }

  // Soft delete lead
  async deleteLead(id: string, userId: string, userEmail: string, tenantId: string): Promise<boolean> {
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
        return false; // Lead not found or already deleted
      }
      throw error;
    }
  }

  // Restore soft deleted lead
  async restoreLead(id: string, userId: string, userEmail: string, tenantId: string): Promise<boolean> {
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
        return false; // Lead not found or not deleted
      }
      throw error;
    }
  }

  // Hard delete lead (permanent)
  async hardDeleteLead(id: string, tenantId: string): Promise<boolean> {
    try {
      // First check if lead exists and belongs to tenant
      const existingLead = await this.getLeadById(id, tenantId, '');
      if (!existingLead) {
        return false;
      }

      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Search leads by various criteria
  async searchLeads(tenantId: string, searchTerm: string): Promise<Lead[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TenantIdIndex',
      KeyConditionExpression: 'tenantId = :tenantId',
      FilterExpression: 'isDeleted = :isDeleted AND (contains(firstName, :searchTerm) OR contains(lastName, :searchTerm) OR contains(company, :searchTerm) OR contains(email, :searchTerm))',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
        ':isDeleted': false,
        ':searchTerm': searchTerm
      }
    }));

    return (result.Items || []) as Lead[];
  }

  // Get leads statistics
  async getLeadsStats(tenantId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    totalValue: number;
    avgValue: number;
    recentCount: number;
  }> {
    const leads = await this.getLeadsByTenant(tenantId, '', false);
    
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.leadStatus] = (acc[lead.leadStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = leads.reduce((acc, lead) => {
      acc[lead.leadSource] = (acc[lead.leadSource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const avgValue = leads.length > 0 ? totalValue / leads.length : 0;

    // Count leads created in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCount = leads.filter(lead => 
      new Date(lead.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      total: leads.length,
      byStatus,
      bySource,
      totalValue,
      avgValue,
      recentCount
    };
  }
}

// Export singleton instance
export const leadsService = new LeadsService();
