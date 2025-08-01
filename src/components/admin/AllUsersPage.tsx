// src/components/pages/admin/AllUsers.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Repeat,
  Users,
  FileText,
  Bell,
  IdCard,
  LogOut,
  ArrowLeft,
  Search,
  Edit3,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  List,
} from 'lucide-react';
import dayjs from 'dayjs';

const AllUsers = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);


  // Admin guard + load data
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate('/');
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      if (error || data.role !== 'admin') return navigate('/');
      setIsAdmin(true);
      loadUsers();
    })();
  }, [navigate]);

  // Fetch user list, bookings, and seats
  const loadUsers = async () => {
    setLoading(true);
    // 1) get all user_ids with role 'user'
    const { data: rolesData, error: rolesErr } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'user');
    if (rolesErr) { console.error(rolesErr); setLoading(false); return; }
    const ids = rolesData.map(r => r.user_id);

    // 2) fetch latest approved booking per user
    const { data: bookings, error: bookErr } = await supabase
      .from('seat_bookings')
      .select('user_id, user_name, user_email, user_phone, status, from_time, to_time, seat_id')
      .in('user_id', ids)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (bookErr) console.error(bookErr);

    // map user data and collect seat_ids
    const map: Record<string, any> = {};
    const seatSet = new Set<string>();
    bookings?.forEach(b => {
      if (!map[b.user_id]) {
        map[b.user_id] = { ...b };
        if (b.seat_id) seatSet.add(b.seat_id);
      }
    });

    // 3) fetch seat labels
    const { data: seats } = await supabase
      .from('seats')
      .select('seat_id, seat_label')
      .in('seat_id', Array.from(seatSet));
    const seatMap = seats?.reduce((acc, s) => ({ ...acc, [s.seat_id]: s.seat_label }), {}) || {};

    // assemble final array with start_date and end_date
    const allUsers = ids.map(id => {
      const u = map[id] || {};
      const startDate = u.from_time || null;
      const endDate = u.to_time || null;
      const daysLeft = endDate ? dayjs(endDate).diff(dayjs(), 'day') : null;
      return {
        id,
        name: u.user_name || '-',
        email: u.user_email || '-',
        phone: u.user_phone || '-',
        seat: u.seat_id ? seatMap[u.seat_id] || u.seat_id : '-',
        membership: u.status || 'none',
        startDate,
        endDate,
        daysLeft,
      };
    });

    setUsers(allUsers);
    setLoading(false);
  };

  const loadTransactions = async (userId: string) => {
    setModalLoading(true);
    setViewingUserId(userId);
    const { data, error } = await supabase
      .from('seat_bookings')
      .select('booking_id, from_time, to_time, status, seat_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setTransactions(data || []);
    setModalLoading(false);
  };

  if (!isAdmin) return <div className="p-6 text-center">Checking access...</div>;

  // Navigation items
  const nav = [
    { label: 'Admin Home', icon: FileText, path: '/admin' },
    { label: 'Pending Bookings', icon: ClipboardList, path: '/admin/pending-bookings' },
    { label: 'Seat Change Requests', icon: Repeat, path: '/admin/seat-changes' },
    { label: 'All Users', icon: Users, path: '/admin/all-users' },
    { label: 'All Transactions', icon: FileText, path: '/admin/all-transactions' },
    { label: 'Notice Management', icon: Bell, path: '/admin/notices' },
    { label: 'Expiring Memberships', icon: FileText, path: '/admin/expiring-memberships' },
    { label: 'Biometric Management', icon: IdCard, path: '/admin/biometrics' },
  ];
  // filtering & pagination
  const filtered = users.filter(u =>
    [u.id, u.name, u.email, u.phone, u.seat]
      .some(v => v.toLowerCase().includes(filter.toLowerCase()))
  );
  const total = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-blue-800 text-white p-4 space-y-2">
        <div className="text-2xl font-bold mb-4">Admin Panel</div>
        {nav.map(item => (
          <div key={item.label} className="flex items-center p-2 hover:bg-blue-700 cursor-pointer" onClick={() => navigate(item.path)}>
            <span>{item.label}</span>
          </div>
        ))}
        <hr className="border-t border-blue-600 my-2" />
        <div className="flex items-center p-2 hover:bg-red-700 cursor-pointer" onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </div>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <Button size="sm" variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Homepage
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>role=user, allocated seat, start/end dates & days remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <Input className="pl-8 w-64" placeholder="Search..." value={filter} onChange={e => setFilter(e.target.value)} />
              </div>
              <select className="ml-auto border p-1 rounded" value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
                {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
            </div>

            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? <TableRow><TableCell colSpan={10} className="py-4 text-center">Loading...</TableCell></TableRow>
                    : pageData.length === 0
                      ? <TableRow><TableCell colSpan={10} className="py-4 text-center">No users found</TableCell></TableRow>
                      : pageData.map(u => (
                        <TableRow key={u.id} className={u.daysLeft != null && u.daysLeft < 0 ? 'bg-red-100' : ''}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.phone}</TableCell>
                          <TableCell>{u.seat}</TableCell>
                          <TableCell>
                            <Badge className={u.membership === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {u.membership}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.startDate ? dayjs(u.startDate).format('YYYY-MM-DD') : '-'}</TableCell>
                          <TableCell>{u.endDate ? dayjs(u.endDate).format('YYYY-MM-DD') : '-'}</TableCell>
                          <TableCell>{u.daysLeft != null ? (u.daysLeft >= 0 ? u.daysLeft : 'Expired') : '-'}</TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => loadTransactions(u.id)}>
                              <List className="w-4 h-4" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span>Page {page} of {total}</span>
              <Button size="sm" disabled={page === total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal for viewing user transactions */}
        {viewingUserId && (
          <Dialog open onOpenChange={() => setViewingUserId(null)}>
            <DialogContent className="max-w-2xl">
              <DialogTitle>User Transactions</DialogTitle>
              {modalLoading ? (
                <div className="py-4 text-center">Loading...</div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Seat ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.booking_id}>
                          <TableCell>{tx.booking_id}</TableCell>
                          <TableCell>{tx.seat_id || '-'}</TableCell>
                          <TableCell>{tx.status}</TableCell>
                          <TableCell>{dayjs(tx.from_time).format('YYYY-MM-DD')}</TableCell>
                          <TableCell>{dayjs(tx.to_time).format('YYYY-MM-DD')}</TableCell>
                          <TableCell>{dayjs(tx.created_at).format('YYYY-MM-DD HH:mm')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default AllUsers;
