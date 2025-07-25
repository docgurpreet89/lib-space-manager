import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export const PendingBookings = () => {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    const { data, error } = await supabase
      .from('seat_bookings')
      .select(`*, profiles(full_name, phone)`)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending bookings:', error);
    } else {
      setData(data || []);
    }
  };

  const filtered = data.filter((item) =>
    (item.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#00B9F1]">Pending Bookings</h3>
        <Input
          placeholder="Search by name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-64"
        />
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F0F9FF]">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? (
              paginated.map((item) => (
                <TableRow key={item.booking_id}>
                  <TableCell>{item.profiles?.full_name || '-'}</TableCell>
                  <TableCell>{item.profiles?.phone || '-'}</TableCell>
                  <TableCell>{item.seat_id}</TableCell>
                  <TableCell>{new Date(item.from_time).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(item.to_time).toLocaleDateString()}</TableCell>
                  <TableCell className="text-yellow-600 font-semibold">Pending</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No pending bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Showing {paginated.length} of {filtered.length} results
        </span>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="paytm-button-secondary px-3 py-1 text-sm"
          >
            Prev
          </Button>
          <Button
            onClick={() => setCurrentPage((p) => (p * rowsPerPage < filtered.length ? p + 1 : p))}
            disabled={currentPage * rowsPerPage >= filtered.length}
            className="paytm-button-secondary px-3 py-1 text-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
