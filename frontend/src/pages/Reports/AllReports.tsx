// src/Pages/Reports/AllReports.tsx
import React from 'react';
import PageHeader from '../../components/Common/PageHeader';
import DataTable from '../../components/Common/DataTable';
import { mockReports } from '../../data/mockReports';
import { Star, Clock } from 'lucide-react';

const AllReports: React.FC = () => {
  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true
    },
    {
      key: 'module',
      label: 'Module',
      sortable: true
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
      key: 'lastViewed',
      label: 'Last Viewed',
      sortable: true,
      render: (value?: string) => value ? new Date(value).toLocaleDateString() : '—'
    },
    {
      key: 'isFavorite',
      label: 'Favorite',
      sortable: false,
      render: (value: boolean) => value ? <Star className="w-4 h-4 text-yellow-500" /> : '—'
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

  return (
    <div className="p-6">
      <PageHeader
        title="All Reports"
        subtitle="View all generated reports"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports' }]}
      />

      <DataTable
        columns={columns}
        data={mockReports}
        onRowClick={(report) => console.log('Clicked report:', report)}
      />
    </div>
  );
};

export default AllReports;
