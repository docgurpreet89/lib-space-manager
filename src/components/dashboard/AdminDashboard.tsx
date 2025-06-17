
import { User } from '@supabase/supabase-js';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { LibrarySettings } from '@/components/admin/LibrarySettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-400">
          Manage bookings, seat changes, and library settings
        </p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-purple-400 text-sm mb-1">Pending Bookings</div>
            <div className="text-2xl font-bold text-white">12</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-blue-400 text-sm mb-1">Active Users</div>
            <div className="text-2xl font-bold text-white">89</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-green-400 text-sm mb-1">Revenue</div>
            <div className="text-lg font-bold text-white">₹2.4L</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card">
          <TabsTrigger value="bookings" className="data-[state=active]:glow-button data-[state=active]:text-white">
            Pending Bookings
          </TabsTrigger>
          <TabsTrigger value="changes" className="data-[state=active]:glow-button data-[state=active]:text-white">
            Seat Changes
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:glow-button data-[state=active]:text-white">
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
