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

const Tasks: React.FC = () => {
  const { tasks, updateTask } = useCRMStore();
  const [currentView, setCurrentView] = useState<ViewType>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<string | null>(null);

  const columns = [
    {
      key: 'title',
      label: 'Task',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <Icons.CheckSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 line-clamp-1">{row.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} variant="warning" />
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    {
      key: 'assignee',
      label: 'Assignee',
      sortable: true
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value: string) => {
        const dueDate = new Date(value);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isDueSoon = dueDate.getTime() - today.getTime() < 3 * 24 * 60 * 60 * 1000; // 3 days
        
        return (
          <span className={`${
            isOverdue ? 'text-red-600 font-medium' : 
            isDueSoon ? 'text-orange-600 font-medium' : 
            'text-gray-900'
          }`}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      }
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
        className="p-1 text-gray-400 hover:text-green-600"
        onClick={() => updateTask(row.id, { status: 'Completed' })}
      >
        <Icons.Check className="w-4 h-4" />
      </button>
      <button className="p-1 text-gray-400 hover:text-red-600">
        <Icons.Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const handleTaskMove = (taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
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
          setDefaultType('task'); // set the type
          setIsModalOpen(true);      // open the modal
        }}
      >
        <Icons.Plus className="w-4 h-4 mr-2" />
        New Task
      </button>
    </>
  );

  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const openTasks = tasks.filter(task => task.status === 'Open').length;
  const highPriorityTasks = tasks.filter(task => task.priority === 'High').length;

  const renderContent = () => {
    switch (currentView) {
      case 'kanban':
        return <KanbanView data={tasks} onItemMove={handleTaskMove} type="tasks" />;
      case 'grid':
        return <GridView data={tasks} type="tasks" onItemClick={(task) => console.log('View task:', task)} />;
      case 'timeline':
        return <TimelineView data={tasks} type="tasks" />;
      case 'chart':
        return <ChartView data={tasks} type="tasks" />;
      default:
        return (
          <DataTable
            columns={columns}
            data={tasks}
            actions={actions}
            onRowClick={(task) => console.log('View task:', task)}
          />
        );
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage your to-do items and activities"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Tasks' }
        ]}
        actions={headerActions}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icons.CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Icons.CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icons.Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Icons.AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{highPriorityTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Overview - Only show for list view */}
      {currentView === 'list' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            {['Open', 'In Progress', 'Completed'].map((status) => {
              const statusTasks = tasks.filter(task => task.status === status);
              return (
                <div key={status} className="text-center">
                  <div className="bg-gray-50 rounded-lg p-4 mb-2">
                    <p className="text-sm font-medium text-gray-600">{status}</p>
                    <p className="text-lg font-bold text-gray-900">{statusTasks.length}</p>
                    <p className="text-sm text-gray-500">
                      {Math.round((statusTasks.length / tasks.length) * 100)}% of total
                    </p>
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

export default Tasks;