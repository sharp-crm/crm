
export interface Role {
  id: string;
  name: string;
  permissions: string[]; // List of permission keys
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  department: string;
}



export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  source: string;
  createdAt: string;
  value: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  revenue: number;
  employees: number;
  website: string;
  status: 'Active' | 'Inactive';
  owner: string;
}

export interface Deal {
  id: string;
  name: string;
  account: string;
  value: number;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  closeDate: string;
  owner: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Completed';
  dueDate: string;
  assignee: string;
  createdAt: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Demo';
}

export interface Meeting {
  id: string;
  title: string;
  attendees: string[];
  startTime: string;
  endTime: string;
  location: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  description: string;
  inStock: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export interface SidebarItem {
  name: string;
  path: string;
  icon: string;
  children?: SidebarItem[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'call' | 'task' | 'demo';
  attendees?: string[];
}

export type ViewType = 'list' | 'kanban' | 'grid' | 'timeline' | 'chart';