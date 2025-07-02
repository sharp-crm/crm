import React, { useEffect, useState } from 'react';
import API from '../api/client';
import PageHeader from '../components/Common/PageHeader';
import { useAuthStore } from '../store/useAuthStore';
import AddNewUserModal from '../components/AddNewUserModal';

interface User {
  lastName: string;
  firstName: string;
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  permissions?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const domain = useAuthStore((s) => s.user?.email?.split('@')[1]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await API.get('/users/tenant-users');


      const data = res.data;
      const userArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setUsers(userArray);
    } catch (err: any) {
      setError('Failed to load users.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (userId: string, firstName: string, lastName: string) => {
    const userName = `${firstName} ${lastName}`;
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${userName}? This action cannot be undone.`
    );
    
    if (!isConfirmed) {
      return;
    }

    try {
      await API.put(`/users/${userId}/soft-delete`, {});
      
      // Show success message
      alert(`User ${userName} has been successfully deleted.`);
      
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error("Failed to soft delete user", error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || "Failed to delete user";
      alert(`Error: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => !user.isDeleted);

  // Group users by role
  const groupedUsers: Record<string, User[]> = filteredUsers.reduce((acc, user) => {
    const roleKey = user.role?.toUpperCase() || 'UNKNOWN';
    if (!acc[roleKey]) acc[roleKey] = [];
    acc[roleKey].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="All Users"
          subtitle="List of all registered users grouped by role"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Users' }]}
        />
        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add New User
          </button>
        )}
      </div>

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
                      {user.firstName + " " + user.lastName}{' '}
                      <br />
                      <span className="text-sm text-gray-500">({user.email})</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      Role: <span className="font-semibold">{user.role}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(rolePermissions[user.role?.toUpperCase()] || []).map((perm) => (
                        <span
                          key={perm}
                          className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-300"
                        >
                          {perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>

                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                      <div className="mt-3 flex gap-4">
                        {/* Show delete button only if:
                            1. User is not the currently logged-in user
                            2. User is not the super admin (john@sharp.com)
                        */}
                        {currentUser?.userId !== user.id && 
                         user.email !== 'john@sharp.com' && (
                          <button
                            onClick={() => handleSoftDelete(user.id, user.firstName, user.lastName)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <AddNewUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={() => {
          fetchUsers();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default AllUsers;
