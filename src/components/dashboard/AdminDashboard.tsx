import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { LibrarySettings } from '@/components/admin/LibrarySettings';
import { AllUsersPage } from '@/components/admin/AllUsersPage';
import { AllTransactionsPage } from '@/components/admin/AllTransactionsPage';
import { NoticeManagement } from '@/components/admin/NoticeManagement';
import { SoonExpiringMemberships } from '@/components/admin/SoonExpiringMemberships';
import { Button } from '@/components/ui/button';
import { Menu, X, Users, Settings, Calendar, Bell, CreditCard, Clock } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activePage, setActivePage] = useState('pendingBookings');

  const menuItems = [
    { key: 'pendingBookings', label: 'Pending Bookings', icon: <Calendar size={18} /> },
    { key: 'seatChanges', label: 'Seat Changes', icon: <Clock size={18} /> },
    { key: 'transactions', label: 'Transactions', icon: <CreditCard size={18} /> },
    { key: 'users', label: 'All Users', icon: <Users size={18} /> },
    { key: 'soonExpiring', label: 'Soon Expiring Memberships', icon: <Clock size={18} /> },
    { key: 'notices', label: 'Manage Notices', icon: <Bell size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex relative">
      {/* Sidebar */}
      <div
        className={`fixed lg:static top-0 left-0 h-full bg-[#00B9F1] text-white w-64 transform ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-300">
          <h2 className="text-lg font-bold">Admin Dashboard</h2>
          <Button
            variant="ghost"
            className="lg:hidden text-white"
            onClick={() => setShowSidebar(false)}
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActivePage(item.key);
                setShowSidebar(false);
              }}
              className={`w-full flex items-center gap-2 p-3 rounded-md text-left ${
                activePage === item.key
                  ? 'bg-white text-[#00B9F1] font-bold'
                  : 'hover:bg-blue-100 text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 lg:ml-64">
        <div className="flex justify-between items-center mb-4 lg:hidden">
          <Button
            className="paytm-button-secondary p-2"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={20} />
          </Button>
          <span className="text-[#00B9F1] font-bold">Admin Dashboard</span>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          {activePage === 'pendingBookings' && <PendingBookings />}
          {activePage === 'seatChanges' && <SeatChangeRequests />}
          {activePage === 'transactions' && <AllTransactionsPage />}
          {activePage === 'users' && <AllUsersPage />}
          {activePage === 'soonExpiring' && <SoonExpiringMemberships />}
          {activePage === 'notices' && <NoticeManagement />}
          {activePage === 'settings' && <LibrarySettings />}
        </div>
      </div>
    </div>
  );
};
