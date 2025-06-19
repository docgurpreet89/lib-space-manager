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
  seat_label: string | null;
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

    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        seat_bookings:seat_bookings(seat_id, status, seats(seat_label))
      `, { count: 'exact' })
      .range(from, to);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    const formatted = (data || []).map((u: any) => {
      const approvedBooking = (u.seat_bookings || []).find((b: any) => b.status === 'approved');
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        seat_label: approvedBooking?.seats?.seat_label || null
      };
    });

    setUsers(formatted);
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
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.full_name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.phone}</td>
              <td className="p-2">{u.seat_label || 'N/A'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">No users found</td>
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
