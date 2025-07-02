import React, { useEffect, useState } from 'react';
import API from '../api/client';
import PageHeader from '../components/Common/PageHeader';
import { useAuthStore } from '../store/useAuthStore';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
}

// Role-permissions mapping based on your backend Role enum
const rolePermissions: Record<string, string[]> = {
  ADMIN: [
    "CREATE_USER", "UPDATE_USER", "DELETE_USER", "VIEW_ALL_REPORTS", "MANAGE_ROLES",
  ],
  SALES_MANAGER: [
    "CREATE_LEAD", "UPDATE_LEAD", "VIEW_LEADS", "VIEW_TEAM_REPORTS",
  ],
  SALES_REP: [
    "CREATE_LEAD", "VIEW_LEADS", "UPDATE_OWN_LEADS",
  ],
};

const AllUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const accessToken = useAuthStore((s) => s.accessToken);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await API.get('/users');

      const data = res.data;
      const userArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setUsers(userArray);
    } catch (err: any) {
      setError('Failed to load users: ' + (err.response?.data?.error || err.message));
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Group users by role
  const groupedUsers: Record<string, User[]> = users.reduce((acc, user) => {
    const roleKey = user.role?.toUpperCase() || 'UNKNOWN';
    if (!acc[roleKey]) acc[roleKey] = [];
    acc[roleKey].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  return (
    <div className="p-6">
      <PageHeader
        title="All Users"
        subtitle="List of all registered users grouped by role"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Users' }]}
      />

      {loading && <p className="text-gray-600">Loading users...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p className="text-gray-500 italic">No users found.</p>
      )}

      {!loading && !error && (
        <div className="space-y-8 mt-6">
          {Object.keys(groupedUsers).map((role) => (
            <div key={role}>
              {/* Role Header */}
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {role.replace('_', ' ')}
              </h3>

              {/* User List */}
              <ul className="space-y-3">
                {groupedUsers[role].map((user) => (
                  <li
                    key={user.id}
                    className="p-4 bg-white border rounded shadow hover:bg-gray-50 transition"
                  >
                    <div className="text-lg font-medium text-gray-800">
                      {user.name}{' '}
                      <span className="text-sm text-gray-500">({user.email})</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      Role: <span className="font-semibold">{user.role}</span>
                    </div>
                    {Array.isArray(user.permissions) && user.permissions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {user.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-300"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Role-wide Permissions */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Permissions for <span className="font-semibold">{role}</span>:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(rolePermissions[role] || []).map((perm) => (
                    <span
                      key={perm}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-300"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllUsers;
