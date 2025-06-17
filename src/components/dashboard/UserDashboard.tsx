
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SeatLayout } from '@/components/seats/SeatLayout';
import { BookingHistory } from '@/components/bookings/BookingHistory';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Find Your Perfect Study Spot
        </h2>
        <p className="text-gray-600">
          Choose from available seats and book your ideal workspace
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-6 text-center">
          <div className="text-gray-600 text-sm">Total Seats</div>
          <div className="text-3xl font-bold text-blue-600">
            {totalSeats}
          </div>
        </div>

        <div className="bg-white shadow rounded p-6 text-center">
          <div className="text-gray-600 text-sm">Available Seats</div>
          <div className="text-3xl font-bold text-green-600">
            {availableSeats}
          </div>
        </div>

        <div className="bg-white shadow rounded p-6 text-center">
          <div className="text-gray-600 text-sm">On Hold Seats</div>
          <div className="text-3xl font-bold text-yellow-600">
            {onHoldSeats}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="seats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-blue-50">
          <TabsTrigger value="seats" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Seat Layout
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            My Bookings
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
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
