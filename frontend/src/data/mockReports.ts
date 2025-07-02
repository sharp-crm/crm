// src/data/mockReports.ts
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

export const mockReports: Report[] = [
  {
    id: 'rpt-001',
    title: 'Monthly Sales Report',
    module: 'Deals',
    createdBy: 'John Doe',
    createdAt: '2024-12-01',
    lastViewed: '2025-06-10',
    isFavorite: true,
    schedule: '1st of every month at 9:00 AM'
  },
  {
    id: 'rpt-002',
    title: 'Lead Conversion Summary',
    module: 'Leads',
    createdBy: 'Jane Smith',
    createdAt: '2025-01-10',
    lastViewed: '2025-06-12',
    isFavorite: true
  },
  {
    id: 'rpt-003',
    title: 'Inactive Contacts',
    module: 'Contacts',
    createdBy: 'Admin',
    createdAt: '2024-11-20',
    lastViewed: '2025-06-13'
  },
  {
    id: 'rpt-004',
    title: 'Quarterly Revenue Trends',
    module: 'Deals',
    createdBy: 'Emma Watson',
    createdAt: '2025-03-01',
    isFavorite: false,
    schedule: 'Every quarter on 1st day at 10:00 AM'
  },
  {
    id: 'rpt-005',
    title: 'Task Completion Rate',
    module: 'Tasks',
    createdBy: 'John Doe',
    createdAt: '2025-02-15',
    lastViewed: '2025-06-09',
    isFavorite: true
  }
];
