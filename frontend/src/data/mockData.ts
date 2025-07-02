import { Lead, Contact, Account, Deal, Task, Meeting, Product, Notification, User } from '../types';
import myImage from '../Assets/avatar.png';


export const mockUser = {
  id: '1',
  name: 'John Paul A',
  email: 'johnpaula@sharpcrm.com',
  role: 'Admin',
  avatar: myImage
}

export const mockUsers = [
  {
    id: '1',
    name: 'John Paul A',
    email: 'johnpaula@sharpcrm.com',
    role: 'Admin'
  },
  {
    id: '2',
    name: 'Sarah Thomas',
    email: 'sarah@sharpcrm.com',
    role: 'Manager'
  },
  {
    id: '3',
    name: 'Kevin Patel',
    email: 'kevin@sharpcrm.com',
    role: 'Sales'
  },
  {
    id: '4',
    name: 'Anita Roy',
    email: 'anita@sharpcrm.com',
    role: 'Manager'
  },
  {
    id: '5',
    name: 'David Zhang',
    email: 'david@sharpcrm.com',
    role: 'Sales'
  }
];

export const mockLeads: Lead[] = [
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
];

export const mockContacts: Contact[] = [
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
];

export const mockAccounts: Account[] = [
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
];

export const mockDeals: Deal[] = [
  {
    id: '1',
    name: 'Q1 Software Implementation',
    account: 'Global Industries',
    value: 125000,
    stage: 'Proposal',
    probability: 75,
    closeDate: '2024-03-31',
    owner: 'Sarah Johnson'
  },
  {
    id: '2',
    name: 'Digital Transformation Project',
    account: 'Digital Dynamics',
    value: 85000,
    stage: 'Negotiation',
    probability: 90,
    closeDate: '2024-02-28',
    owner: 'Mike Chen'
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Follow up with TechCorp lead',
    description: 'Call John Smith to discuss requirements',
    priority: 'High',
    status: 'Open',
    dueDate: '2024-01-20',
    assignee: 'Sarah Johnson'
  },
  {
    id: '2',
    title: 'Prepare proposal for Global Industries',
    description: 'Create detailed proposal for Q1 implementation',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2024-01-25',
    assignee: 'Mike Chen'
  }
];

export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Sales Review Meeting',
    attendees: ['Sarah Johnson', 'Mike Chen', 'Emily Davis'],
    startTime: '2024-01-22T10:00:00',
    endTime: '2024-01-22T11:00:00',
    location: 'Conference Room A',
    status: 'Scheduled'
  },
  {
    id: '2',
    title: 'Client Demo - TechCorp',
    attendees: ['John Smith', 'Sarah Johnson'],
    startTime: '2024-01-23T14:00:00',
    endTime: '2024-01-23T15:00:00',
    location: 'Virtual Meeting',
    status: 'Scheduled'
  }
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'CRM Professional',
    category: 'Software',
    price: 99,
    cost: 45,
    description: 'Professional CRM solution',
    inStock: true
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    category: 'Add-on',
    price: 49,
    cost: 20,
    description: 'Advanced analytics and reporting',
    inStock: true
  }
];

export const mockNotifications = [
  { message: 'Closed a deal with TechNova.', time: '2 minutes ago', type: 'success', read: false },
  { message: 'You have a meeting in 30 minutes.', time: '1 hour ago', type: 'info', read: true },
  { message: 'Lead “Global Enterprises” has been converted.', time: '2 hours ago', type: 'success', read: false },
  { message: 'Task “Follow-up with client” is due today.', time: '5 hours ago', type: 'info', read: true },
  { message: 'New message from Sales Manager.', time: '1 day ago', type: 'info', read: false },
];


export const salesMetrics = {
  totalRevenue: 1250000,
  monthlyGrowth: 12.5,
  dealsWon: 23,
  dealsLost: 5,
  conversionRate: 82.1,
  avgDealSize: 54347
};

export const chartData = [
  { month: 'Jan', revenue: 85000, deals: 12 },
  { month: 'Feb', revenue: 92000, deals: 15 },
  { month: 'Mar', revenue: 78000, deals: 10 },
  { month: 'Apr', revenue: 105000, deals: 18 },
  { month: 'May', revenue: 115000, deals: 21 },
  { month: 'Jun', revenue: 125000, deals: 23 }
];

export const mockSubsidiaries = [
  {
    id: 1,
    name: "Sharp Technologies Pvt Ltd",
    address: "123 Tech Park, Bengaluru, KA",
    email: "contact@sharptech.com",
    contact: "+91 9876543210",
    totalEmployees: 150
  },
  {
    id: 2,
    name: "Sharp Innovations",
    address: "45 Innovation Blvd, Hyderabad, TS",
    email: "info@sharpinnov.com",
    contact: "+91 9123456780",
    totalEmployees: 80
  },
  {
    id: 3,
    name: "Sharp Systems",
    address: "88 IT Street, Pune, MH",
    email: "support@sharpsys.com",
    contact: "+91 9000001234",
    totalEmployees: 200
  }
];

export const mockDealers = [
  {
    id: 1,
    name: "Global Traders",
    address: "22 Market Road, Delhi",
    contact: "+91 9090909090",
    subsidiary: "Sharp Technologies Pvt Ltd"
  },
  {
    id: 2,
    name: "Tech Distributors",
    address: "15 Industrial Area, Chennai",
    contact: "+91 8080808080",
    subsidiary: "Sharp Innovations"
  },
  {
    id: 3,
    name: "North Solutions",
    address: "67 Commercial Hub, Jaipur",
    contact: "+91 7070707070",
    subsidiary: "Sharp Systems"
  }
];
