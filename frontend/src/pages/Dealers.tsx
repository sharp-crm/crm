import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import { mockDealers, mockUser } from '../data/mockData'; // assuming mockUser is here
import AddNewModal from '../components/Common/AddNewModal';

const Dealers: React.FC = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    console.log('Edit dealer', id);
    // TODO: Open modal or navigate to edit screen
  };

  const handleDelete = (id: string) => {
    console.log('Delete dealer', id);
    // TODO: Confirm and delete logic
  };

  const canEditOrDelete = mockUser.role === 'Admin' || mockUser.role === 'Manager';
  const canCreate = mockUser.role === 'Admin' || mockUser.role === 'Manager';

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
          setDefaultType('dealer'); // set the type
          setIsModalOpen(true);      // open the modal
        }}
      >
        <Icons.Plus className="w-4 h-4 mr-2" />
        New Dealer
      </button>
      )}
    </>
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Dealers"
        subtitle="List of dealers and their associated subsidiaries"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Dealers' }]}
        actions={headerActions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {mockDealers.map((dealer) => (
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
                <p className="text-sm text-gray-500">{dealer.contact}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">
              <strong>Address:</strong> {dealer.address}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Subsidiary:</strong> {dealer.subsidiary}
            </p>
          </div>
        ))}
      </div>
      <AddNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={defaultType}
      />
    </div>
  );
};

export default Dealers;
