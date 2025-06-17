
import { User } from '@supabase/supabase-js';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { LibrarySettings } from '@/components/admin/LibrarySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Manage bookings, seat changes, and library settings
        </p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-purple-50">
          <TabsTrigger value="bookings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Pending Bookings
          </TabsTrigger>
          <TabsTrigger value="changes" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Seat Changes
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
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
  );
};
