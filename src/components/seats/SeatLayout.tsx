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

  const getLeftSectionSeats = () => {
    const leftSeats = ['A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4', 'E1', 'E2', 'E3', 'E4', 'F1', 'F2', 'F3', 'F4'];
    return seats.filter(seat => leftSeats.includes(seat.seat_label));
  };

  const getRightSectionSeats = () => {
    const rightSeats = ['A5', 'A6', 'A7', 'B5', 'B6', 'B7', 'C5', 'C6', 'C7', 'D5', 'D6', 'D7', 'E5', 'E6', 'E7', 'F5', 'F6', 'F7', 'G5', 'G6', 'G7', 'H5', 'H6', 'H7', 'I5', 'I6', 'I7', 'J5', 'J6', 'J7'];
    return seats.filter(seat => rightSeats.includes(seat.seat_label));
  };

  const renderSeat = (seat: Seat) => {
    const status = getSeatStatus(seat.seat_id);
    return (
      <div
        key={seat.seat_id}
        onClick={() => status === 'available' && setSelectedSeat(seat)}
        className={`w-10 h-10 m-2 rounded flex items-center justify-center cursor-pointer font-bold text-xs transition-all duration-200 ${
          status === 'available' 
            ? 'bg-gray-300 hover:bg-green-500 hover:text-white hover:scale-105' 
            : status === 'held'
            ? 'bg-yellow-500 text-white cursor-not-allowed'
            : 'bg-red-500 text-white cursor-not-allowed'
        }`}
      >
        {seat.seat_label}
      </div>
    );
  };

  const renderLeftSection = () => {
    const leftSeats = getLeftSectionSeats();
    const rows = [
      ['A1', 'A2'],
      ['B1', 'B2', 'B3', 'B4'],
      ['C1', 'C2', 'C3', 'C4'],
      ['D1', 'D2', 'D3', 'D4'],
      ['E1', 'E2', 'E3', 'E4'],
      ['F1', 'F2', 'F3', 'F4']
    ];

    return (
      <div className="flex flex-col">
        {rows.map((rowLabels, index) => (
          <div key={index} className="flex justify-end">
            {rowLabels.map(label => {
              const seat = leftSeats.find(s => s.seat_label === label);
              return seat ? renderSeat(seat) : null;
            })}
          </div>
        ))}
        
        {/* Stairs and Washroom */}
        <div className="flex mt-4">
          <div className="w-1/2 h-32 bg-gray-200 m-2 flex items-center justify-center border border-gray-400 font-bold text-sm bg-gradient-to-t from-gray-300 to-gray-100">
            Stairs
          </div>
          <div className="w-1/2 h-32 bg-gray-200 m-2 flex items-center justify-center border border-gray-400 font-bold text-sm">
            Washroom
          </div>
        </div>
      </div>
    );
  };

  const renderRightSection = () => {
    const rightSeats = getRightSectionSeats();
    const rows = [
      ['A5', 'A6', 'A7'],
      ['B5', 'B6', 'B7'],
      ['C5', 'C6', 'C7'],
      ['D5', 'D6', 'D7'],
      ['E5', 'E6', 'E7'],
      ['F5', 'F6', 'F7'],
      ['G5', 'G6', 'G7'],
      ['H5', 'H6', 'H7'],
      ['I5', 'I6', 'I7'],
      ['J5', 'J6', 'J7']
    ];

    return (
      <div className="flex flex-col">
        {rows.map((rowLabels, index) => (
          <div key={index} className="flex">
            {rowLabels.map(label => {
              const seat = rightSeats.find(s => s.seat_label === label);
              return seat ? renderSeat(seat) : null;
            })}
          </div>
        ))}
      </div>
    );
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
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
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
          <div className="flex justify-center items-stretch">
            {/* Left Section */}
            <div className="flex-shrink-0">
              {renderLeftSection()}
            </div>

            {/* Aisle */}
            <div className="relative w-16 mx-4 bg-gray-50 flex items-center justify-center">
              <div className="absolute top-0 bottom-0 left-2 w-0.5 bg-gray-400"></div>
              <div className="absolute top-0 bottom-0 right-2 w-0.5 bg-gray-400"></div>
              <div className="transform rotate-90 font-bold text-gray-600 text-sm whitespace-nowrap">
                AISLE
              </div>
            </div>

            {/* Right Section */}
            <div className="flex-shrink-0">
              {renderRightSection()}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden block mt-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Left Section</h3>
                {renderLeftSection()}
              </div>
              <div>
                <h3 className="font-semibold mb-3">Right Section</h3>
                {renderRightSection()}
              </div>
            </div>
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
