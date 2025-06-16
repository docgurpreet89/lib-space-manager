
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, SeatBooking } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BookingHistoryProps {
  user: User;
}

export const BookingHistory = ({ user }: BookingHistoryProps) => {
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [user.id]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_bookings')
        .select(`
          *,
          seats (seat_label)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load booking history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bookings</CardTitle>
        <CardDescription>
          View your current and past seat bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bookings found. Book your first seat to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Seat {(booking as any).seats?.seat_label || booking.seat_id}
                    </h3>
                    <p className="text-gray-600">
                      {formatDateTime(booking.from_time)} - {formatDateTime(booking.to_time)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Name:</span> {booking.user_name}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {booking.user_phone}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Booked on: {formatDateTime(booking.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
