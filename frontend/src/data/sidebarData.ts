import { SidebarItem } from '../types';

export const sidebarItems: SidebarItem[] = [
  { name: 'Home', path: '/', icon: 'Home' },
  { name: 'Contacts', path: '/contacts', icon: 'Users' },
  { name: 'Leads', path: '/leads', icon: 'UserPlus' },
  { name: 'Deals', path: '/deals', icon: 'Target' },
  { name: 'Tasks', path: '/tasks', icon: 'CheckSquare' },
  { name: 'Subsidiaries', path: '/subsidiaries', icon: 'Building' },
  { name: 'Dealers', path: '/dealers', icon: 'Users' },
  // { name: 'Accounts', path: '/accounts', icon: 'Building2' },

];

export const chatItems: SidebarItem[] = [
  {
    name: 'Team Chat',
    path: '/team-chat',
    icon: 'MessageSquare',
  }
];

export const modulesItem: SidebarItem = {
  name: 'Modules',
  path: '/modules',
  icon: 'LayoutGrid',
  children: sidebarItems
};

export const reportsItems: SidebarItem[] = [
  {
    name: 'Reports',
    path: '/reports',
    icon: 'BarChart3',
    children: [
      { name: 'All Reports', path: '/reports/all', icon: 'FileBarChart' },
      { name: 'Favourites', path: '/reports/favourites', icon: 'Star' },
      { name: 'Scheduled Reports', path: '/reports/scheduled', icon: 'Calendar' },

    ]
  }
];

export const analyticsItems: SidebarItem[] = [
  {
    name: 'Analytics',
    path: '/analytics',
    icon: 'PieChart',
    children: [
      { name: 'Org Overview', path: '/analytics/overview', icon: 'Building2' },
      { name: 'Lead Analytics', path: '/analytics/leads', icon: 'UserPlus' },
      { name: 'Deal Insights', path: '/analytics/deals', icon: 'Target' },
      { name: 'Activity Stats', path: '/analytics/activity', icon: 'Activity' }
    ]
  }
];

export const settingsItems: SidebarItem[] = [
  {
    name: 'Settings',
    path: '/settings',
    icon: 'Settings',
    children: [
      { name: 'Personal Settings', path: '/settings/general/personal', icon: 'User' },
      { name: 'Access Control', path: '/settings/security/access-control', icon: 'Users' },
    ]
  }
];




