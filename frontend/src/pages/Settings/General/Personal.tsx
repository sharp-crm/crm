import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../../../components/Common/PageHeader';
import { useAuthStore } from '../../../store/useAuthStore';
import API from '../../../api/client';
import avatar from '../../../Assets/avatar.png';
import PhoneNumberInput from '../../../components/Common/PhoneNumberInput';
import PasswordStrengthMeter from '../../../components/Common/PasswordStrengthMeter';
import { validatePassword } from '../../../utils/passwordValidation';

const Personal: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Load user data when component mounts or user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'password') {
      setPasswordTouched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    // Validate password strength if password is being changed
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        setError('Password does not meet security requirements');
        return;
      }
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        password: formData.password || undefined, // don't send if empty
      };

      await API.put(`/users/${user?.userId}`, payload);

      setSuccess('Profile updated successfully.');

      const { setUser } = useAuthStore.getState();
      setUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      });

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Personal Settings"
        subtitle="Manage your personal information and preferences"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Settings'},
          { name: 'Personal' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            <p className="text-sm text-gray-600">Update your personal details and preferences.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <img
                src={avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <button
                  type="button"
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icons.Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </button>
                <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <PhoneNumberInput
                  value={formData.phoneNumber}
                  onChange={(phoneNumber) => setFormData(prev => ({ ...prev, phoneNumber }))}
                  placeholder="Enter phone number"
                  className="w-full"
                />
              </div>
            </div>

            {/* Password Update */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.password && passwordTouched && (
                  <div className="mt-2">
                    <PasswordStrengthMeter
                      password={formData.password}
                      showRequirements={true}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
              <button
                type="submit"
                disabled={
                  (formData.password.length > 0 && !validatePassword(formData.password).isValid) ||
                  (formData.password.length > 0 && formData.password !== formData.confirmPassword)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Personal;

