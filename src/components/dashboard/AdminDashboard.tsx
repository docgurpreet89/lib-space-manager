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
  const [editingBooking, setEditingBooking] = useState(null);
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

  const loadStats = async () => {
    const { count: pending } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: seatChanges } = await supabase.from('seat_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { data: seats } = await supabase.from('seats').select('id');
    const { data: booked } = await supabase.from('seat_bookings').select('id').eq('status', 'approved');
    const { data: held } = await supabase.from('seat_holds').select('id');
    const { count: biometric } = await supabase.from('biometric_cards').select('*', { count: 'exact', head: true });

    setStats({
      pending: pending || 0,
      seatChanges: seatChanges || 0,
      expiring: 0,
      totalSeats: seats?.length || 0,
      booked: booked?.length || 0,
      held: held?.length || 0,
      available: (seats?.length || 0) - (booked?.length || 0) - (held?.length || 0),
      biometric: biometric || 0
    });
  };

  const loadPendingBookings = async () => {
    const { data } = await supabase.from('seat_bookings').select('id, name, amount, status').eq('status', 'pending');
    setPendingBookings(data || []);
  };

  const loadSeatChangeRequests = async () => {
    const { data } = await supabase.from('seat_change_requests').select('*').eq('status', 'pending');
    setSeatChangeRequests(data || []);
  };

  const loadExpiringMembers = async () => {
    const { data } = await supabase.rpc('get_soon_expiring_memberships');
    setExpiringMembers(data || []);
  };

  const handleApprove = async (bookingId) => {
    const { error } = await supabase.from('seat_bookings').update({ status: 'approved' }).eq('id', bookingId);
    if (!error) {
      loadPendingBookings();
      loadStats();
    }
  };

  const filteredBookings = pendingBookings.filter(b => b.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
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
            <div className="font-bold text-lg mb-4">Booking Management (Quick Actions)</div>
            <div className="space-y-4">
              <div>
                <div className="font-semibold mb-1">Pending Bookings</div>
                {paginatedBookings.length === 0 && <div className="text-gray-500">No pending bookings found.</div>}
                {paginatedBookings.map((b) => (
                  <div key={b.id} className="border p-2 rounded-md flex justify-between items-center">
                    <div>{b.name} — ₹{b.amount}</div>
                    <Button size="sm" onClick={() => handleApprove(b.id)}>Approve</Button>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-semibold mb-1">Seat Change Requests</div>
                {seatChangeRequests.map((req) => (
                  <div key={req.id} className="border p-2 rounded-md flex justify-between items-center">
                    <div>{req.user_name} → {req.requested_seat}</div>
                    <Button size="sm">Review</Button>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-semibold mb-1">Expiring Members</div>
                {expiringMembers.map((m, i) => (
                  <div key={i} className="border p-2 rounded-md">
                    {m.name} — Valid till {m.valid_till}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
