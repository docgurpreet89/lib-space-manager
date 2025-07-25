import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardList, Repeat, Users, FileText, Bell,
  Fingerprint, IdCard, Menu, X
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
    pending: 0, seatChanges: 0, expiring: 0,
    totalSeats: 0, booked: 0, held: 0, available: 0, biometric: 0
  });

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
      pending: pending || 0, seatChanges: seatChanges || 0,
      expiring: expiringMembers.length,
      totalSeats: seats?.length || 0, booked: booked || 0,
      held: held?.length || 0,
      available: (seats?.length || 0) - (booked || 0) - (held?.length || 0),
      biometric: biometric || 0
    });
  };

  useEffect(() => {
    const merged = [
      ...bookings.filter(b => b.status === 'pending').map(b => ({
        id: b.id, type: 'booking',
        label: `New seat request by ${b.user_email} for seat number ${seatMap[b.seat_id] || b.seat_id}`,
        date: b.from_time || b.created_at
      })),
      ...seatChangeRequests.map(r => ({
        id: r.id, type: 'seat_change',
        label: `Seat Change Request: ${r.user_name}`,
        date: r.created_at
      })),
      ...expiringMembers.map(m => ({
        id: m.id || m.user_id, type: 'expiry',
        label: `Expiring Membership: ${m.name}`, date: m.valid_till
      }))
    ];
    setQueue(merged);
  }, [bookings, seatChangeRequests, expiringMembers, seatMap]);

  const navItems = [
    { label: 'Pending Bookings', icon: ClipboardList, onClick: () => navigate('/admin/pending-bookings') },
    { label: 'Seat Change Requests', icon: Repeat, onClick: () => navigate('/admin/seat-changes') },
    { label: 'All Users', icon: Users, onClick: () => navigate('/admin/users') },
    { label: 'All Transactions', icon: FileText, onClick: () => navigate('/admin/transactions') },
    { label: 'Notice Management', icon: Bell, onClick: () => navigate('/admin/notices') },
    { label: 'Expiring Memberships', icon: FileText, onClick: () => navigate('/admin/expiring-memberships') },
    { label: 'Biometric Enrollments', icon: IdCard, onClick: () => navigate('/admin/biometric') }
  ];

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
    <div className="min-h-screen flex bg-white">
      {/* Sidebar FULL HEIGHT */}
      <div className={`
        flex flex-col w-72 bg-blue-800 text-white
        fixed top-0 left-0 h-screen z-40
        border-r border-blue-900
        transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        <div className="p-6 border-b border-blue-900 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-wide">Admin Panel</h2>
          <Button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-blue-900 rounded-lg"
            variant="ghost"
          >
            <X size={20} />
          </Button>
        </div>
        <nav className="flex-1 flex flex-col py-4">
          {navItems.map(item => (
            <div
              key={item.label}
              onClick={item.onClick}
              className="flex items-center gap-3 px-6 py-3 font-medium text-base cursor-pointer hover:bg-blue-900 transition-colors"
            >
              <item.icon size={22} className="mr-2" />
              {item.label}
            </div>
          ))}
          {/* Extra space to push nav to full height */}
          <div className="flex-1" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6">
          <Button
            onClick={() => setShowSidebar(true)}
            className="bg-blue-800 text-white p-3"
          >
            <Menu size={20} />
          </Button>
        </div>

        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Admin Dashboard
            </h2>
            <p className="text-gray-600">
              Manage bookings, seat changes, and library settings
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            <Card className="rounded-none bg-blue-600 text-white p-6 border border-white"><CardContent>
              <div>Pending Bookings</div>
              <div className="text-2xl font-extrabold">{stats.pending}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-red-600 text-white p-6 border border-white"><CardContent>
              <div>Seat Changes</div>
              <div className="text-2xl font-extrabold">{stats.seatChanges}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-emerald-600 text-white p-6 border border-white"><CardContent>
              <div>Expiring Memberships</div>
              <div className="text-2xl font-extrabold">{stats.expiring}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-amber-500 text-white p-6 border border-white"><CardContent>
              <div>Total Seats</div>
              <div className="text-2xl font-extrabold">{stats.totalSeats}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-violet-700 text-white p-6 border border-white"><CardContent>
              <div>Booked</div>
              <div className="text-2xl font-extrabold">{stats.booked}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-orange-600 text-white p-6 border border-white"><CardContent>
              <div>On Hold</div>
              <div className="text-2xl font-extrabold">{stats.held}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-cyan-600 text-white p-6 border border-white"><CardContent>
              <div>Available</div>
              <div className="text-2xl font-extrabold">{stats.available}</div>
            </CardContent></Card>
            <Card className="rounded-none bg-slate-900 text-white p-6 border border-white"><CardContent>
              <div className="flex items-center"><Fingerprint className="w-5 h-5 mr-1" /> Biometric Issued</div>
              <div className="text-2xl font-extrabold">{stats.biometric}</div>
            </CardContent></Card>
          </div>

          {/* Notification Queue */}
          {/* Metro Style Pending Actions */}
          <br>
          </br>
          <br>
          </br><br>
          </br>
            <div className="mt-0 mb-0 bg-[#000000] rounded-none shadow-none p-0 border-t-0 w-full">
              <div className="text-white tracking-widest text-lg font-bold px-6 py-4 border-b border-white select-none" style={{letterSpacing: 2}}>
                PENDING ACTIONS
              </div>
              <div className="divide-y divide-white/30">
                {queue.length === 0 ? (
                  <div className="text-white text-center py-8 font-medium opacity-80">
                    No pending actions.<br/>ALL CAUGHT UP!
                  </div>
                ) : (
                  queue.map(item => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center px-6 py-5 bg-[#1e3a8a] hover:bg-[#172554] cursor-pointer transition-colors group"
                      onClick={() => handleActionClick(item)}
                      style={{minHeight: '64px'}}
                    >
                      {/* Left Accent Bar */}
                      <div className="w-2 h-10 bg-[#38bdf8] mr-4 rounded"></div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-base leading-tight group-hover:underline" style={{fontSize:18}}>
                          {item.label}
                        </div>
                        <div className="text-xs text-[#93c5fd] mt-1 uppercase tracking-wide font-mono">
                          {new Date(item.date).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ml-4 rounded-none font-bold bg-[#38bdf8] text-[#1e3a8a] hover:bg-[#0ea5e9] hover:text-white px-5 py-2 uppercase tracking-wider"
                        variant="ghost"
                      >
                        GO
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};
