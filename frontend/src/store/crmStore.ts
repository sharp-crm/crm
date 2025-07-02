import { create } from 'zustand';
import { Deal, Task, Lead, Contact, Account } from '../types';

interface CRMStore {
  deals: Deal[];
  tasks: Task[];
  leads: Lead[];
  contacts: Contact[];
  accounts: Account[];
  addDeal: (deal: Deal) => void;
  addTask: (task: Task) => void;
  addLead: (lead: Lead) => void;
  addContact: (contact: Contact) => void;
  addAccount: (account: Account) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export const useCRMStore = create<CRMStore>((set) => ({
  deals: [
    {
      id: '1',
      name: 'Q1 Software Implementation',
      account: 'Global Industries',
      value: 125000,
      stage: 'Proposal',
      probability: 75,
      closeDate: '2024-03-31',
      owner: 'Sarah Johnson',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Digital Transformation Project',
      account: 'Digital Dynamics',
      value: 85000,
      stage: 'Negotiation',
      probability: 90,
      closeDate: '2024-02-28',
      owner: 'Mike Chen',
      createdAt: '2024-01-10'
    },
    {
      id: '3',
      name: 'Cloud Migration Services',
      account: 'TechCorp Inc',
      value: 200000,
      stage: 'Prospecting',
      probability: 25,
      closeDate: '2024-04-15',
      owner: 'Emily Davis',
      createdAt: '2024-01-20'
    },
    {
      id: '4',
      name: 'CRM Integration',
      account: 'StartupXYZ',
      value: 45000,
      stage: 'Qualification',
      probability: 60,
      closeDate: '2024-03-15',
      owner: 'Alex Rodriguez',
      createdAt: '2024-01-18'
    },
    {
      id: '5',
      name: 'Enterprise Security Suite',
      account: 'SecureCorp',
      value: 300000,
      stage: 'Closed Won',
      probability: 100,
      closeDate: '2024-01-30',
      owner: 'Sarah Johnson',
      createdAt: '2024-01-05'
    }
  ],
  tasks: [
    {
      id: '1',
      title: 'Follow up with TechCorp lead',
      description: 'Call John Smith to discuss requirements',
      priority: 'High',
      status: 'Open',
      dueDate: '2024-01-25',
      assignee: 'Sarah Johnson',
      createdAt: '2024-01-20',
      type: 'Call'
    },
    {
      id: '2',
      title: 'Prepare proposal for Global Industries',
      description: 'Create detailed proposal for Q1 implementation',
      priority: 'High',
      status: 'In Progress',
      dueDate: '2024-01-28',
      assignee: 'Mike Chen',
      createdAt: '2024-01-18',
      type: 'Follow-up'
    },
    {
      id: '3',
      title: 'Demo presentation for StartupXYZ',
      description: 'Prepare and deliver product demo',
      priority: 'Medium',
      status: 'Open',
      dueDate: '2024-01-30',
      assignee: 'Emily Davis',
      createdAt: '2024-01-19',
      type: 'Demo'
    },
    {
      id: '4',
      title: 'Send contract to Digital Dynamics',
      description: 'Finalize and send signed contract',
      priority: 'High',
      status: 'Completed',
      dueDate: '2024-01-22',
      assignee: 'Alex Rodriguez',
      createdAt: '2024-01-15',
      type: 'Email'
    },
    {
      id: '5',
      title: 'Schedule meeting with SecureCorp',
      description: 'Set up kickoff meeting for new project',
      priority: 'Medium',
      status: 'Open',
      dueDate: '2024-01-26',
      assignee: 'Sarah Johnson',
      createdAt: '2024-01-21',
      type: 'Meeting'
    }
  ],
  leads: [
    {
      id: '1',
      name: 'John Smith',
      company: 'TechCorp Inc',
      email: 'john@techcorp.com',
      phone: '+1 555-0123',
      status: 'New',
      source: 'Website',
      createdAt: '2024-01-15',
      value: 25000
    },
    {
      id: '2',
      name: 'Emily Davis',
      company: 'StartupXYZ',
      email: 'emily@startupxyz.com',
      phone: '+1 555-0124',
      status: 'Qualified',
      source: 'LinkedIn',
      createdAt: '2024-01-14',
      value: 15000
    },
    {
      id: '3',
      name: 'Michael Brown',
      company: 'Enterprise Solutions',
      email: 'michael@enterprise.com',
      phone: '+1 555-0125',
      status: 'Contacted',
      source: 'Email Campaign',
      createdAt: '2024-01-13',
      value: 45000
    }
  ],
  contacts: [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      phone: '+1 555-0201',
      company: 'ABC Corporation',
      position: 'Marketing Director',
      status: 'Active',
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      name: 'Bob Wilson',
      email: 'bob@techfirm.com',
      phone: '+1 555-0202',
      company: 'Tech Firm LLC',
      position: 'CTO',
      status: 'Active',
      createdAt: '2024-01-08'
    }
  ],
  accounts: [
    {
      id: '1',
      name: 'Global Industries',
      industry: 'Manufacturing',
      revenue: 50000000,
      employees: 500,
      website: 'www.globalindustries.com',
      status: 'Active',
      owner: 'Sarah Johnson'
    },
    {
      id: '2',
      name: 'Digital Dynamics',
      industry: 'Technology',
      revenue: 25000000,
      employees: 150,
      website: 'www.digitaldynamics.com',
      status: 'Active',
      owner: 'Mike Chen'
    }
  ],
  addDeal: (deal) => set((state) => ({ deals: [...state.deals, deal] })),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),
  addContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),
  addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  updateDeal: (id, updates) => set((state) => ({
    deals: state.deals.map(deal => deal.id === id ? { ...deal, ...updates } : deal)
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => task.id === id ? { ...task, ...updates } : task)
  }))
}));