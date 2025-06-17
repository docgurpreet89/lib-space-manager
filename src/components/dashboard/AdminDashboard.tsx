
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { LibrarySettings } from '@/components/admin/LibrarySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Menu, X, Users, Settings, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] relative">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 app-card border-r border-[#333] z-50 transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-6 border-b border-[#333] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          <Button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-[#333] rounded-lg"
            variant="ghost"
          >
            <X size={20} className="text-[#CCCCCC]" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          <a href="#bookings" className="flex items-center gap-3 p-3 rounded-lg text-[#CCCCCC] hover:bg-[#333] hover:text-white transition-colors">
            <Calendar size={20} />
            Pending Bookings
          </a>
          <a href="#changes" className="flex items-center gap-3 p-3 rounded-lg text-[#CCCCCC] hover:bg-[#333] hover:text-white transition-colors">
            <Users size={20} />
            Seat Changes
          </a>
          <a href="#settings" className="flex items-center gap-3 p-3 rounded-lg text-[#CCCCCC] hover:bg-[#333] hover:text-white transition-colors">
            <Settings size={20} />
            Settings
          </a>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="lg:ml-80 p-4">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <Button
            onClick={() => setShowSidebar(true)}
            className="cred-button-secondary p-3"
          >
            <Menu size={20} />
          </Button>
        </div>
        
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h2>
            <p className="text-[#CCCCCC]">
              Manage bookings, seat changes, and library settings
            </p>
          </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#1C1C1E] border border-[#333] rounded-xl">
              <TabsTrigger 
                value="bookings" 
                className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black text-[#CCCCCC] font-medium rounded-lg"
              >
                Pending Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="changes" 
                className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black text-[#CCCCCC] font-medium rounded-lg"
              >
                Seat Changes
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black text-[#CCCCCC] font-medium rounded-lg"
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
