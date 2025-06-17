
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SeatLayout } from '@/components/seats/SeatLayout';
import { BookingHistory } from '@/components/bookings/BookingHistory';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, MapPin, User as UserIcon } from 'lucide-react';

interface UserDashboardProps {
  user: User;
}

export const UserDashboard = ({ user }: UserDashboardProps) => {
  const [totalSeats, setTotalSeats] = useState(0);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [onHoldSeats, setOnHoldSeats] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: seats } = await supabase.from('seats').select('*');
      const { data: bookings } = await supabase
        .from('seat_bookings')
        .select('*')
        .eq('status', 'approved')
        .gte('to_time', new Date().toISOString());
      const { data: holds } = await supabase
        .from('seat_holds')
        .select('*')
        .gte('lock_expiry', new Date().toISOString());

      const total = seats?.length || 0;
      const approved = bookings?.length || 0;
      const held = holds?.length || 0;

      setTotalSeats(total);
      setOnHoldSeats(held);
      setAvailableSeats(total - approved - held);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] p-4 space-y-6">
      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Current Status Card */}
        <Card className="app-card border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[#CCCCCC] text-sm mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                <span className="status-active">Active</span>
              </div>
              <p className="text-[#CCCCCC] text-xs mt-2">Your membership is active</p>
            </div>
            <UserIcon className="w-8 h-8 text-[#00FFFF]" />
          </CardContent>
        </Card>

        {/* Allocated Seat Card */}
        <Card className="app-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#CCCCCC] text-sm mb-2">Allocated Seat</p>
                <div className="seat-label">F2</div>
              </div>
              <MapPin className="w-8 h-8 text-[#00FFFF]" />
            </div>
            <Button className="cred-button-secondary w-full h-10 text-sm">
              Change Seat
            </Button>
          </CardContent>
        </Card>

        {/* Days Remaining Card */}
        <Card className="app-card border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[#CCCCCC] text-sm mb-1">Days Remaining</p>
              <p className="text-2xl font-bold text-white">25 Days Left</p>
            </div>
            <Calendar className="w-8 h-8 text-[#00FFFF]" />
          </CardContent>
        </Card>

        {/* Last Payment Card */}
        <Card className="app-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#CCCCCC] text-sm mb-1">Last Payment</p>
                <p className="text-xl font-semibold text-white">₹4000</p>
                <p className="text-[#CCCCCC] text-xs">on 01-June-2025</p>
              </div>
              <CreditCard className="w-8 h-8 text-[#00FFFF]" />
            </div>
            <Button className="cred-button-secondary w-full h-10 text-sm">
              Show All Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Booking Details Card */}
        <Card className="app-card border-0">
          <CardContent className="p-6">
            <p className="text-[#CCCCCC] text-sm mb-2">My Booking Details</p>
            <p className="text-white font-medium mb-1">Seat F2</p>
            <p className="text-[#CCCCCC] text-sm mb-4">Booked till 30-June-2025</p>
            <Button className="cred-button-secondary w-full h-10 text-sm">
              Show All Bookings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="seats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1C1C1E] border border-[#333] rounded-xl">
          <TabsTrigger 
            value="seats" 
            className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black text-[#CCCCCC] font-medium rounded-lg"
          >
            Book Seat
          </TabsTrigger>
          <TabsTrigger 
            value="bookings" 
            className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black text-[#CCCCCC] font-medium rounded-lg"
          >
            My Bookings
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black text-[#CCCCCC] font-medium rounded-lg"
          >
            Transactions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="seats" className="mt-6">
          <SeatLayout user={user} />
        </TabsContent>
        
        <TabsContent value="bookings" className="mt-6">
          <BookingHistory user={user} />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionHistory user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
