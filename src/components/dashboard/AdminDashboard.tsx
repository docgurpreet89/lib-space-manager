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
    loadStats();
    loadPendingBookings();
    loadSeatChangeRequests();
    loadExpiringMembers();
  }, []);

  // --- STATS ---
  const loadStats = async () => {
    try {
      const { count: pending } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: seatChanges } = await supabase.from('seat_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: seats } = await supabase.from('seats').select('id');
      const { count: booked } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: held } = await supabase.from('seat_holds').select('*', { count: 'exact', head: true });
      const { count: biometric } = await supabase.from('biometric_cards').select('*', { count: 'exact', head: true });
      setStats({
        pending: pending || 0,
        seatChanges: seatChanges || 0,
        expiring: 0, // update as needed
        totalSeats: seats?.length || 0,
        booked: booked || 0,
        held: held || 0,
        available: (seats?.length || 0) - (booked || 0) - (held || 0),
        biometric: biometric || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error.message);
    }
  };

  // --- PENDING BOOKINGS FROM seat_bookings ---
  const loadPendingBookings = async () => {
    try {
      const { data, error } = await supabase.from('seat_bookings').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      setPendingBookings(data || []);
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

  // --- ACTIONS ---
  const handleApprove = async (bookingId) => {
    try {
      await supabase.from('seat_bookings').update({ status: 'approved' }).eq('id', bookingId);
      await loadPendingBookings();
      await loadStats();
    } catch (error) {
      console.error('Failed to approve booking:', error.message);
    }
  };

  const handleSeatChangeReview = async (id) => {
    await supabase.from('seat_change_requests').update({ status: 'reviewed' }).eq('id', id);
    await loadSeatChangeRequests();
  };

  const handleMembershipRenew = async (id) => {
    await supabase.from('memberships').update({ status: 'renewed' }).eq('id', id);
    await loadExpiringMembers();
  };

  // --- NOTIFICATION QUEUE ---
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    const merged = [
      ...pendingBookings.map(b => ({ ...b, type: 'booking' })),
      ...seatChangeRequests.map(c => ({ ...c, type: 'seat_change' })),
      ...expiringMembers.map(m => ({ ...m, type: 'expiry' })),
    ];
    setQueue(merged);
  }, [pendingBookings, seatChangeRequests, expiringMembers]);

  const handleQueueRemove = id => setQueue(q => q.filter(item => item.id !== id));

  // --- PAGINATION ---
  const filteredBookings = pendingBookings.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- UI ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-64 bg-blue-800 text-white p-4 space-y-2">
        <div className="text-2xl font-bold mb-4">Admin</div>
        {[
          { label: 'Pending Bookings', icon: ClipboardList },
          { label: 'Seat Change Requests', icon: Repeat },
          { label: 'All Users', icon: Users },
          { label: 'All Transactions', icon: FileText },
          { label: 'Notice Management', icon: Bell },
          { label: 'Expiring Memberships', icon: FileText },
          { label: 'Biometric Enrollments', icon: IdCard }
        ].map(item => (
          <div key={item.label} className="flex items-center p-2 rounded hover:bg-blue-700 cursor-pointer">
            <item.icon className="w-4 h-4 mr-2" /> {item.label}
          </div>
        ))}
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* --- STATISTICS CARDS --- */}
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

        {/* --- PENDING ACTIONS QUEUE --- */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="font-bold mb-2 text-lg">🔔 Pending Actions</div>
          {queue.length === 0 && (
            <div className="text-gray-500">No pending actions. All caught up!</div>
          )}
          {queue.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex justify-between items-center p-2 border-b last:border-none"
            >
              <div>
                {item.type === 'booking' && (
                  <>
                    <span className="font-semibold text-blue-700">Seat Booking:</span>{' '}
                    {item.name} — ₹{item.amount}
                  </>
                )}
                {item.type === 'seat_change' && (
                  <>
                    <span className="font-semibold text-yellow-700">Seat Change:</span>{' '}
                    {item.user_name} → {item.requested_seat}
                  </>
                )}
                {item.type === 'expiry' && (
                  <>
                    <span className="font-semibold text-red-700">Expiring Membership:</span>{' '}
                    {item.name} (valid till {item.valid_till})
                  </>
                )}
              </div>
              <div className="space-x-2">
                {item.type === 'booking' && (
                  <Button
                    size="sm"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={async () => {
                      await handleApprove(item.id);
                      handleQueueRemove(item.id);
                    }}
                  >
                    Approve
                  </Button>
                )}
                {item.type === 'seat_change' && (
                  <Button
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    onClick={async () => {
                      await handleSeatChangeReview(item.id);
                      handleQueueRemove(item.id);
                    }}
                  >
                    Review
                  </Button>
                )}
                {item.type === 'expiry' && (
                  <Button
                    size="sm"
                    className="bg-purple-500 text-white hover:bg-purple-600"
                    onClick={async () => {
                      await handleMembershipRenew(item.id);
                      handleQueueRemove(item.id);
                    }}
                  >
                    Renew
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- BOOKING MANAGEMENT TABLE --- */}
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
                  <th className="p-2 text-left text-xs font-bold">Created At</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b, index) => (
                  <tr key={b.id} className="border-b">
                    <td className="p-2 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-2 text-xs">{b.name}</td>
                    <td className="p-2 text-xs">₹{b.amount}</td>
                    <td className="p-2 text-xs">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="p-2 text-xs space-x-1">
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
