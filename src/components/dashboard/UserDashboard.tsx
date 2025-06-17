
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SeatLayout } from '@/components/seats/SeatLayout';
import { BookingHistory } from '@/components/bookings/BookingHistory';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-6">
      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Status Card */}
        <Card className="status-card status-active">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 font-semibold text-sm">ACTIVE</p>
                <p className="text-gray-300 text-xs mt-1">Your membership is active</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Days Remaining Card */}
        <Card className="status-card status-seat">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-blue-400 font-semibold text-lg">25</p>
              <p className="text-gray-300 text-xs">Days Left</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocated Seat Card */}
      <Card className="status-card status-seat">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-semibold">Seat F2</p>
              <p className="text-gray-300 text-xs mt-1">Your allocated seat</p>
            </div>
            <Button 
              size="sm" 
              className="glow-button text-xs px-3 py-1"
            >
              Change Seat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Payment Card */}
      <Card className="status-card status-payment">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 font-semibold">₹4,000</p>
              <p className="text-gray-300 text-xs mt-1">Last payment • 01-June-2025</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-400 hover:text-purple-300 text-xs"
            >
              Show All Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Booking Details Card */}
      <Card className="status-card">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <p className="text-white font-semibold">My Booking Details</p>
              <p className="text-primary text-sm mt-1">Seat F2 - Booked till 30-June-2025</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-primary hover:text-primary/80 border border-primary/20 hover:bg-primary/10"
            >
              Show All Bookings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="text-blue-400 text-xs mb-1">Total Seats</div>
            <div className="text-2xl font-bold text-white">{totalSeats}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-400/20">
          <CardContent className="p-3 text-center">
            <div className="text-green-400 text-xs mb-1">Available</div>
            <div className="text-2xl font-bold text-white">{availableSeats}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-yellow-400/20">
          <CardContent className="p-3 text-center">
            <div className="text-yellow-400 text-xs mb-1">On Hold</div>
            <div className="text-2xl font-bold text-white">{onHoldSeats}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="seats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card">
          <TabsTrigger value="seats" className="data-[state=active]:glow-button data-[state=active]:text-white">
            Seat Layout
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:glow-button data-[state=active]:text-white">
            My Bookings
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:glow-button data-[state=active]:text-white">
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
