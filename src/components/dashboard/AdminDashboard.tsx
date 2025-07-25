import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { LibrarySettings } from '@/components/admin/LibrarySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Menu, X, Users, Settings, Calendar, ClipboardList, Repeat,
  FileText, Bell, Fingerprint, IdCard
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [showSidebar, setShowSidebar] = useState(false);

  // You can later add router logic for navigation if needed

  return (
    <div className="min-h-screen h-screen flex bg-white">
      {/* Sidebar */}
      <div
        className={`
          flex flex-col
          fixed top-0 left-0 right-10
          h-screen w-80
          border-r border-[#E0E0E0]
          z-50
          bg-blue-900 text-white
          transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#253356] flex items-center justify-between bg-blue-900">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <Button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-blue-700 rounded-lg"
            variant="ghost"
          >
            <X size={20} className="text-white" />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-0 flex flex-col">
          <a href="#bookings" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <ClipboardList size={20} />
            Pending Bookings
          </a>
          <a href="#changes" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <Repeat size={20} />
            Seat Change Requests
          </a>
          <a href="#users" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <Users size={20} />
            All Users
          </a>
          <a href="#transactions" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <FileText size={20} />
            All Transactions
          </a>
          <a href="#notices" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <Bell size={20} />
            Notice Management
          </a>
          <a href="#expiring" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <Calendar size={20} />
            Expiring Memberships
          </a>
          <a href="#biometric" className="flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition">
            <IdCard size={20} />
            Biometric Enrollments
          </a>
          {/* Spacer fills the rest, makes menu touch bottom */}
          <div className="flex-1" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-80 p-6">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <Button
            onClick={() => setShowSidebar(true)}
            className="paytm-button-secondary p-3"
          >
            <Menu size={20} />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#333333] mb-2">
              Admin Dashboard
            </h2>
            <p className="text-[#666666]">
              Manage bookings, seat changes, and library settings
            </p>
          </div>

          {/* Example Tabs for some sections */}
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl">
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-lg"
              >
                Pending Bookings
              </TabsTrigger>
              <TabsTrigger
                value="changes"
                className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-lg"
              >
                Seat Changes
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-lg"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-6">
              <PendingBookings />
            </TabsContent>
            <TabsContent value="changes" className="mt-6">
              <SeatChangeRequests />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <LibrarySettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
