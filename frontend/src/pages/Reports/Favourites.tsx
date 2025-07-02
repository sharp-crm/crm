// src/Pages/Reports/Favourites.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/Common/PageHeader';
import DataTable from '../../components/Common/DataTable';
import { reportsApi, Report } from '../../api/services';
import { Star, AlertCircle } from 'lucide-react';

const Favourites: React.FC = () => {
  const [favoriteReports, setFavoriteReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavoriteReports();
  }, []);

  const fetchFavoriteReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getFavorites();
      setFavoriteReports(data);
    } catch (err) {
      setError('Failed to load favorite reports. Please try again.');
      console.error('Error fetching favorite reports:', err);
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
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      sortable: true,
      render: (value?: string) => value ? new Date(value).toLocaleDateString() : 'Never'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Favourite Reports"
          subtitle="Your starred reports"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'Favourites' }]}
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
          title="Favourite Reports"
          subtitle="Your starred reports"
          breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'Favourites' }]}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Favourite Reports</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFavoriteReports}
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
        title="Favourite Reports"
        subtitle="Your starred reports"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports', path: '/reports' }, { name: 'Favourites' }]}
      />

      {favoriteReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Star className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Favourite Reports</h3>
          <p className="text-gray-600 mb-4">Star reports from the All Reports page to see them here.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={favoriteReports}
          onRowClick={(report) => console.log('Clicked report:', report)}
        />
      )}
    </div>
  );
};

export default Favourites;
