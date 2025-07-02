import React, { useState } from 'react';
import API from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

interface AddNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddNewUserModal: React.FC<AddNewUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: isSuperAdmin ? 'ADMIN' : 'SALES_REP', // Super admin defaults to ADMIN
    dateOfBirth: '',
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Add username field (required by backend)
      const payload = {
        ...formData,
        username: `${formData.firstName} ${formData.lastName}`
      };
      
      const res = await API.post('/users', payload);
      if (res.status === 201) {
        onUserAdded(); // refresh list
        onClose(); // close modal
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errorMessage || 'User creation failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">
          {isSuperAdmin ? 'Add New Admin' : 'Add New User'}
        </h2>
        {error && (
          <div className="text-red-600 text-sm mb-4 bg-red-100 px-4 py-2 rounded">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="w-1/2 p-2 border rounded" />
            <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="w-1/2 p-2 border rounded" />
          </div>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full p-2 border rounded" />
          <input type="tel" name="phoneNumber" placeholder="+1234567890" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 border rounded" />
          <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-2 border rounded">
            {isSuperAdmin ? (
              // Super Admin can only create Admins
              <option value="ADMIN">Admin</option>
            ) : isAdmin ? (
              // Admins can create Sales Reps and Sales Managers, but not other Admins
              <>
                <option value="SALES_REP">Sales Rep</option>
                <option value="SALES_MANAGER">Sales Manager</option>
              </>
            ) : (
              // Other roles (if any) have no creation permissions
              <option value="" disabled>No permissions to create users</option>
            )}
          </select>
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="w-full p-2 border rounded" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewUserModal;
