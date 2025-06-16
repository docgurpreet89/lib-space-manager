
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SeatLayout } from '@/components/seats/SeatLayout';
import { BookingHistory } from '@/components/bookings/BookingHistory';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserDashboardProps {
  user: User;
}

export const UserDashboard = ({ user }: UserDashboardProps) => {
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
