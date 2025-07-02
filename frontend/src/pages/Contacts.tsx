import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import DataTable from '../components/Common/DataTable';
import StatusBadge from '../components/Common/StatusBadge';
import { mockContacts } from '../data/mockData';
import AddNewModal from '../components/Common/AddNewModal';

const Contacts: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: false,
    company: false,
    createdDate: false
  });

  const handleCheckboxChange = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-green-700">
              {value.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true
    },
    {
      key: 'position',
      label: 'Position',
      sortable: true
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  const actions = (row: any) => (
    <div className="flex items-center space-x-2">
      <button className="p-1 text-gray-400 hover:text-gray-600">
        <Icons.Eye className="w-4 h-4" />
      </button>
      <button className="p-1 text-gray-400 hover:text-gray-600">
        <Icons.Edit2 className="w-4 h-4" />
      </button>
      <button className="p-1 text-gray-400 hover:text-red-600">
        <Icons.Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const headerActions = (
    <>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icons.Download className="w-4 h-4 mr-2" />
        Export
      </button>
      <button
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setDefaultType('contact');
          setIsModalOpen(true);
        }}
      >
        <Icons.Plus className="w-4 h-4 mr-2" />
        New Contact
      </button>
    </>
  );

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-64 bg-white p-4 border border-gray-200 rounded-lg shadow-sm h-fit">
          <p className="font-medium text-gray-700 mb-2">Filter Contacts by</p>
          <div className="text-sm text-gray-600 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.status}
                  onChange={() => handleCheckboxChange('status')}
                />
                Status
              </label>
              {filters.status && (
                <div className="mt-2 pl-4">
                  <select className="w-full border border-gray-300 rounded p-1 text-sm">
                    <option>All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Archived</option>
                  </select>
                </div>
              )}
            </div>

            {/* Company Filter */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.company}
                  onChange={() => handleCheckboxChange('company')}
                />
                Company
              </label>
              {filters.company && (
                <div className="mt-2 pl-4">
                  <input
                    type="text"
                    placeholder="Company name"
                    className="w-full border border-gray-300 rounded p-1 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Created Date Filter */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.createdDate}
                  onChange={() => handleCheckboxChange('createdDate')}
                />
                Created Date
              </label>
              {filters.createdDate && (
                <div className="mt-2 pl-4">
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded p-1 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <button className="w-full mt-4 py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700">
              Apply Filter
            </button>
            <button className="w-full mt-2 py-2 px-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Clear
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Contacts"
            subtitle="Manage your business contacts"
            breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Contacts' }]}
            actions={headerActions}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icons.Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{mockContacts.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icons.CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockContacts.filter(contact => contact.status === 'Active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icons.Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Companies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(mockContacts.map(c => c.company)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts Table */}
          <DataTable
            columns={columns}
            data={mockContacts}
            actions={actions}
            onRowClick={(contact) => console.log('View contact:', contact)}
          />

          <AddNewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            defaultType={defaultType}
          />
        </div>
      </div>
    </div>
  );
};

export default Contacts;
