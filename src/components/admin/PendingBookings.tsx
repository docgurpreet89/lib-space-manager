
import { useState, useEffect } from 'react';
import { supabase, SeatBooking } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const PendingBookings = () => {
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_bookings')
        .select(`
          *,
          seats (seat_label)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load pending bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .rpc('confirm_booking', { p_booking_id: bookingId });

      if (error) throw error;

      toast({
        title: "Booking Approved",
        description: "The booking has been successfully approved.",
      });

      fetchPendingBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .rpc('cancel_booking', { p_booking_id: bookingId });

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled.",
      });

      fetchPendingBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Bookings</CardTitle>
        <CardDescription>
          Review and approve or cancel pending seat bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending bookings to review.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Seat {(booking as any).seats?.seat_label || booking.seat_id}
                    </h3>
                    <p className="text-gray-600">
                      {formatDateTime(booking.from_time)} - {formatDateTime(booking.to_time)}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Name:</span> {booking.user_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {booking.user_email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {booking.user_phone}
                  </div>
                  <div>
                    <span className="font-medium">Requested:</span> {formatDateTime(booking.created_at)}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApprove(booking.booking_id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleCancel(booking.booking_id)}
                    variant="destructive"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
