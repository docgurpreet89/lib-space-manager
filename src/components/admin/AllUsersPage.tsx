import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  approved_seat: string | null;
  duration: string | null;
}

export const AllUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [search, page, perPage]);

  const fetchUsers = async () => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email, phone,
        seat_bookings(seat_id, from_time, to_time)
      `, { count: 'exact' })
      .ilike('full_name', `%${search}%`)
      .range(from, to);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    const mapped = (data || []).map((u) => {
      const approved = u.seat_bookings?.find((b) => b.from_time && b.to_time);
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        approved_seat: approved?.seat_id || 'N/A',
        duration: approved ? `${approved.from_time.split('T')[0]} → ${approved.to_time.split('T')[0]}` : 'N/A'
      };
    });

    setUsers(mapped);
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
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Approved Seat</th>
            <th className="p-2 text-left">Duration</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.full_name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.phone}</td>
              <td className="p-2">{u.approved_seat}</td>
              <td className="p-2">{u.duration}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">No users found</td>
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
