import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  user_name: string;
  user_email: string;
  seat_id: string;
  from_time: string;
  to_time: string;
  status: string;
  price: number;
}

export const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [search, statusFilter, page, perPage]);

  const fetchTransactions = async () => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('seat_bookings')
      .select('id, user_name, user_email, seat_id, from_time, to_time, status, price', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data || []);
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>
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
            <th className="p-2 text-left">Duration</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? transactions.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.user_name}</td>
              <td className="p-2">{t.user_email}</td>
              <td className="p-2">{t.seat_id}</td>
              <td className="p-2">
                {t.from_time?.split('T')[0]} → {t.to_time?.split('T')[0]}
              </td>
              <td className="p-2">₹ {t.price}</td>
              <td className="p-2 capitalize">{t.status}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">No transactions found</td>
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
