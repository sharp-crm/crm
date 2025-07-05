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

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  visibleTo?: string[];
}

export interface Deal {
  id: string;
  // Required fields from AddNewModal
  dealOwner: string;
  dealName: string;
  leadSource: string;
  stage: 'Need Analysis' | 'Value Proposition' | 'Identify Decision Makers' | 'Negotiation/Review' | 'Closed Won' | 'Closed Lost' | 'Closed Lost to Competition';
  amount: number;
  visibleTo?: string[]; // Changed from required to optional
  
  // Optional fields from AddNewModal  
  description?: string;
  
  // Additional fields for deal functionality
  value?: number; // same as amount for backward compatibility
  probability?: number;
  closeDate?: string;
  
  // Backward compatibility fields
  name?: string; // maps to dealName
  owner?: string; // maps to dealOwner
  
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

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Follow Up' | 'Completed';
  dueDate: string;
  assignee: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Demo';
  tenantId: string;
  
  // Audit fields
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  isDeleted?: boolean;
  
  // Visibility field
  visibleTo?: string[];
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

export interface Dealer {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  website: string;
  status: 'Active' | 'Inactive';
  description: string;
  createdAt: string;
  visibleTo: string[];
}

export interface Subsidiary {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  website: string;
  registrationNumber: string;
  status: 'Active' | 'Inactive';
  description: string;
  createdAt: string;
  visibleTo: string[];
}

export interface TenantUser {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;  // Add role property
  tenantId: string;
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: FormFieldOption[];
  group?: string;
  help?: string;  // Add help property for field description
}

export type Report = {
  id: string;
  title: string;
  module: string;
  createdBy: string;
  createdAt: string;
  lastViewed?: string;
  isFavorite?: boolean;
  schedule?: string;
};