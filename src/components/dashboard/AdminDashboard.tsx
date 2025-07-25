import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardList, Repeat, Users, FileText, Bell,
  Fingerprint, IdCard, Menu, X
} from 'lucide-react';

// Sidebar menu
const navItems = [
  { label: 'Pending Bookings', icon: ClipboardList, path: '/admin/pending-bookings' },
  { label: 'Seat Change Requests', icon: Repeat, path: '/admin/seat-changes' },
  { label: 'All Users', icon: Users, path: '/admin/users' },
  { label: 'All Transactions', icon: FileText, path: '/admin/transactions' },
  { label: 'Notice Management', icon: Bell, path: '/admin/notices' },
  { label: 'Expiring Memberships', icon: FileText, path: '/admin/expiring-memberships' },
  { label: 'Biometric Enrollments', icon: IdCard, path: '/admin/biometric' },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [seatChangeRequests, setSeatChangeRequests] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [seatMap, setSeatMap] = useState({});
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    pending: 0, seatChanges: 0, expiring: 0,
    totalSeats: 0, booked: 0, held: 0, available: 0, biometric: 0
  });

  // Fetch data
  useEffect(() => {
    loadBookings();
    loadSeatChangeRequests();
    loadExpiringMembers();
    loadSeatMap();
  }, []);
  useEffect(() => { loadStats(); }, [expiringMembers]);

  const loadBookings = async () => {
    const { data } = await supabase.from('seat_bookings').select('*');
    setBookings(data || []);
  };
  const loadSeatChangeRequests = async () => {
    const { data } = await supabase.from('seat_change_requests').select('*').eq('status', 'pending');
    setSeatChangeRequests(data || []);
  };
  const loadExpiringMembers = async () => {
    const { data } = await supabase.rpc('get_soon_expiring_memberships');
    setExpiringMembers(data || []);
  };
  const loadSeatMap = async () => {
    const { data } = await supabase.from('seats').select('seat_id, seat_label');
    if (data) setSeatMap(data.reduce((acc, s) => ({ ...acc, [s.seat_id]: s.seat_label }), {}));
  };
  const loadStats = async () => {
    const { count: pending } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: seatChanges } = await supabase.from('seat_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { data: seats } = await supabase.from('seats').select('seat_id');
    const { count: booked } = await supabase.from('seat_bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { data: held } = await supabase.from('seat_holds').select('seat_id');
    const { count: biometric } = await supabase.from('biometric_cards').select('*', { count: 'exact', head: true });
    setStats({
      pending: pending || 0, seatChanges: seatChanges || 0, expiring: expiringMembers.length,
      totalSeats: seats?.length || 0, booked: booked || 0, held: held?.length || 0,
      available: (seats?.length || 0) - (booked || 0) - (held?.length || 0), biometric: biometric || 0
    });
  };

  // Notification queue (pending actions)
  useEffect(() => {
    const merged = [
      ...bookings.filter(b => b.status === 'pending').map(b => ({
        id: b.id, type: 'booking',
        label: `New seat request by ${b.user_email} for seat ${seatMap[b.seat_id] || b.seat_id}`,
        date: b.from_time || b.created_at
      })),
      ...seatChangeRequests.map(r => ({
        id: r.id, type: 'seat_change',
        label: `Seat Change Request: ${r.user_name}`,
        date: r.created_at
      })),
      ...expiringMembers.map(m => ({
        id: m.id || m.user_id, type: 'expiry',
        label: `Expiring Membership: ${m.name}`,
        date: m.valid_till
      }))
    ];
    setQueue(merged);
  }, [bookings, seatChangeRequests, expiringMembers, seatMap]);

  const handleActionClick = item => {
    switch (item.type) {
      case 'booking': navigate('/admin/pending-bookings'); break;
      case 'seat_change': navigate('/admin/seat-changes'); break;
      case 'expiry': navigate('/admin/expiring-memberships'); break;
      default: break;
    }
    setQueue(q => q.filter(i => i.id !== item.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161926] to-[#22253a] flex">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-200
        bg-[#21243A] border-r border-[#272b40] shadow-xl
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo & brand */}
        <div className="flex items-center justify-between p-6 border-b border-[#2f3456]">
          <span className="text-xl font-black tracking-wide text-[#46c8f0] uppercase">Library Admin</span>
          <Button onClick={() => setShowSidebar(false)} className="lg:hidden p-2" variant="ghost">
            <X size={22} />
          </Button>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-2 py-4">
          {navItems.map(item => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-[#b3bed7] hover:bg-[#222a43] hover:text-[#46c8f0] transition"
              onClick={() => { setShowSidebar(false); navigate(item.path); }}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen px-4 py-5 md:px-8 md:py-8 lg:ml-72">
        {/* TopBar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight leading-snug">
              Admin Dashboard
            </div>
            <div className="text-base font-light text-[#8da5cf]">
              All library controls & notifications at one place
            </div>
          </div>
          {/* Placeholder for user profile (avatar/menu) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0f2027] to-[#46c8f0] flex items-center justify-center text-xl font-bold text-white">
              A
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-gradient-to-br from-[#21243A] to-[#293054] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#46c8f0] tracking-wide">Pending</div>
            <div className="text-2xl font-bold mt-2">{stats.pending}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#29475C] to-[#5A8DEE] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#fdbb2d]">Seat Changes</div>
            <div className="text-2xl font-bold mt-2">{stats.seatChanges}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#2d5741] to-[#26D0CE] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#00ffb3]">Expiring</div>
            <div className="text-2xl font-bold mt-2">{stats.expiring}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#8f94fb] to-[#4e54c8] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#ffa9ff]">Seats</div>
            <div className="text-2xl font-bold mt-2">{stats.totalSeats}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#393e46] to-[#2e3353] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#ffa260]">Booked</div>
            <div className="text-2xl font-bold mt-2">{stats.booked}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#ffa17f] to-[#00223e] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#ffe27a]">On Hold</div>
            <div className="text-2xl font-bold mt-2">{stats.held}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#2c6975] to-[#68eacc] border-0 shadow-lg"><CardContent>
            <div className="text-xs uppercase text-[#47FFCB]">Available</div>
            <div className="text-2xl font-bold mt-2">{stats.available}</div>
          </CardContent></Card>
          <Card className="bg-gradient-to-br from-[#283e51] to-[#485563] border-0 shadow-lg"><CardContent>
            <div className="flex items-center gap-1 text-xs uppercase text-[#3dffdf]"><Fingerprint size={16}/> Biometric</div>
            <div className="text-2xl font-bold mt-2">{stats.biometric}</div>
          </CardContent></Card>
        </div>

        {/* Notification/Action Queue */}
        <section className="bg-[#232848] border border-[#28325e] rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-lg text-[#46c8f0]">🔔 Pending Actions</div>
            {/* Add refresh or other quick actions here if needed */}
          </div>
          {queue.length === 0 ? (
            <div className="text-[#B4BEE8] py-10 text-center">No pending actions. All caught up!</div>
          ) : (
            <ul className="space-y-2">
              {queue.map(item => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex justify-between items-center p-3 border border-[#28325e] rounded-lg bg-[#181d2f] hover:bg-[#22284A] cursor-pointer transition"
                  onClick={() => handleActionClick(item)}
                >
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-[#888DCB]">{new Date(item.date).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-[#46c8f0] border border-[#46c8f0] rounded-md">Go</Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};
