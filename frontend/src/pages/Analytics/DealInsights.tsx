import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const dealStages = [
  { stage: 'Prospecting', count: 50 },
  { stage: 'Proposal', count: 35 },
  { stage: 'Negotiation', count: 25 },
  { stage: 'Closed Won', count: 60 },
  { stage: 'Closed Lost', count: 20 },
];

const monthlyDeals = [
  { month: 'Jan', deals: 25 },
  { month: 'Feb', deals: 30 },
  { month: 'Mar', deals: 28 },
  { month: 'Apr', deals: 32 },
  { month: 'May', deals: 36 },
  { month: 'Jun', deals: 40 },
];

const revenueSources = [
  { name: 'New Clients', value: 50000 },
  { name: 'Existing Clients', value: 70000 },
  { name: 'Upsells', value: 25000 },
];

const KPIData = [
  { title: 'Total Deals', value: 480 },
  { title: 'Closed Deals', value: 220 },
  { title: 'Avg Deal Size', value: '$2,300' },
  { title: 'Win Rate', value: '45.8%' },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const DealInsights: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Deal Insights</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPIData.map((item, index) => (
          <div key={index} className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500">{item.title}</p>
            <p className="text-xl font-bold mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deal Stages */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Deal Stages Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dealStages}>
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Sources */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Revenue Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={revenueSources}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {revenueSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Deal Trend */}
        <div className="bg-white rounded-2xl shadow p-4 md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Monthly Deal Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyDeals}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="deals" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DealInsights;
