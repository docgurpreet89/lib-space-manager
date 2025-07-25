import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Menu, X, Users, Settings, Calendar, ClipboardList, Repeat,
  FileText, Bell, Fingerprint, IdCard, ChevronLeft, ChevronRight
} from 'lucide-react';

// Dummy components for tabbed content
const PendingBookings = () => (
  <Card className="p-4"><CardContent>Pending Bookings Table Here</CardContent></Card>
);
const SeatChangeRequests = () => (
  <Card className="p-4"><CardContent>Seat Change Requests Table Here</CardContent></Card>
);
const LibrarySettings = () => (
  <Card className="p-4"><CardContent>Library Settings Here</CardContent></Card>
);

const navItems = [
  { label: 'Pending Bookings', icon: ClipboardList, hash: '#bookings' },
  { label: 'Seat Change Requests', icon: Repeat, hash: '#changes' },
  { label: 'All Users', icon: Users, hash: '#users' },
  { label: 'All Transactions', icon: FileText, hash: '#transactions' },
  { label: 'Notice Management', icon: Bell, hash: '#notices' },
  { label: 'Expiring Memberships', icon: Calendar, hash: '#expiring' },
  { label: 'Biometric Enrollments', icon: IdCard, hash: '#biometric' }
];

export const AdminDashboard = () => {
  const [showSidebar, setShowSidebar] = useState(false); // For mobile
  const [collapsed, setCollapsed] = useState(false);     // For desktop

  const [stats] = useState({
    pending: 10,
    seatChanges: 3,
    expiring: 5,
    totalSeats: 50,
    booked: 25,
    held: 7,
    available: 18,
    biometric: 14
  });

  return (
    <div className="min-h-screen h-screen flex bg-white">
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-40
          bg-blue-900 text-white border-r border-[#E0E0E0]
          transition-all duration-300 ease-in-out
          flex flex-col
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-20' : 'w-80'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-[#253356] flex items-center justify-between bg-blue-900">
          {!collapsed &&
            <h2 className="text-xl font-semibold whitespace-nowrap">Admin Panel</h2>
          }
          <div className="flex gap-2">
            <Button
              onClick={() => setCollapsed(c => !c)}
              className="hidden lg:flex p-2 hover:bg-blue-700 rounded-lg"
              variant="ghost"
              tabIndex={-1}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </Button>
            <Button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-2 hover:bg-blue-700 rounded-lg"
              variant="ghost"
            >
              <X size={20} className="text-white" />
            </Button>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-0 flex flex-col">
          {navItems.map(item => (
            <a
              key={item.label}
              href={item.hash}
              className={`
                flex items-center gap-3 p-4 border-b border-blue-800 hover:bg-blue-800 transition
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && item.label}
            </a>
          ))}
          <div className="flex-1" />
        </nav>
      </div>

      {/* Main Content */}
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-80'} flex-1 p-6 transition-all duration-300`}>
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
            <Card className="bg-pink-100 p-4">
              <CardContent>
                <div>Pending Bookings</div>
                <div className="text-xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-100 p-4">
              <CardContent>
                <div>Seat Changes</div>
                <div className="text-xl font-bold">{stats.seatChanges}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-100 p-4">
              <CardContent>
                <div>Expiring Memberships</div>
                <div className="text-xl font-bold">{stats.expiring}</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-100 p-4">
              <CardContent>
                <div>Total Seats</div>
                <div className="text-xl font-bold">{stats.totalSeats}</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-100 p-4">
              <CardContent>
                <div>Booked</div>
                <div className="text-xl font-bold">{stats.booked}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-100 p-4">
              <CardContent>
                <div>On Hold</div>
                <div className="text-xl font-bold">{stats.held}</div>
              </CardContent>
            </Card>
            <Card className="bg-teal-100 p-4">
              <CardContent>
                <div>Available</div>
                <div className="text-xl font-bold">{stats.available}</div>
              </CardContent>
            </Card>
            <Card className="bg-indigo-100 p-4">
              <CardContent>
                <div className="flex items-center">
                  <Fingerprint className="w-4 h-4 mr-1" /> Biometric Issued
                </div>
                <div className="text-xl font-bold">{stats.biometric}</div>
              </CardContent>
            </Card>
          </div>

          {/* Example Tabs for some sections */}
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl">
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-lg"
              >
                Pending Bookings Fresh
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
