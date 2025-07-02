// src/Pages/Reports/ScheduledReports.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/Common/PageHeader';
import DataTable from '../../components/Common/DataTable';
import { reportsApi, Report } from '../../api/services';
import { Clock, AlertCircle } from 'lucide-react';

const ScheduledReports: React.FC = () => {
  const [scheduledReports, setScheduledReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getScheduled();
      setScheduledReports(data);
    } catch (err) {
      setError('Failed to load scheduled reports. Please try again.');
      console.error('Error fetching scheduled reports:', err);
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
      label: 'Type',
      sortable: true,
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    {
      key: 'schedule',
      label: 'Schedule',
      sortable: true,
      render: (value: string) => (
        <span className="flex items-center text-blue-600">
          <Clock className="w-4 h-4 mr-1" />
          {value}
        </span>
      )
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      sortable: true,
      render: (value?: string) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Scheduled Reports"
          subtitle="Reports with automated schedules"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'Scheduled' }]}
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
          title="Scheduled Reports"
          subtitle="Reports with automated schedules"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'Scheduled' }]}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Scheduled Reports</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchScheduledReports}
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
        title="Scheduled Reports"
        subtitle="Reports with automated schedules"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'Scheduled' }]}
      />

      {scheduledReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h3>
          <p className="text-gray-600 mb-4">Set up automatic report generation by adding schedules to your reports.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={scheduledReports}
          onRowClick={(report) => console.log('Clicked report:', report)}
        />
      )}
    </div>
  );
};

export default ScheduledReports;
