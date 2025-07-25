import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Membership {
  booking_id: string;
  user_name: string;
  user_email: string;
  seat_label: string;
  to_time: string;
  remaining_days: number;
}

export const SoonExpiringMemberships = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Membership[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    fetchMemberships();
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      memberships.filter(
        m =>
          m.user_name.toLowerCase().includes(s) ||
          m.user_email.toLowerCase().includes(s) ||
          m.seat_label.toLowerCase().includes(s)
      )
    );
    setPage(1);
  }, [search, memberships]);

  const fetchMemberships = async () => {
    const { data, error } = await supabase
      .rpc('get_soon_expiring_memberships'); // You need to create this DB function or equivalent query

    if (error) {
      console.error('Error fetching memberships:', error);
    } else {
      setMemberships(data || []);
    }
  };

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="bg-white rounded-lg p-4 shadow space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#333]">Soon Expiring Memberships</h3>
        <Input
          placeholder="Search name, email, seat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 app-input"
        />
      </div>

      {paginated.length === 0 ? (
        <p className="text-sm text-gray-500">No memberships expiring soon.</p>
      ) : (
        <table className="w-full text-sm border border-[#E0E0E0]">
          <thead className="bg-[#F5F5F5]">
            <tr>
              <th className="p-2 border-b">Name</th>
              <th className="p-2 border-b">Email</th>
              <th className="p-2 border-b">Seat</th>
              <th className="p-2 border-b">Expires</th>
              <th className="p-2 border-b">Days Left</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(m => (
              <tr key={m.booking_id} className="text-center">
                <td className="p-2 border-b">{m.user_name}</td>
                <td className="p-2 border-b">{m.user_email}</td>
                <td className="p-2 border-b">{m.seat_label}</td>
                <td className="p-2 border-b">
                  {new Date(m.to_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </td>
                <td className="p-2 border-b text-[#00B9F1] font-bold">{m.remaining_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-between items-center pt-2">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
