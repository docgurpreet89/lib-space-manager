import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Menu, X, Users, Settings, Calendar,
  ClipboardList, Repeat, FileText, Bell, Fingerprint, IdCard
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [seatChangeRequests, setSeatChangeRequests] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [seatMap, setSeatMap] = useState({});
  const [queue, setQueue] = useState([]);
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

  // Load data on mount
  useEffect(() => {
    loadBookings();
    loadSeatChangeRequests();
    loadExpiringMembers();
    loadSeatMap();
  }, []);

  useEffect(() => {
    loadStats();
  }, [expiringMembers]);

  const loadBookings = async () => {
    const { data, error } = await supabase.from('seat_bookings').select('*');
    if (!error) setBookings(data || []);
  };

  const loadSeatChangeRequests = async () => {
    const { data, error } = await supabase
      .from('seat_change_requests')
      .select('*')
      .eq('status', 'pending');
    if (!error) setSeatChangeRequests(data || []);
  };

  const loadExpiringMembers = async () => {
    const { data, error } = await supabase.rpc('get_soon_expiring_memberships');
    if (!error) setExpiringMembers(data || []);
  };

  const loadSeatMap = async () => {
    const { data, error } = await supabase
      .from('seats')
      .select('seat_id, seat_label');
    if (!error && data) {
      const map = data.reduce((acc, s) => ({ ...acc, [s.seat_id]: s.seat_label }), {});
      setSeatMap(map);
    }
  };

  const loadStats = async () => {
    const { count: pending } = await supabase
      .from('seat_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    const { count: seatChanges } = await supabase
      .from('seat_change_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    const { data: seats } = await supabase.from('seats').select('seat_id');
    const { count: booked } = await supabase
      .from('seat_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    const { data: held } = await supabase.from('seat_holds').select('seat_id');
    const { count: biometric } = await supabase
      .from('biometric_cards')
      .select('*', { count: 'exact', head: true });

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

  // Build notification queue (merged actions)
  useEffect(() => {
    const merged = [
      // Pending Booking Requests with seat label
      ...bookings
        .filter(b => b.status === 'pending')
        .map(b => {
          const seatNum = seatMap[b.seat_id] || b.seat_id;
          return {
            id: b.id,
            type: 'booking',
            label: `New seat request by ${b.user_email} for seat number ${seatNum}`,
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
      }))
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
      default:
        break;
    }
    setQueue(q => q.filter(i => i.id !== item.id));
  };

  // Full navigation config
  const navItems = [
    { label: 'Pending Bookings', icon: ClipboardList, path: '/admin/pending-bookings' },
    { label: 'Seat Change Requests', icon: Repeat, path: '/admin/seat-changes' },
    { label: 'All Users', icon: Users, path: '/admin/users' },
    { label: 'All Transactions', icon: FileText, path: '/admin/transactions' },
    { label: 'Notice Management', icon: Bell, path: '/admin/notices' },
    { label: 'Expiring Memberships', icon: FileText, path: '/admin/expiring-memberships' },
    { label: 'Biometric Enrollments', icon: IdCard, path: '/admin/biometric-enrollments' }
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - now w-64 and full height */}
      <div className={`
        fixed top-0 left-0 h-full w-64 border-r border-[#E0E0E0] z-50
        transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        bg-blue-900 text-white flex flex-col
      `}>
        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <Button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-[#3B4CCA] rounded-lg"
            variant="ghost"
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="flex-1 flex flex-col justify-between">
          <div className="p-4 space-y-1">
            {navItems.map(item => (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <item.icon size={20} />
                {item.label}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <Button
            onClick={() => setShowSidebar(true)}
            className="bg-blue-900 text-white p-3"
          >
            <Menu size={20} />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">
              Admin Dashboard
            </h2>
            <p className="text-[#666666]">
              Manage bookings, seat changes, and library settings
            </p>
          </div>

          {/* Statistics Cards (sharp edges, vibrant colors, no gaps) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 overflow-hidden">
            <Card className="bg-blue-600 text-white rounded-none border-0">
              <CardContent>
                <div>Pending Bookings</div>
                <div className="text-xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white rounded-none border-0">
              <CardContent>
                <div>Seat Changes</div>
                <div className="text-xl font-bold">{stats.seatChanges}</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500 text-white rounded-none border-0">
              <CardContent>
                <div>Expiring Memberships</div>
                <div className="text-xl font-bold">{stats.expiring}</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 text-white rounded-none border-0">
              <CardContent>
                <div>Total Seats</div>
                <div className="text-xl font-bold">{stats.totalSeats}</div>
              </CardContent>
            </Card>
            <Card className="bg-violet-700 text-white rounded-none border-0">
              <CardContent>
                <div>Booked</div>
                <div className="text-xl font-bold">{stats.booked}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-700 text-white rounded-none border-0">
              <CardContent>
                <div>On Hold</div>
                <div className="text-xl font-bold">{stats.held}</div>
              </CardContent>
            </Card>
            <Card className="bg-teal-600 text-white rounded-none border-0">
              <CardContent>
                <div>Available</div>
                <div className="text-xl font-bold">{stats.available}</div>
              </CardContent>
            </Card>
            <Card className="bg-rose-600 text-white rounded-none border-0">
              <CardContent>
                <div className="flex items-center">
                  <Fingerprint className="w-4 h-4 mr-1" /> Biometric Issued
                </div>
                <div className="text-xl font-bold">{stats.biometric}</div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Queue */}
          <div className="bg-white rounded-lg shadow p-4 mt-2">
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
    </div>
  );
};
