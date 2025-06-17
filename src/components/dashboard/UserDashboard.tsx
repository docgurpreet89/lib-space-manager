import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SeatLayout } from '@/components/seats/SeatLayout';
import { BookingHistory } from '@/components/bookings/BookingHistory';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Calendar, MapPin, Users, CheckCircle, Clock, Chair } from 'lucide-react';
import { Calendar, MapPin, Users, CheckCircle, Sofa, Timer, Hourglass, Armchair } from 'lucide-react';
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
    <div className="min-h-screen bg-[#E6F4FF] p-4 space-y-4">
      <Card className="app-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-[#333333] text-lg font-semibold">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-button">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Total Seats</div>
              <div className="text-xl font-bold">{totalSeats}</div>
            </div>
            <div className="stat-button">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Available</div>
              <div className="text-xl font-bold">{availableSeats}</div>
            </div>
            <div className="stat-button">
              <Hourglass className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">On Hold</div>
              <div className="text-xl font-bold">{onHoldSeats}</div>
            </div>
            <div className="stat-button">
              <Armchair className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Booked</div>
              <div className="text-xl font-bold">{totalSeats - availableSeats - onHoldSeats}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="app-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0]">
              <div>
                <p className="text-[#666666] text-sm mb-1">Current Status</p>
                <span className="status-active">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0]">
              <div>
                <p className="text-[#666666] text-sm mb-2">Allocated Seat</p>
                <div className="bg-[#00B9F1] text-white px-4 py-2 rounded-lg font-semibold">F2</div>
              </div>
              <Button className="paytm-button-secondary h-10 text-sm">Change Seat</Button>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0]">
              <div>
                <p className="text-[#666666] text-sm mb-1">Days Remaining</p>
                <p className="text-xl font-bold text-[#333333]">25 Days Left</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0]">
              <div>
                <p className="text-[#666666] text-sm mb-1">Last Payment</p>
                <p className="text-lg font-semibold text-[#333333]">₹4000</p>
                <p className="text-[#666666] text-xs">on 01-June-2025</p>
              </div>
              <Button className="paytm-button-secondary h-10 text-sm">All Transactions</Button>
            </div>
            <div>
              <p className="text-[#666666] text-sm mb-2">My Booking Details</p>
              <p className="text-[#333333] font-medium mb-1">Seat F2</p>
              <p className="text-[#666666] text-sm mb-4">Booked till 30-June-2025</p>
              <Button className="paytm-button-secondary w-full h-10 text-sm">Show All Bookings</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="seats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg">
          <TabsTrigger 
            value="seats" 
            className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-md"
          >
            Book Seat
          </TabsTrigger>
          <TabsTrigger 
            value="bookings" 
            className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-md"
          >
            My Bookings
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white text-[#666666] font-medium rounded-md"
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
