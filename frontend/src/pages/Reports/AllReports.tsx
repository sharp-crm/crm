// src/Pages/Reports/AllReports.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/Common/PageHeader';
import DataTable from '../../components/Common/DataTable';
import { reportsApi, Report } from '../../api/services';
import { Star, Clock, AlertCircle } from 'lucide-react';

const AllReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getAll();
      setReports(data);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Title',
      sortable: true
    },
    {
      key: 'reportType',
      label: 'Module',
      sortable: true,
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    {
      key: 'createdBy',
      label: 'Created By',
      sortable: true
    },
    {
      key: 'createdAt',
      label: 'Created On',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'lastRun',
      label: 'Last Viewed',
      sortable: true,
      render: (value?: string) => value ? new Date(value).toLocaleDateString() : '—'
    },
    {
      key: 'isFavorite',
      label: 'Favorite',
      sortable: false,
      render: (value: boolean) => value ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : '—'
    },
    {
      key: 'schedule',
      label: 'Schedule',
      sortable: false,
      render: (value?: string) =>
        value ? (
          <span className="flex items-center text-blue-600 text-sm">
            <Clock className="w-3 h-3 mr-1" /> {value}
          </span>
        ) : '—'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="All Reports"
          subtitle="View all generated reports"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'All Reports' }]}
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
          title="All Reports"
          subtitle="View all generated reports"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'All Reports' }]}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchReports}
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
        title="All Reports"
        subtitle="View all generated reports"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'All Reports' }]}
      />

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first report.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          onRowClick={(report) => console.log('Clicked report:', report)}
        />
      )}
    </div>
  );
};

export default AllReports;
