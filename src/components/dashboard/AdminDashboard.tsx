import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Repeat, Users, FileText, Bell, Fingerprint, IdCard } from 'lucide-react';

export const AdminDashboard = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [seatChangeRequests, setSeatChangeRequests] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [seatLockDuration, setSeatLockDuration] = useState(10);

  const [stats, setStats] = useState({
    pending: 0,
    seatChanges: 0,
    expiring: 0,
    totalSeats: 0,
    booked: 0,
    held: 0,
    available: 0,
    biometric: 0
  });

  useEffect(() => {
    loadSettings();
    loadStats();
    loadSeatChangeRequests();
    loadExpiringMembers();
    loadPendingBookings();
    const interval = setInterval(cleanupExpiredHolds, 60000);
    return () => clearInterval(interval);
  }, [seatLockDuration]);

  const loadSettings = async () => {
    const { data, error } = await supabase.from('library_settings').select('seat_lock_duration_minutes').single();
    if (!error && data?.seat_lock_duration_minutes) {
      setSeatLockDuration(data.seat_lock_duration_minutes);
    }
  };

  const loadStats = async () => {
    try {
      const { count: seatChanges } = await supabase.from('seat_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: seats } = await supabase.from('seats').select('id');
      const { data: booked } = await supabase.from('seat_bookings').select('id').eq('status', 'approved');
      const { data: held } = await supabase.from('seat_holds').select('id');
      const { count: biometric } = await supabase.from('biometric_cards').select('*', { count: 'exact', head: true });
      const { data: pendingHolds } = await supabase.from('seat_holds').select('*');

      setStats({
        pending: pendingHolds?.length || 0,
        seatChanges: seatChanges || 0,
        expiring: 0,
        totalSeats: seats?.length || 0,
        booked: booked?.length || 0,
        held: held?.length || 0,
        available: (seats?.length || 0) - (booked?.length || 0) - (held?.length || 0),
        biometric: biometric || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error.message);
    }
  };

  const loadPendingBookings = async () => {
    try {
      const { data, error } = await supabase.from('seat_holds').select('id, name, amount, status, created_at');
      if (error) throw error;
      const now = new Date();
      const filtered = (data || []).filter(hold => {
        const createdAt = new Date(hold.created_at);
        const diffMinutes = (now - createdAt) / (1000 * 60);
        return diffMinutes <= seatLockDuration;
      });
      setPendingBookings(filtered);
    } catch (error) {
      console.error('Failed to load pending bookings:', error.message);
    }
  };

  const loadSeatChangeRequests = async () => {
    try {
      const { data } = await supabase.from('seat_change_requests').select('*').eq('status', 'pending');
      setSeatChangeRequests(data || []);
    } catch (error) {
      console.error('Failed to load seat change requests:', error.message);
    }
  };

  const loadExpiringMembers = async () => {
    try {
      const { data } = await supabase.rpc('get_soon_expiring_memberships');
      setExpiringMembers(data || []);
    } catch (error) {
      console.error('Failed to load expiring members:', error.message);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      const { data: holdData, error: holdError } = await supabase.from('seat_holds').select('*').eq('id', bookingId).single();
      if (holdError) throw holdError;

      await supabase.from('seat_bookings').insert({
        name: holdData.name,
        amount: holdData.amount,
        status: 'approved'
      });

      await supabase.from('seat_holds').delete().eq('id', bookingId);
      await loadPendingBookings();
      await loadStats();
    } catch (error) {
      console.error('Failed to approve booking:', error.message);
    }
  };

  const cleanupExpiredHolds = async () => {
    try {
      const { data } = await supabase.from('seat_holds').select('*');
      const now = new Date();
      for (const hold of data || []) {
        const createdAt = new Date(hold.created_at);
        const diffMinutes = (now - createdAt) / (1000 * 60);
        if (diffMinutes > seatLockDuration) {
          await supabase.from('seat_bookings').insert({
            name: hold.name,
            amount: hold.amount,
            status: 'cancelled'
          });
          await supabase.from('seat_holds').delete().eq('id', hold.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired holds:', error.message);
    }
  };

  const filteredBookings = pendingBookings.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex">
      <div className="w-64 bg-blue-900 text-white p-4 space-y-2 min-h-screen">
        <div className="text-2xl font-bold mb-4">Admin Dashboard</div>
        {[{ label: 'Pending Bookings', icon: ClipboardList },
          { label: 'Seat Change Requests', icon: Repeat },
          { label: 'All Users', icon: Users },
          { label: 'All Transactions', icon: FileText },
          { label: 'Notice Management', icon: Bell },
          { label: 'Expiring Memberships', icon: FileText },
          { label: 'Biometric Enrollments', icon: IdCard }].map(item => (
          <div key={item.label} className="flex items-center space-x-2 p-2 hover:bg-blue-800 rounded cursor-pointer">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-pink-100 p-4"><CardContent><div>Pending Bookings</div><div className="text-xl font-bold">{stats.pending}</div></CardContent></Card>
          <Card className="bg-blue-100 p-4"><CardContent><div>Seat Changes</div><div className="text-xl font-bold">{stats.seatChanges}</div></CardContent></Card>
          <Card className="bg-green-100 p-4"><CardContent><div>Expiring Memberships</div><div className="text-xl font-bold">{stats.expiring}</div></CardContent></Card>
          <Card className="bg-yellow-100 p-4"><CardContent><div>Total Seats</div><div className="text-xl font-bold">{stats.totalSeats}</div></CardContent></Card>
          <Card className="bg-purple-100 p-4"><CardContent><div>Booked</div><div className="text-xl font-bold">{stats.booked}</div></CardContent></Card>
          <Card className="bg-orange-100 p-4"><CardContent><div>On Hold</div><div className="text-xl font-bold">{stats.held}</div></CardContent></Card>
          <Card className="bg-teal-100 p-4"><CardContent><div>Available</div><div className="text-xl font-bold">{stats.available}</div></CardContent></Card>
          <Card className="bg-indigo-100 p-4"><CardContent><div className="flex items-center"><Fingerprint className="w-4 h-4 mr-1" /> Biometric Issued</div><div className="text-xl font-bold">{stats.biometric}</div></CardContent></Card>
        </div>

        <Card className="p-6 shadow bg-white">
          <CardContent>
            <div className="flex justify-between mb-2">
              <div className="font-bold">Booking Management</div>
              <Input placeholder="Search by name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64" />
            </div>
            <table className="min-w-full bg-white rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2 text-left text-xs font-bold">S/N</th>
                  <th className="p-2 text-left text-xs font-bold">Name</th>
                  <th className="p-2 text-left text-xs font-bold">Amount</th>
                  <th className="p-2 text-left text-xs font-bold">Date</th>
                  <th className="p-2 text-left text-xs font-bold">Status</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b, index) => (
                  <tr key={b.id} className="border-b">
                    <td className="p-2 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-2 text-xs">{b.name}</td>
                    <td className="p-2 text-xs">₹{b.amount}</td>
                    <td className="p-2 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="p-2 text-xs">{b.status}</td>
                    <td className="p-2 text-xs">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleApprove(b.id)}>Approve</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-2">
              <Button size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <span className="text-xs text-gray-500">Page {currentPage}</span>
              <Button size="sm" disabled={currentPage * itemsPerPage >= filteredBookings.length} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
