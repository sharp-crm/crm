import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import DataTable from '../components/Common/DataTable';
import StatusBadge from '../components/Common/StatusBadge';
import { mockLeads } from '../data/mockData';
import AddNewModal from '../components/Common/AddNewModal';

const Leads: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    campaigns: false,
    city: false,
    company: false,
    leadSource: false
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
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-blue-700">
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
    { key: 'company', label: 'Company', sortable: true },
    { key: 'phone', label: 'Phone', sortable: false },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    { key: 'source', label: 'Source', sortable: true },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">${value.toLocaleString()}</span>
      )
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
      
      <button
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setDefaultType('lead');
          setIsModalOpen(true);
        }}
      >
        <Icons.Plus className="w-4 h-4 mr-2" />
        New Lead
      </button>
    </>
  );

  return (
    <div className="p-6 lg:p-8 overflow-x-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-72 bg-white p-6 border border-gray-200 rounded-xl shadow-sm h-fit">
          <p className="font-medium text-gray-700 mb-4">Filter Leads by</p>
          <div className="text-sm text-gray-600 space-y-5">
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 h-4 w-4" checked={filters.campaigns} onChange={() => handleCheckboxChange('campaigns')} />
                Status
              </label>
              {filters.campaigns && (
                <div className="mt-3 space-y-2 pl-4">
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500">
                    <option>-Select Status Type-</option>
                    <option>New</option>
                    <option>Follow Up</option>
                    <option>Qualified</option>
                    <option>Contacted</option>
                    <option>Converted</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 h-4 w-4" checked={filters.city} onChange={() => handleCheckboxChange('city')} />
                Date
              </label>
              {filters.city && (
                <div className="mt-3 pl-4 space-y-2">
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 h-4 w-4" checked={filters.company} onChange={() => handleCheckboxChange('company')} />
                Company
              </label>
              {filters.company && (
                <div className="mt-3 pl-4">
                  <input
                    type="text"
                    placeholder="Company name"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 h-4 w-4" checked={filters.leadSource} onChange={() => handleCheckboxChange('leadSource')} />
                Lead Source
              </label>
              {filters.leadSource && (
                <div className="mt-3 pl-4">
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500">
                    <option>Email</option>
                    <option>Website</option>
                    <option>Cold Call</option>
                    <option>Social Media</option>
                    <option>Referral</option>
                    <option>Other</option>
                  </select>
                </div>
              )}
            </div>

            <button className="w-full mt-6 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Apply Filter
            </button>
            <button className="w-full mt-3 py-2 px-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Clear
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Leads"
            subtitle="Manage your potential customers"
            breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Leads' }]}
            actions={headerActions}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-xl font-semibold text-gray-900">{mockLeads.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">New Leads</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {mockLeads.filter(lead => lead.status === 'New').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Converted Leads</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {mockLeads.filter(lead => lead.status === 'Converted').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ${mockLeads.reduce((sum, lead) => sum + lead.value, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="mt-8 bg-white shadow-sm rounded-xl border border-gray-200">
            <div className="p-6">
              <DataTable
                columns={columns}
                data={mockLeads}
                actions={actions}
                onRowClick={(lead) => console.log('View lead:', lead)}
                className="min-w-full"
                rowClassName="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 py-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AddNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={defaultType}
      />
    </div>
  );
};

export default Leads;