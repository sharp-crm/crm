import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import DataTable from '../components/Common/DataTable';
import StatusBadge from '../components/Common/StatusBadge';
import { leadsApi, Lead } from '../api/services';
import AddNewModal from '../components/Common/AddNewModal';

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    campaigns: false,
    city: false,
    company: false,
    leadSource: false
  });

  // Fetch leads data on component mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await leadsApi.getAll();
        setLeads(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads');
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleCheckboxChange = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDelete = async (id: string) => {
    try {
      await leadsApi.delete(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead');
    }
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
      <button 
        className="p-1 text-gray-400 hover:text-red-600"
        onClick={() => handleDelete(row.id)}
      >
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

  const getStatusCounts = () => {
    const counts = {
      total: leads.length,
      new: leads.filter(lead => lead.status === 'New').length,
      qualified: leads.filter(lead => lead.status === 'Qualified').length,
      contacted: leads.filter(lead => lead.status === 'Contacted').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <Icons.AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-xl font-semibold text-gray-900">{statusCounts.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Qualified</p>
                  <p className="text-xl font-semibold text-gray-900">{statusCounts.qualified}</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.UserPlus className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">New Leads</p>
                  <p className="text-xl font-semibold text-gray-900">{statusCounts.new}</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Icons.DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-xl font-semibold text-gray-900">${totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {leads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Icons.Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first lead.</p>
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                onClick={() => {
                  setDefaultType('lead');
                  setIsModalOpen(true);
                }}
              >
                <Icons.Plus className="w-4 h-4 mr-2" />
                New Lead
              </button>
            </div>
          ) : (
            <DataTable
              data={leads}
              columns={columns}
              actions={actions}
            />
          )}
        </div>
      </div>

      {/* Add New Modal */}
      <AddNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={defaultType}
        onSuccess={() => {
          // Refresh leads data after successful creation
          leadsApi.getAll().then(setLeads).catch(console.error);
        }}
      />
    </div>
  );
};

export default Leads;