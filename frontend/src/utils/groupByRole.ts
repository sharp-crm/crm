import { mockUsers } from '../data/mockData';

export const groupUsersByRole = () => {
  const roleMap: { [role: string]: typeof mockUsers } = {};

  mockUsers.forEach((user) => {
    if (!roleMap[user.role]) {
      roleMap[user.role] = [];
    }
    roleMap[user.role].push(user);
  });

  return roleMap;
};
