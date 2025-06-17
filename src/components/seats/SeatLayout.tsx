import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { SeatBookingModal } from '@/components/seats/SeatBookingModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Footprints , Toilet } from 'lucide-react';

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
        await supabase.rpc('cleanup_expired_holds_and_bookings');
        await fetchSeats();
        await fetchBookings();
        await fetchHolds();
      } catch (error) {
        console.error('Error during cleanup or fetch:', error);
      }
    };

    runCleanupAndFetch();

    const bookingsSubscription = supabase
      .channel('seat_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_bookings' }, fetchBookings)
      .subscribe();

    const holdsSubscription = supabase
      .channel('seat_holds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_holds' }, fetchHolds)
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      holdsSubscription.unsubscribe();
    };
  }, []);

  const fetchSeats = async () => {
    const { data, error } = await supabase.from('seats').select('*').order('seat_label');
    if (!error) setSeats(data || []);
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('seat_bookings')
      .select('*')
      .eq('status', 'approved')
      .gte('to_time', new Date().toISOString());
    setBookings(data || []);
  };

  const fetchHolds = async () => {
    const { data } = await supabase
      .from('seat_holds')
      .select('*')
      .gte('lock_expiry', new Date().toISOString());
    setHolds(data || []);
  };

  const getSeatStatus = (seatId: string) => {
    if (bookings.some(b => b.seat_id === seatId)) return 'booked';
    if (holds.some(h => h.seat_id === seatId)) return 'held';
    return 'available';
  };

  const renderSeat = (seat: Seat) => {
    const status = getSeatStatus(seat.seat_id);
    let classes = 'w-10 h-10 m-1 rounded flex items-center justify-center font-bold text-xs';

    if (status === 'available') {
      classes += ' bg-green-500 text-white cursor-pointer hover:bg-green-600';
    } else if (status === 'held') {
      classes += ' bg-yellow-500 text-white cursor-not-allowed';
    } else {
      classes += ' bg-red-500 text-white cursor-not-allowed';
    }

    return (
      <div
        key={seat.seat_id}
        onClick={() => status === 'available' && setSelectedSeat(seat)}
        className={classes}
      >
        {seat.seat_label}
      </div>
    );
  };

  const sectionLayout = (
    leftRows: string[][],
    rightRows: string[][],
    leftSeats: Seat[],
    rightSeats: Seat[]
  ) => (
    <div className="flex justify-center gap-4 flex-wrap md:flex-nowrap">
      <div>
        {leftRows.map((row, i) => (
          <div key={i} className="flex justify-end">
            {row.map(label => {
              const seat = leftSeats.find(s => s.seat_label === label);
              return seat ? renderSeat(seat) : null;
            })}
          </div>
        ))}
        <div className="flex mt-4">
          {/* Stairs */}
          <div className="w-1/2 h-32 bg-gray-200 m-2 flex items-center justify-center border border-gray-400">
            <Footprints className="w-6 h-6 text-gray-700" />
          </div>

          {/* Washrooms stack */}
          <div className="w-1/2 flex flex-col">
            <div className="h-14 bg-gray-200 m-2 flex items-center justify-center border border-gray-400">
              <Toilet className="w-6 h-6 text-gray-700" />
            </div>
            <div className="h-14 bg-gray-200 m-2 flex items-center justify-center border border-gray-400">
              <Toilet className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>

      </div>

      <div className="relative w-16 flex flex-col justify-center items-center">
        <div className="absolute top-0 bottom-0 left-2 w-px bg-gray-400"></div>
        <div className="absolute top-0 bottom-0 right-2 w-px bg-gray-400"></div>
        <div className="rotate-90 text-sm text-gray-500">Passage</div>
      </div>

      <div>
        {rightRows.map((row, i) => (
          <div key={i} className="flex">
            {row.map(label => {
              const seat = rightSeats.find(s => s.seat_label === label);
              return seat ? renderSeat(seat) : null;
            })}
          </div>
        ))}
      </div>
    </div>
  );

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

  const leftRows = [
    ['A1', 'A2'],
    ['B1', 'B2', 'B3', 'B4'],
    ['C1', 'C2', 'C3', 'C4'],
    ['D1', 'D2', 'D3', 'D4'],
    ['E1', 'E2', 'E3', 'E4'],
    ['F1', 'F2', 'F3', 'F4']
  ];
  const rightRows = [
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
  const leftSeats = seats.filter(s => leftRows.flat().includes(s.seat_label));
  const rightSeats = seats.filter(s => rightRows.flat().includes(s.seat_label));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Library Seat Layout
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500"></div> Available
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500"></div> On Hold
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div> Booked
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>{sectionLayout(leftRows, rightRows, leftSeats, rightSeats)}</CardContent>
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
              title: 'Booking Submitted',
              description: 'Your booking request has been submitted for approval.',
            });
          }}
        />
      )}
    </div>
  );
};
