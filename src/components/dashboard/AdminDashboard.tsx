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
  const [pendingSeatBookings, setPendingSeatBookings] = useState([]);
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

  // Load everything
  useEffect(() => {
    loadSettings();
    loadStats();
    loadSeatChangeRequests();
    loadExpiringMembers();
    loadPendingBookings();
    loadPendingSeatBookings();
    const interval = setInterval(cleanupExpiredHolds, 60000);
    return () => clearInterval(interval);
  }, [seatLockDuration]);

  // Distinct, bold color classes
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

  // --- LOADERS ---

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

  const loadPendingSeatBookings = async () => {
    // 1. Get all pending seat bookings
    const { data: bookings, error } = await supabase
      .from('seat_bookings')
      .select('id, user_email, seat_id, status')
      .eq('status', 'pending');
    if (error) return;

    // 2. Get seat labels for all seat_ids
    const seatIds = [...new Set((bookings || []).map(b => b.seat_id))];
    let seats = [];
    if (seatIds.length > 0) {
      const res = await supabase
        .from('seats')
        .select('id, seat_label')
        .in('id', seatIds);
      seats = res.data || [];
    }
    // 3. Map seat ids to labels
    const seatLabelMap = {};
    seats.forEach(seat => { seatLabelMap[seat.id] = seat.seat_label; });
    // 4. Attach seat_label to each booking
    const result = (bookings || []).map(b => ({
      ...b,
      seat_label: seatLabelMap[b.seat_id] || b.seat_id
    }));
    setPendingSeatBookings(result);
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

  // NOTIFICATIONS: Pending Bookings, Seat Change, Expiring Members
  const notifications = [
    ...pendingSeatBookings.map(b => ({
      type: 'pending_booking',
      title: `New Seat Booking from ${b.user_email} for Seat No. ${b.seat_label}`,
      subtext: `Booking ID: ${b.id}`,
      action: (
        <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <a href="/admin/pending-bookings">Go to Pending Booking Page</a>
        </Button>
      ),
    })),
    ...seatChangeRequests.map(r => ({
      type: 'seatChange',
      title: `Seat Change Request: ${r.user_name || r.name}`,
      subtext: `Requested Seat: ${r.requested_seat || 'N/A'}`,
      action: null
    })),
    ...expiringMembers.map(m => ({
      type: 'expiring',
      title: `Membership Expiring: ${m.name}`,
      subtext: `Expiry: ${m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'soon'}`,
      action: null
    }))
  ];

  // STATS CARDS: Label first, then big number
  const statsArray = [
    { label: 'Pending Bookings', value: stats.pending, color: statCardColors[0] },
    { label: 'Seat Changes', value: stats.seatChanges, color: statCardColors[1] },
    { label: 'Expiring Memberships', value: stats.expiring, color: statCardColors[2] },
    { label: 'Total Seats', value: stats.totalSeats, color: statCardColors[3] },
    { label: 'Booked', value: stats.booked, color: statCardColors[4] },
    { label: 'On Hold', value: stats.held, color: statCardColors[5] },
    { label: 'Available', value: stats.available, color: statCardColors[6] },
    { label: 'Biometric Issued', value: stats.biometric, color: statCardColors[7], icon: <Fingerprint className="w-5 h-5 mr-1 inline" /> },
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
          {statsArray.map((item, i) => (
            <Card key={item.label} className={item.color + " p-4 flex flex-col items-center"}>
              <CardContent className="flex flex-col items-center justify-center gap-1">
                <div className="text-base font-semibold mb-1">{item.icon}{item.label}</div>
                <div className="text-5xl font-extrabold tracking-tight">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* PENDING ACTIONS AS NOTIFICATIONS */}
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
                    maxWidth: 420,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)'
                  }}
                >
                  <div className="flex-shrink-0">
                    {n.type === 'pending_booking' && <ClipboardList className="w-7 h-7 text-blue-700" />}
                    {n.type === 'seatChange' && <Repeat className="w-7 h-7 text-red-600" />}
                    {n.type === 'expiring' && <Bell className="w-7 h-7 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{n.title}</div>
                    <div className="text-xs text-gray-500">{n.subtext}</div>
                  </div>
                  {n.action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
