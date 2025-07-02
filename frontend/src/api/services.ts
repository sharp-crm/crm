import API from './client';

// Types for API responses
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  value: number;
  status: string;
  tenantId: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position?: string;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Deal {
  id: string;
  name: string;
  account: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  tenantId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee: string;
  type: string;
  tenantId: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error:', error.response.data);
    throw new Error(error.response.data.error || error.response.data.message || 'Server error');
  } else if (error.request) {
    // Request made but no response received
    console.error('Network Error:', error.request);
    throw new Error('Network error - please check your connection');
  } else {
    // Something else happened
    console.error('Error:', error.message);
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Leads API
export const leadsApi = {
  getAll: async (): Promise<Lead[]> => {
    try {
      const response = await API.get<ApiResponse<Lead[]>>('/leads');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Lead | null> => {
    try {
      const response = await API.get<ApiResponse<Lead>>(`/leads/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (lead: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>): Promise<Lead> => {
    try {
      const response = await API.post<ApiResponse<Lead>>('/leads', lead);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    try {
      const response = await API.put<ApiResponse<Lead>>(`/leads/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/leads/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

// Contacts API
export const contactsApi = {
  getAll: async (): Promise<Contact[]> => {
    try {
      const response = await API.get<ApiResponse<Contact[]>>('/contacts');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Contact | null> => {
    try {
      const response = await API.get<ApiResponse<Contact>>(`/contacts/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (contact: Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
    try {
      const response = await API.post<ApiResponse<Contact>>('/contacts', contact);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Contact>): Promise<Contact> => {
    try {
      const response = await API.put<ApiResponse<Contact>>(`/contacts/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/contacts/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

// Deals API
export const dealsApi = {
  getAll: async (): Promise<Deal[]> => {
    try {
      const response = await API.get<ApiResponse<Deal[]>>('/deals');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Deal | null> => {
    try {
      const response = await API.get<ApiResponse<Deal>>(`/deals/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (deal: Omit<Deal, 'id' | 'tenantId' | 'createdAt'>): Promise<Deal> => {
    try {
      const response = await API.post<ApiResponse<Deal>>('/deals', deal);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Deal>): Promise<Deal> => {
    try {
      const response = await API.put<ApiResponse<Deal>>(`/deals/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/deals/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

// Tasks API
export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    try {
      const response = await API.get<ApiResponse<Task[]>>('/tasks');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Task | null> => {
    try {
      const response = await API.get<ApiResponse<Task>>(`/tasks/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (task: Omit<Task, 'id' | 'tenantId' | 'createdAt'>): Promise<Task> => {
    try {
      const response = await API.post<ApiResponse<Task>>('/tasks', task);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Task>): Promise<Task> => {
    try {
      const response = await API.put<ApiResponse<Task>>(`/tasks/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/tasks/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

// Subsidiaries API
export interface Subsidiary {
  id: string;
  name: string;
  email: string;
  address: string;
  contact: string;
  totalEmployees: number;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export const subsidiariesApi = {
  getAll: async (): Promise<Subsidiary[]> => {
    try {
      const response = await API.get<ApiResponse<Subsidiary[]>>('/subsidiaries');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Subsidiary | null> => {
    try {
      const response = await API.get<ApiResponse<Subsidiary>>(`/subsidiaries/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (subsidiary: Omit<Subsidiary, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Subsidiary> => {
    try {
      const response = await API.post<ApiResponse<Subsidiary>>('/subsidiaries', subsidiary);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Subsidiary>): Promise<Subsidiary> => {
    try {
      const response = await API.put<ApiResponse<Subsidiary>>(`/subsidiaries/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/subsidiaries/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

// Dealers API
export interface Dealer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  territory: string;
  status: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export const dealersApi = {
  getAll: async (): Promise<Dealer[]> => {
    try {
      const response = await API.get<ApiResponse<Dealer[]>>('/dealers');
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Dealer | null> => {
    try {
      const response = await API.get<ApiResponse<Dealer>>(`/dealers/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (dealer: Omit<Dealer, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Dealer> => {
    try {
      const response = await API.post<ApiResponse<Dealer>>('/dealers', dealer);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Dealer>): Promise<Dealer> => {
    try {
      const response = await API.put<ApiResponse<Dealer>>(`/dealers/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/dealers/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

// Reports API
export interface Report {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  filters?: any;
  columns?: string[];
  chartType?: string;
  schedule?: string;
  isPublic: boolean;
  isFavorite: boolean;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  runCount: number;
  sharedWith: string[];
}

export const reportsApi = {
  getAll: async (type?: string, status?: string): Promise<Report[]> => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      
      const response = await API.get<ApiResponse<Report[]>>(`/reports?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getById: async (id: string): Promise<Report | null> => {
    try {
      const response = await API.get<ApiResponse<Report>>(`/reports/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  create: async (report: Omit<Report, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'lastRun' | 'runCount' | 'sharedWith'>): Promise<Report> => {
    try {
      const response = await API.post<ApiResponse<Report>>('/reports', report);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Report>): Promise<Report> => {
    try {
      const response = await API.put<ApiResponse<Report>>(`/reports/${id}`, updates);
      return response.data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await API.delete(`/reports/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getFavorites: async (): Promise<Report[]> => {
    try {
      const allReports = await reportsApi.getAll();
      return allReports.filter(report => report.isFavorite);
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  getScheduled: async (): Promise<Report[]> => {
    try {
      const allReports = await reportsApi.getAll();
      return allReports.filter(report => report.schedule);
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }
};

// Analytics API
export const analyticsApi = {
  getOverview: async () => {
    try {
      // Get real data from our existing APIs
      const [leads, contacts, deals, tasks] = await Promise.all([
        leadsApi.getAll(),
        contactsApi.getAll(),
        dealsApi.getAll(),
        tasksApi.getAll()
      ]);

      // Calculate analytics based on real data
      const totalDeals = deals.length;
      const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
      const wonDeals = deals.filter(d => d.stage === 'Closed Won').length;
      const lostDeals = deals.filter(d => d.stage === 'Closed Lost').length;
      
      const totalRevenue = deals
        .filter(d => d.stage === 'Closed Won')
        .reduce((sum, deal) => sum + (deal.value || 0), 0);

      const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100) : 0;

      // Calculate pipeline value
      const pipelineValue = deals
        .filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
        .reduce((sum, deal) => sum + (deal.value || 0), 0);

      return {
        totalRevenue,
        activeDeals,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        teamPerformance: 94, // This would need user performance data
        totalLeads: leads.length,
        totalContacts: contacts.length,
        totalTasks: tasks.length,
        pipelineValue,
        deals: {
          total: totalDeals,
          active: activeDeals,
          won: wonDeals,
          lost: lostDeals
        }
      };
    } catch (error) {
      console.error('Analytics overview error:', error);
      // Fallback to default values if APIs fail
      return {
        totalRevenue: 0,
        activeDeals: 0,
        conversionRate: 0,
        teamPerformance: 0,
        totalLeads: 0,
        totalContacts: 0,
        totalTasks: 0,
        pipelineValue: 0,
        deals: { total: 0, active: 0, won: 0, lost: 0 }
      };
    }
  },

  getLeadAnalytics: async () => {
    try {
      const leads = await leadsApi.getAll();

      // Calculate lead sources
      const sourceMap = new Map();
      leads.forEach(lead => {
        const source = lead.source || 'Unknown';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const leadSources = Array.from(sourceMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      // Calculate lead status distribution
      const statusMap = new Map();
      leads.forEach(lead => {
        const status = lead.status || 'New';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const leadStatusData = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count
      }));

      // Calculate conversion rate
      const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
      const conversionRate = leads.length > 0 ? ((qualifiedLeads / leads.length) * 100) : 0;

      return {
        totalLeads: leads.length,
        qualifiedLeads,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        averageValue: 1250, // This would need deal conversion tracking
        leadSources,
        leadStatusData
      };
    } catch (error) {
      console.error('Lead analytics error:', error);
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        conversionRate: 0,
        averageValue: 0,
        leadSources: [],
        leadStatusData: []
      };
    }
  },

  getDealInsights: async () => {
    try {
      const deals = await dealsApi.getAll();

      // Calculate deal stages
      const stageMap = new Map();
      deals.forEach(deal => {
        const stage = deal.stage || 'Prospecting';
        stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
      });

      const dealStages = Array.from(stageMap.entries()).map(([stage, count]) => ({
        stage,
        count
      }));

      // Calculate win rate
      const closedDeals = deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost');
      const wonDeals = deals.filter(d => d.stage === 'Closed Won');
      const winRate = closedDeals.length > 0 ? ((wonDeals.length / closedDeals.length) * 100) : 0;

      // Calculate average deal size
      const avgDealSize = wonDeals.length > 0 
        ? wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0) / wonDeals.length
        : 0;

      return {
        totalDeals: deals.length,
        winRate: parseFloat(winRate.toFixed(1)),
        avgDealSize: Math.round(avgDealSize),
        totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        dealStages
      };
    } catch (error) {
      console.error('Deal insights error:', error);
      return {
        totalDeals: 0,
        winRate: 0,
        avgDealSize: 0,
        totalValue: 0,
        dealStages: []
      };
    }
  },

  getActivityStats: async () => {
    try {
      const [leads, contacts, deals, tasks] = await Promise.all([
        leadsApi.getAll(),
        contactsApi.getAll(),
        dealsApi.getAll(),
        tasksApi.getAll()
      ]);

      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Not Started').length;

      return {
        totalActivities: tasks.length + leads.length + contacts.length,
        completedTasks,
        pendingTasks,
        leadsGenerated: leads.length,
        contactsAdded: contacts.length,
        dealsCreated: deals.length
      };
    } catch (error) {
      console.error('Activity stats error:', error);
      return {
        totalActivities: 0,
        completedTasks: 0,
        pendingTasks: 0,
        leadsGenerated: 0,
        contactsAdded: 0,
        dealsCreated: 0
      };
    }
  },

  getChartData: async () => {
    try {
      const deals = await dealsApi.getAll();
      
      // Generate chart data for the last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(month => ({
        month,
        revenue: Math.floor(Math.random() * 50000) + 30000, // Placeholder until we have date-based filtering
        deals: Math.floor(Math.random() * 20) + 10
      }));
    } catch (error) {
      console.error('Chart data error:', error);
      return [];
    }
  }
}; 