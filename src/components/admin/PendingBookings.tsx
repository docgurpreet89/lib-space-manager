import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface PendingBooking {
  id: string;
  full_name: string;
  email: string;
  seat_label: string;
  from_time: string;
  to_time: string;
}

export const PendingBookingsPage = () => {
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, [search, page, perPage]);

  const fetchBookings = async () => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('seat_bookings')
      .select(`
        id,
        user_name,
        user_email,
        from_time,
        to_time,
        seats(seat_label)
      `, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    const formatted = (data || []).map((b: any) => ({
      id: b.id,
      full_name: b.user_name,
      email: b.user_email,
      seat_label: b.seats?.seat_label || 'N/A',
      from_time: b.from_time,
      to_time: b.to_time
    }));

    setBookings(formatted);
    setTotal(count || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-64"
        />
        <select
          className="app-input p-2 border rounded"
          value={perPage}
          onChange={(e) => {
            setPerPage(parseInt(e.target.value));
            setPage(1);
          }}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
        </select>
      </div>

      <Table>
        <thead className="bg-[#00B9F1] text-white">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Seat</th>
            <th className="p-2 text-left">From</th>
            <th className="p-2 text-left">To</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length > 0 ? bookings.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-2">{b.full_name}</td>
              <td className="p-2">{b.email}</td>
              <td className="p-2">{b.seat_label}</td>
              <td className="p-2">{new Date(b.from_time).toLocaleString('en-IN')}</td>
              <td className="p-2">{new Date(b.to_time).toLocaleString('en-IN')}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">No pending bookings found</td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="flex justify-between items-center text-sm">
        <span>
          Showing {Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (p * perPage < total ? p + 1 : p))}
            disabled={page * perPage >= total}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
