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
        expiring: expiringMembers.length,
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

      await supabase.from('seat_bookings').update({
        status: 'approved'
      }).eq('seat_hold_id', bookingId);

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
          await supabase.from('seat_bookings').update({
            status: 'timeout'
          }).eq('seat_hold_id', hold.id);

          await supabase.from('seat_holds').delete().eq('id', hold.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired holds:', error.message);
    }
  };

  // For notification mobile style cards
  const notifications = [
    ...pendingBookings.map(b => ({
      type: 'booking',
      title: `Pending Booking: ${b.name}`,
      message: `Amount: ₹${b.amount}`,
      time: new Date(b.created_at).toLocaleString(),
      action: () => handleApprove(b.id)
    })),
    ...seatChangeRequests.map(r => ({
      type: 'seatChange',
      title: `Seat Change Request: ${r.user_name || r.name}`,
      message: `Requested Seat: ${r.requested_seat || 'N/A'}`,
      time: new Date(r.created_at).toLocaleString(),
      action: () => {} // add approve/reject handler if needed
    })),
    ...expiringMembers.map(m => ({
      type: 'expiring',
      title: `Membership Expiring: ${m.name}`,
      message: `Expiry: ${m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'soon'}`,
      time: '',
      action: null
    }))
  ];

  // Distinct, non-pastel color classes
  const statCardColors = [
    'bg-blue-700 text-white',
    'bg-red-600 text-white',
    'bg-emerald-700 text-white',
    'bg-yellow-600 text-white',
    'bg-violet-700 text-white',
    'bg-orange-600 text-white',
    'bg-green-700 text-white',
    'bg-gray-900 text-white'
  ];

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
          <Card className={statCardColors[0] + " p-4"}><CardContent><div>Pending Bookings</div><div className="text-xl font-bold">{stats.pending}</div></CardContent></Card>
          <Card className={statCardColors[1] + " p-4"}><CardContent><div>Seat Changes</div><div className="text-xl font-bold">{stats.seatChanges}</div></CardContent></Card>
          <Card className={statCardColors[2] + " p-4"}><CardContent><div>Expiring Memberships</div><div className="text-xl font-bold">{stats.expiring}</div></CardContent></Card>
          <Card className={statCardColors[3] + " p-4"}><CardContent><div>Total Seats</div><div className="text-xl font-bold">{stats.totalSeats}</div></CardContent></Card>
          <Card className={statCardColors[4] + " p-4"}><CardContent><div>Booked</div><div className="text-xl font-bold">{stats.booked}</div></CardContent></Card>
          <Card className={statCardColors[5] + " p-4"}><CardContent><div>On Hold</div><div className="text-xl font-bold">{stats.held}</div></CardContent></Card>
          <Card className={statCardColors[6] + " p-4"}><CardContent><div>Available</div><div className="text-xl font-bold">{stats.available}</div></CardContent></Card>
          <Card className={statCardColors[7] + " p-4"}><CardContent><div className="flex items-center"><Fingerprint className="w-4 h-4 mr-1" /> Biometric Issued</div><div className="text-xl font-bold">{stats.biometric}</div></CardContent></Card>
        </div>

        {/* Pending Actions as Mobile Notification Style */}
        <Card className="p-4 shadow bg-gray-50">
          <CardContent>
            <div className="font-bold text-lg mb-2">Pending Actions</div>
            <div className="flex flex-col gap-3">
              {notifications.length === 0 && <div className="text-gray-400 text-sm">No pending actions!</div>}
              {notifications.map((n, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-xl shadow border border-gray-200 bg-white px-4 py-3"
                  style={{
                    maxWidth: 400,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)'
                  }}
                >
                  <div className="flex-shrink-0">
                    {n.type === 'booking' && <ClipboardList className="w-7 h-7 text-blue-700" />}
                    {n.type === 'seatChange' && <Repeat className="w-7 h-7 text-red-600" />}
                    {n.type === 'expiring' && <Bell className="w-7 h-7 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{n.title}</div>
                    <div className="text-xs text-gray-500">{n.message}</div>
                    {n.time && <div className="text-xs text-gray-400">{n.time}</div>}
                  </div>
                  {n.type === 'booking' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={n.action}>Approve</Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
