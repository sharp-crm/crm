// src/Pages/Reports/Favourites.tsx
import React from 'react';
import PageHeader from '../../components/Common/PageHeader';
import DataTable from '../../components/Common/DataTable';
import { mockReports } from '../../data/mockReports';
import { Star, Clock } from 'lucide-react';

const Favourites: React.FC = () => {
  const data = mockReports.filter(r => r.isFavorite);

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'module', label: 'Module', sortable: true },
    { key: 'createdBy', label: 'Created By', sortable: true },
    { key: 'createdAt', label: 'Created On', sortable: true, render: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'lastViewed', label: 'Last Viewed', sortable: true, render: (v?: string) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'isFavorite', label: 'Favorite', render: (v: boolean) => v ? <Star className="w-4 h-4 text-yellow-500" /> : '—' },
    { key: 'schedule', label: 'Schedule', render: (v?: string) => v ? <span className="flex items-center text-blue-600 text-sm"><Clock className="w-3 h-3 mr-1" /> {v}</span> : '—' }
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Favourite Reports"
        subtitle="Reports you’ve marked as favourite"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Reports' }, { name: 'Favourites' }]}
      />
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default Favourites;
