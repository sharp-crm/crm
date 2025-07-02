import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import { dealersApi, Dealer } from '../api/services';
import AddNewModal from '../components/Common/AddNewModal';
import { useAuthStore } from '../store/useAuthStore';

const Dealers: React.FC = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dealersApi.getAll();
      setDealers(data);
    } catch (err) {
      setError('Failed to load dealers. Please try again.');
      console.error('Error fetching dealers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    console.log('Edit dealer', id);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dealer?')) {
      return;
    }

    try {
      await dealersApi.delete(id);
      await fetchDealers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting dealer:', err);
      alert('Failed to delete dealer. Please try again.');
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
            setDefaultType('dealer');
            setIsModalOpen(true);
          }}
        >
          <Icons.Plus className="w-4 h-4 mr-2" />
          New Dealer
        </button>
      )}
    </>
  );

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dealers"
          subtitle="List of dealers and their associated subsidiaries"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Dealers' }]}
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
          title="Dealers"
          subtitle="List of dealers and their associated subsidiaries"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Dealers' }]}
          actions={headerActions}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Icons.AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dealers</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDealers}
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
        title="Dealers"
        subtitle="List of dealers and their associated subsidiaries"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Dealers' }]}
        actions={headerActions}
      />

      {dealers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Icons.UserCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Dealers Found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first dealer.</p>
          {canCreate && (
            <button
              onClick={() => {
                setDefaultType('dealer');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icons.Plus className="w-4 h-4 mr-2 inline" />
              Add Dealer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {dealers.map((dealer) => (
            <div
              key={dealer.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative"
            >
              {canEditOrDelete && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(dealer.id)}
                    className="text-gray-500 hover:text-blue-600"
                    title="Edit"
                  >
                    <Icons.Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dealer.id)}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Icons.UserCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900">{dealer.name}</p>
                  <p className="text-sm text-gray-500">{dealer.phone}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Email:</strong> {dealer.email}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Company:</strong> {dealer.company}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Location:</strong> {dealer.location}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Territory:</strong> {dealer.territory}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                  dealer.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {dealer.status}
                </span>
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

export default Dealers;
