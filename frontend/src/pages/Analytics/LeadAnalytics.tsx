import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, ResponsiveContainer,
} from 'recharts';

const leadSources = [
  { name: 'Website', value: 400 },
  { name: 'Referral', value: 300 },
  { name: 'Email Campaign', value: 200 },
  { name: 'Social Media', value: 100 },
];

const leadStatusData = [
  { status: 'New', count: 100 },
  { status: 'Contacted', count: 80 },
  { status: 'Qualified', count: 50 },
  { status: 'Lost', count: 30 },
];

const recentLeads = [
  { date: 'June 1', leads: 20 },
  { date: 'June 2', leads: 35 },
  { date: 'June 3', leads: 28 },
  { date: 'June 4', leads: 40 },
  { date: 'June 5', leads: 30 },
  { date: 'June 6', leads: 22 },
];

const KPIData = [
  { title: 'Total Leads', value: 1200 },
  { title: 'Qualified Leads', value: 560 },
  { title: 'Lead Conversion Rate', value: '46.7%' },
  { title: 'Avg Lead Value', value: '$1,250' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const LeadAnalytics: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Lead Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPIData.map((item, index) => (
          <div key={index} className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500">{item.title}</p>
            <p className="text-xl font-bold mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Source Pie Chart */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={leadSources} dataKey="value" nameKey="name" outerRadius={80}>
                {leadSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Status Bar Chart */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Lead Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={leadStatusData}>
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Leads Line Chart */}
        <div className="bg-white rounded-2xl shadow p-4 md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Recent Lead Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={recentLeads}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LeadAnalytics;
