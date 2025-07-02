import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import { subsidiariesApi, Subsidiary } from '../api/services';
import AddNewModal from '../components/Common/AddNewModal';
import { useAuthStore } from '../store/useAuthStore';

const Subsidiaries: React.FC = () => {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSubsidiaries();
  }, []);

  const fetchSubsidiaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subsidiariesApi.getAll();
      setSubsidiaries(data);
    } catch (err) {
      setError('Failed to load subsidiaries. Please try again.');
      console.error('Error fetching subsidiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    console.log("Edit subsidiary", id);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subsidiary?')) {
      return;
    }

    try {
      await subsidiariesApi.delete(id);
      await fetchSubsidiaries(); // Refresh the list
    } catch (err) {
      console.error('Error deleting subsidiary:', err);
      alert('Failed to delete subsidiary. Please try again.');
    }
  };

  const canEditOrDelete = user?.role === 'Admin' || user?.role === 'Manager';
  const canCreate = user?.role === 'Admin' || user?.role === 'Manager';

  const headerActions = (
    <>
      <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icons.Filter className="w-4 h-4 mr-2" />
        Filter
      </button>
      <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icons.Download className="w-4 h-4 mr-2" />
        Export
      </button>
      {canCreate && (
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            setDefaultType('subsidiary');
            setIsModalOpen(true);
          }}
        >
          <Icons.Plus className="w-4 h-4 mr-2" />
          New Subsidiary
        </button>
      )}
    </>
  );

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Subsidiaries"
          subtitle="List of company subsidiaries"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Subsidiaries' }]}
          actions={headerActions}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Subsidiaries"
          subtitle="List of company subsidiaries"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Subsidiaries' }]}
          actions={headerActions}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Icons.AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Subsidiaries</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSubsidiaries}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Subsidiaries"
        subtitle="List of company subsidiaries"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Subsidiaries' }]}
        actions={headerActions}
      />

      {subsidiaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Icons.Building2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subsidiaries Found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first subsidiary.</p>
          {canCreate && (
            <button
              onClick={() => {
                setDefaultType('subsidiary');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icons.Plus className="w-4 h-4 mr-2 inline" />
              Add Subsidiary
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {subsidiaries.map(sub => (
            <div
              key={sub.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative"
            >
              {canEditOrDelete && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(sub.id)}
                    className="text-gray-500 hover:text-blue-600"
                    title="Edit"
                  >
                    <Icons.Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icons.Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900">{sub.name}</p>
                  <p className="text-sm text-gray-500">{sub.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Address:</strong> {sub.address}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Contact:</strong> {sub.contact}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Total Employees:</strong> {sub.totalEmployees}
              </p>
            </div>
          ))}
        </div>
      )}
      
      <AddNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={defaultType}
      />
    </div>
  );
};

export default Subsidiaries;
