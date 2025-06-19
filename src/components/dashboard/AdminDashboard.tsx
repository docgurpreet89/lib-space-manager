import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { AllUsersPage } from '@/components/admin/AllUsersPage';
import { AllTransactionsPage } from '@/components/admin/AllTransactionsPage';
import { NoticeManagement } from '@/components/admin/NoticeManagement';
import { SoonExpiringMemberships } from '@/components/admin/SoonExpiringMemberships';
import { Button } from '@/components/ui/button';
import { Menu, X, Calendar, Users, FileText, Bell, Clock, LayoutDashboard } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('pendingBookings');

  const navItems = [
    { key: 'pendingBookings', label: 'Pending Bookings', icon: <Calendar size={18} />, badge: 3 },
    { key: 'seatChanges', label: 'Seat Change Requests', icon: <Users size={18} />, badge: 1 },
    { key: 'users', label: 'All Users', icon: <Users size={18} /> },
    { key: 'transactions', label: 'All Transactions', icon: <FileText size={18} /> },
    { key: 'notices', label: 'Notice Management', icon: <Bell size={18} /> },
    { key: 'expiring', label: 'Expiring Memberships', icon: <Clock size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pendingBookings':
        return <PendingBookings />;
      case 'seatChanges':
        return <SeatChangeRequests />;
      case 'users':
        return <AllUsersPage />;
      case 'transactions':
        return <AllTransactionsPage />;
      case 'notices':
        return <NoticeManagement />;
      case 'expiring':
        return <SoonExpiringMemberships />;
      default:
        return <PendingBookings />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r shadow-md z-50 transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002e6e] flex items-center gap-2">
            <LayoutDashboard size={20} /> Admin
          </h2>
          <Button 
            onClick={() => setShowSidebar(false)} 
            className="lg:hidden p-2"
            variant="ghost"
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="p-2">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setShowSidebar(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === item.key 
                  ? 'bg-[#00B9F1] text-white' 
                  : 'text-[#555] hover:bg-[#e6f7ff] hover:text-[#00B9F1]'
                }`}
              title={item.label}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:ml-64">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#002e6e]">Admin Dashboard</h1>
          <Button 
            onClick={() => setShowSidebar(true)} 
            className="lg:hidden paytm-button-secondary"
          >
            <Menu size={20} />
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
