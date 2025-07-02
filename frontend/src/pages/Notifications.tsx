import React from 'react';
import * as Icons from 'lucide-react';
import { mockNotifications } from '../data/mockData';
import PageHeader from '../components/Common/PageHeader';

const Notifications: React.FC = () => {
  return (
    <div className="p-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with recent activity"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Notifications' }
        ]}
      />

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <ul className="divide-y divide-gray-200">
          {mockNotifications.map((notification, index) => (
            <li key={index} className="p-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors">
              <div className="mt-1">
                {notification.type === 'success' ? (
                  <Icons.CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Icons.Info className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
              {!notification.read && (
                <span className="text-xs text-white bg-blue-500 rounded-full px-2 py-0.5">New</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Notifications;
