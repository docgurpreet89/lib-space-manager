import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { SeatBookingModal } from '@/components/seats/SeatBookingModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Seat = Database['public']['Tables']['seats']['Row'];
type SeatBooking = Database['public']['Tables']['seat_bookings']['Row'];
type SeatHold = Database['public']['Tables']['seat_holds']['Row'];

interface SeatLayoutProps {
  user: User;
}

export const SeatLayout = ({ user }: SeatLayoutProps) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookings, setBookings] = useState<SeatBooking[]>([]);
  const [holds, setHolds] = useState<SeatHold[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const runCleanupAndFetch = async () => {
      try {
        // Run cleanup on expired holds + bookings
        await supabase.rpc('cleanup_expired_holds_and_bookings');

        // Load clean data
        await fetchSeats();
        await fetchBookings();
        await fetchHolds();
      } catch (error) {
        console.error('Error during cleanup or fetch:', error);
      }
    };

    runCleanupAndFetch();

    // Real-time updates
    const bookingsSubscription = supabase
      .channel('seat_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    const holdsSubscription = supabase
      .channel('seat_holds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_holds' }, () => {
        fetchHolds();
      })
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      holdsSubscription.unsubscribe();
    };
  }, []);

  const fetchSeats = async () => {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .order('seat_label');

      if (error) throw error;
      setSeats(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load seats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_bookings')
        .select('*')
        .eq('status', 'approved')
        .gte('to_time', new Date().toISOString());

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchHolds = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_holds')
        .select('*')
        .gte('lock_expiry', new Date().toISOString());

      if (error) throw error;
      setHolds(data || []);
    } catch (error: any) {
      console.error('Error fetching holds:', error);
    }
  };

  const getSeatStatus = (seatId: string) => {
    const hasBooking = bookings.some(booking => booking.seat_id === seatId);
    const hasHold = holds.some(hold => hold.seat_id === seatId);

    if (hasBooking) return 'booked';
    if (hasHold) return 'held';
    return 'available';
  };

  const getSeatStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-red-500 hover:bg-red-600 text-white cursor-not-allowed';
      case 'held':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white cursor-not-allowed';
      default:
        return 'bg-green-500 hover:bg-green-600 text-white cursor-pointer transform hover:scale-105 transition-all duration-200';
    }
  };

  const getSeatStatusText = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'held':
        return 'On Hold';
      default:
        return 'Available';
    }
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Library Seat Layout
            <div className="flex space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>On Hold</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Booked</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {seats.map((seat) => {
              const status = getSeatStatus(seat.seat_id);
              return (
                <Button
                  key={seat.seat_id}
                  onClick={() => status === 'available' && setSelectedSeat(seat)}
                  disabled={status !== 'available'}
                  className={`h-16 flex flex-col items-center justify-center ${getSeatStatusColor(status)}`}
                >
                  <span className="font-bold">{seat.seat_label}</span>
                  <span className="text-xs">{getSeatStatusText(status)}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedSeat && (
        <SeatBookingModal
          seat={selectedSeat}
          user={user}
          isOpen={!!selectedSeat}
          onClose={() => setSelectedSeat(null)}
          onBookingSuccess={() => {
            setSelectedSeat(null);
            fetchHolds();
            toast({
              title: "Booking Submitted",
              description: "Your booking request has been submitted for approval.",
            });
          }}
        />
      )}
    </div>
  );
};
