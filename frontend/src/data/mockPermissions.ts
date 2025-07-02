// mockPermissions.ts

export const roles = [
  {
    id: 'r1',
    name: 'Admin',
    permissions: ['View Reports', 'Edit Users', 'Manage Settings', 'Delete Records']
  },
  {
    id: 'r2',
    name: 'Manager',
    permissions: ['View Reports', 'Edit Users']
  },
  {
    id: 'r3',
    name: 'Employee',
    permissions: ['View Reports']
  },
];

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
    role: 'Employee'
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
    role: 'Employee'
  }
];
