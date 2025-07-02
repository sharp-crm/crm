import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const activityTrends = [
  { day: 'Mon', activities: 15 },
  { day: 'Tue', activities: 20 },
  { day: 'Wed', activities: 18 },
  { day: 'Thu', activities: 22 },
  { day: 'Fri', activities: 30 },
  { day: 'Sat', activities: 12 },
  { day: 'Sun', activities: 8 },
];

const activityTypes = [
  { name: 'Calls', value: 40 },
  { name: 'Emails', value: 30 },
  { name: 'Meetings', value: 20 },
  { name: 'Notes', value: 10 },
];

const userActivity = [
  { user: 'Alice', count: 28 },
  { user: 'Bob', count: 34 },
  { user: 'Charlie', count: 21 },
  { user: 'Diana', count: 18 },
];

const KPIs = [
  { title: 'Total Activities', value: 150 },
  { title: 'Avg/Day', value: '21.4' },
  { title: 'Top Performer', value: 'Bob' },
  { title: 'Peak Day', value: 'Friday' },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

const ActivityStats: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Activity Stats</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPIs.map((item, index) => (
          <div key={index} className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500">{item.title}</p>
            <p className="text-xl font-bold mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Activity Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityTrends}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="activities" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Types */}
<div className="bg-white rounded-2xl shadow p-4">
  <h3 className="text-lg font-semibold mb-2">Activity Type Breakdown</h3>
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie
        data={activityTypes}
        dataKey="value"
        nameKey="name"
        outerRadius={80}
        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
      >
        {activityTypes.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
</div>


        {/* User Activity */}
        <div className="bg-white rounded-2xl shadow p-4 md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">User-wise Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userActivity}>
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ActivityStats;
