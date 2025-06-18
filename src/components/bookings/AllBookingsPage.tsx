
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Calendar, User as UserIcon, Phone } from 'lucide-react';

type SeatBooking = Database['public']['Tables']['seat_bookings']['Row'];

interface BookingWithSeat extends SeatBooking {
  seats?: { seat_label: string };
}

interface AllBookingsPageProps {
  user: User;
  onBack: () => void;
}

export const AllBookingsPage = ({ user, onBack }: AllBookingsPageProps) => {
  const [bookings, setBookings] = useState<BookingWithSeat[]>([]);
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
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved by Admin';
      case 'pending':
        return 'Awaiting Admin Approval';
      case 'cancelled':
        return 'Cancelled (Timeout or Admin)';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const calculateDuration = (fromTime: string, toTime: string) => {
    const from = new Date(fromTime);
    const to = new Date(toTime);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">All Bookings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complete Booking History</CardTitle>
          <CardDescription>
            Detailed view of all your seat bookings with full information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bookings found. Book your first seat to get started!
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                        <MapPin className="w-5 h-5 inline mr-2" />
                        Seat {booking.seats?.seat_label || booking.seat_id}
                      </div>
                      <Badge className={`${getStatusColor(booking.status)} font-medium px-3 py-1`}>
                        {getStatusDescription(booking.status)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Booking ID</div>
                      <div className="text-xs font-mono text-gray-500">
                        {booking.booking_id}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">Member Details:</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <div className="font-bold text-lg text-gray-900">{booking.user_name}</div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="font-semibold">{booking.user_phone}</span>
                        </div>
                        <div className="text-sm text-gray-600">{booking.user_email}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">Booking Period:</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div>
                          <div className="text-sm text-gray-600">From:</div>
                          <div className="font-medium">{formatDateTime(booking.from_time)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">To:</div>
                          <div className="font-medium">{formatDateTime(booking.to_time)}</div>
                        </div>
                        <div className="bg-blue-100 rounded-md p-2 mt-2">
                          <span className="text-sm font-semibold text-blue-800">
                            Membership Duration: {booking.membership_duration_days || calculateDuration(booking.from_time, booking.to_time)} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-600">
                        <span className="font-medium">Booked on:</span> {formatDateTime(booking.created_at)}
                      </div>
                      {booking.price && (
                        <div className="font-bold text-green-600 text-lg">
                          ₹{booking.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
