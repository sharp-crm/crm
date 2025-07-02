import React from "react";
import * as Icons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from "../store/useAuthStore"; // ✅ import your Zustand store


const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-center space-x-5 hover:shadow-lg transition-shadow duration-200 min-w-[220px] hover:bg-gray-50">
    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    Negotiation: "bg-yellow-100 text-yellow-800",
    Proposal: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-gray-100 text-gray-800"
      }`}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
};

const Home: React.FC = () => {
  const today = new Date();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user); // ✅ get current user

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString.split('/').reverse().join('-'));
    return dueDate < today;
  };

  return (
    <div className="p-6 lg:p-8 space-y-10 max-w-screen-xl mx-auto">
      {/* ✅ Personalized Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.username || 'User'}
            </h1>
            <p className="text-md text-gray-600 mt-2">
              Today is {today.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}, {today.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })} IST
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/leads')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icons.Users className="w-5 h-5 inline mr-2" /> View Leads
            </button>
            <button
              onClick={() => navigate('/deals')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Icons.Target className="w-5 h-5 inline mr-2" /> View Deals
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="My Open Deals" value="8" icon={Icons.Target} />
        <StatCard label="My Untouched Deals" value="2" icon={Icons.AlertCircle} />
        <StatCard label="My Calls Today" value="1" icon={Icons.Phone} />
        <StatCard label="My Leads" value="11" icon={Icons.Users} />
      </div>

      {/* Tasks and Notifications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Open Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">My Open Tasks</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-4 hover:underline transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.CheckSquare className="w-5 h-5 mr-2" /> Subject</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Calendar className="w-5 h-5 mr-2" /> Due Date</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Info className="w-5 h-5 mr-2" /> Status</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Flag className="w-5 h-5 mr-2" /> Priority</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    subject: "Register for upcoming CRM Webinars",
                    due: "13/06/2025",
                    status: "Not Started",
                    priority: "Low",
                  },
                  {
                    subject: "Refer CRM Videos",
                    due: "15/06/2025",
                    status: "In Progress",
                    priority: "Normal",
                  },
                  {
                    subject: "Competitor Comparison",
                    due: "11/06/2025",
                    status: "Not Started",
                    priority: "Highest",
                  },
                ].map((task, index) => (
                  <tr
                    key={index}
                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => navigate('/tasks')}
                  >
                    <td className="py-4 px-6">{task.subject}</td>
                    <td className={`py-4 px-6 ${isOverdue(task.due) ? "text-red-600 font-medium" : "text-gray-800"}`}>
                      {task.due}
                    </td>
                    <td className="py-4 px-6 text-gray-700">{task.status}</td>
                    <td className={`py-4 px-6 ${task.priority === "Highest" ? "text-red-600 font-medium" : "text-gray-700"}`}>
                      {task.priority}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Notifications</h3>
            <button
              onClick={() => navigate('/notifications')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-4 hover:underline transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Bell className="w-5 h-5 mr-2" /> Message</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Clock className="w-5 h-5 mr-2" /> Timestamp</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Info className="w-5 h-5 mr-2" /> Type</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    message: "New lead assigned: Jason Roy",
                    timestamp: "15/06/2025 09:30 AM",
                    type: "Lead",
                  },
                  {
                    message: "Deal stage updated: Website Revamp to Negotiation",
                    timestamp: "15/06/2025 08:45 AM",
                    type: "Deal",
                  },
                  {
                    message: "Task overdue: Competitor Comparison",
                    timestamp: "15/06/2025 07:00 AM",
                    type: "Task",
                  },
                ].map((notification, index) => (
                  <tr
                    key={index}
                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => navigate('/notifications')}
                  >
                    <td className="py-4 px-6 text-gray-800">{notification.message}</td>
                    <td className="py-4 px-6 text-gray-600">{notification.timestamp}</td>
                    <td className="py-4 px-6 text-gray-700">{notification.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leads and Deals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Leads */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Today's Leads</h3>
            <button
              onClick={() => navigate('/leads')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-4 hover:underline transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.User className="w-5 h-5 mr-2" /> Name</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Mail className="w-5 h-5 mr-2" /> Email</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Phone className="w-5 h-5 mr-2" /> Phone</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Building2 className="w-5 h-5 mr-2" /> Company</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Jason Roy",
                    email: "jason.roy@alpha.com",
                    phone: "+91 99999 88888",
                    company: "Alpha Tech",
                  },
                  {
                    name: "Priya Singh",
                    email: "priya.singh@neutron.com",
                    phone: "+91 98765 43210",
                    company: "Neutron Corp",
                  },
                ].map((lead, index) => (
                  <tr
                    key={index}
                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => navigate('/leads')}
                  >
                    <td className="py-4 px-6 text-gray-800">{lead.name}</td>
                    <td className="py-4 px-6 text-gray-600">{lead.email}</td>
                    <td className="py-4 px-6 text-gray-600">{lead.phone}</td>
                    <td className="py-4 px-6 text-gray-700">{lead.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deals Closing This Month */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Deals Closing This Month</h3>
            <button
              onClick={() => navigate('/deals')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-4 hover:underline transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Target className="w-5 h-5 mr-2" /> Deal Name</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Building className="w-5 h-5 mr-2" /> Account</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Info className="w-5 h-5 mr-2" /> Stage</span></th>
                  <th className="pb-4 px-6"><span className="flex items-center"><Icons.Calendar className="w-5 h-5 mr-2" /> Expected Close Date</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Website Revamp",
                    account: "Neo Systems",
                    stage: "Negotiation",
                    closeDate: "25/06/2025",
                  },
                  {
                    name: "CRM Onboarding",
                    account: "Triton Tech",
                    stage: "Proposal",
                    closeDate: "29/06/2025",
                  },
                ].map((deal, index) => (
                  <tr
                    key={index}
                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => navigate('/deals')}
                  >
                    <td className="py-4 px-6 text-gray-800">{deal.name}</td>
                    <td className="py-4 px-6 text-gray-700">{deal.account}</td>
                    <td className="py-4 px-6"><StatusBadge status={deal.stage} /></td>
                    <td className="py-4 px-6 text-gray-600">{deal.closeDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;