import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import PageHeader from '../components/Common/PageHeader';
import DataTable from '../components/Common/DataTable';
import StatusBadge from '../components/Common/StatusBadge';
import ViewToggle from '../components/Common/ViewToggle';
import KanbanView from '../components/Views/KanbanView';
import GridView from '../components/Views/GridView';
import TimelineView from '../components/Views/TimelineView';
import ChartView from '../components/Views/ChartView';
import { useCRMStore } from '../store/crmStore';
import { ViewType } from '../types';
import AddNewModal from '../components/Common/AddNewModal';

const Deals: React.FC = () => {
  const { deals, updateDeal } = useCRMStore();
  const [currentView, setCurrentView] = useState<ViewType>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);


  const columns = [
    {
      key: 'name',
      label: 'Deal Name',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <Icons.Target className="w-4 h-4 text-orange-600" />
          </div>
          <div className="font-medium text-gray-900">{value}</div>
        </div>
      )
    },
    {
      key: 'account',
      label: 'Account',
      sortable: true
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">${value.toLocaleString()}</span>
      )
    },
    {
      key: 'stage',
      label: 'Stage',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'probability',
      label: 'Probability',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900">{value}%</span>
        </div>
      )
    },
    {
      key: 'closeDate',
      label: 'Close Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'owner',
      label: 'Owner',
      sortable: true
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

  const handleDealMove = (dealId: string, newStage: string) => {
    updateDeal(dealId, { stage: newStage as any });
  };

  const headerActions = (
    <>
      <ViewToggle
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icons.Filter className="w-4 h-4 mr-2" />
        Filter
      </button>
      <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Icons.Download className="w-4 h-4 mr-2" />
        Export
      </button>
      <button
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => {
          setDefaultType('deal'); // set the type
          setIsModalOpen(true);      // open the modal
        }}
      >
        <Icons.Plus className="w-4 h-4 mr-2" />
        New Deal
      </button>
    </>
  );

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const avgProbability = deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length;
  const expectedValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

  const renderContent = () => {
    switch (currentView) {
      case 'kanban':
        return <KanbanView data={deals} onItemMove={handleDealMove} type="deals" />;
      case 'grid':
        return <GridView data={deals} type="deals" onItemClick={(deal) => console.log('View deal:', deal)} />;
      case 'timeline':
        return <TimelineView data={deals} type="deals" />;
      case 'chart':
        return <ChartView data={deals} type="deals" />;
      default:
        return (
          <DataTable
            columns={columns}
            data={deals}
            actions={actions}
            onRowClick={(deal) => console.log('View deal:', deal)}
          />
        );
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Deals"
        subtitle="Track your sales opportunities"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Deals' }
        ]}
        actions={headerActions}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icons.Target className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Icons.DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icons.TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Probability</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(avgProbability)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icons.Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expected Value</p>
              <p className="text-2xl font-bold text-gray-900">${Math.round(expectedValue).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Overview - Only show for list view */}
      {currentView === 'list' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Pipeline</h3>
          <div className="grid grid-cols-6 gap-4">
            {['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((stage) => {
              const stageDeals = deals.filter(deal => deal.stage === stage);
              const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
              return (
                <div key={stage} className="text-center">
                  <div className="bg-gray-50 rounded-lg p-4 mb-2">
                    <p className="text-sm font-medium text-gray-600">{stage}</p>
                    <p className="text-lg font-bold text-gray-900">{stageDeals.length}</p>
                    <p className="text-sm text-gray-500">${stageValue.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderContent()}
      </div>

      <AddNewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={defaultType}
      />
    </div>
  );
};

export default Deals;