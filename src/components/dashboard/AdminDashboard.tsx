import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Repeat, Users, FileText, Bell, Fingerprint, IdCard } from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [seatChangeRequests, setSeatChangeRequests] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [seatMap, setSeatMap] = useState({});
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

  // Load initial data
  useEffect(() => {
    loadBookings();
    loadSeatChangeRequests();
    loadExpiringMembers();
    loadSeatMap();
    loadStats();
  }, []);

  const loadBookings = async () => {
    const { data, error } = await supabase.from('seat_bookings').select('*');
    if (!error) setBookings(data || []);
  };

  const loadSeatChangeRequests = async () => {
    const { data, error } = await supabase.from('seat_change_requests').select('*').eq('status', 'pending');
    if (!error) setSeatChangeRequests(data || []);
  };

  const loadExpiringMembers = async () => {
    const { data, error } = await supabase.rpc('get_soon_expiring_memberships');
    if (!error) setExpiringMembers(data || []);
  };

  const loadSeatMap = async () => {
    // Assumes seats table has columns seat_id and seat_number
    const { data, error } = await supabase.from('seats').select('seat_id, seat_number');
    if (!error && data) {
      const map = data.reduce((acc, s) => ({ ...acc, [s.seat_id]: s.seat_number }), {});
      setSeatMap(map);
    }
  };

  const loadStats = async () => {
    const { count: pending } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: seatChanges } = await supabase.from('seat_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { data: seats } = await supabase.from('seats').select('seat_id');
    const { count: booked } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { data: held } = await supabase.from('seat_holds').select('seat_id');
    const { count: biometric } = await supabase.from('biometric_cards').select('*', { count: 'exact', head: true });

    setStats({
      pending: pending || 0,
      seatChanges: seatChanges || 0,
      expiring: expiringMembers.length,
      totalSeats: seats?.length || 0,
      booked: booked || 0,
      held: held?.length || 0,
      available: (seats?.length || 0) - (booked || 0) - (held?.length || 0),
      biometric: biometric || 0
    });
  };

  // Build notification queue
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    const merged = [
      // Pending Booking Requests with seat number
      ...bookings
        .filter(b => b.status === 'pending')
        .map(b => {
          const seatNum = seatMap[b.seat_id] || b.seat_id;
          return {
            id: b.id,
            type: 'booking',
            label: `Seat ${seatNum} Booking Request`,
            date: b.from_time || b.created_at
          };
        }),
      // Seat Change Requests
      ...seatChangeRequests.map(r => ({
        id: r.id,
        type: 'seat_change',
        label: `Seat Change Request: ${r.user_name}`,
        date: r.created_at
      })),
      // Expiring Memberships
      ...expiringMembers.map(m => ({
        id: m.id || m.user_id,
        type: 'expiry',
        label: `Expiring Membership: ${m.name}`,
        date: m.valid_till
      })),
    ];
    setQueue(merged);
  }, [bookings, seatChangeRequests, expiringMembers, seatMap]);

  const handleActionClick = item => {
    switch (item.type) {
      case 'booking':
        navigate('/admin/pending-bookings');
        break;
      case 'seat_change':
        navigate('/admin/seat-changes');
        break;
      case 'expiry':
        navigate('/admin/expiring-memberships');
        break;
    }
    setQueue(q => q.filter(i => i.id !== item.id));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
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

        {/* Pending Actions Queue */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="font-bold text-lg mb-3">🔔 Pending Actions</div>
          {queue.length === 0 ? (
            <div className="text-gray-500">No pending actions. All caught up!</div>
          ) : (
            <ul className="space-y-2">
              {queue.map(item => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleActionClick(item)}
                >
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="ghost">Go</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
