import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Repeat, Users, FileText, Bell, Fingerprint, IdCard, LogOut, Lock } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  // Admin role validation
  const [userRoleChecked, setUserRoleChecked] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [seatChangeRequests, setSeatChangeRequests] = useState<any[]>([]);
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [seatMap, setSeatMap] = useState<Record<string,string>>({});

  // Password modal states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Statistics
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

  // Colors for rotating pending action cards
  const cardColors = [
    'bg-red-100', 'bg-yellow-100', 'bg-green-100',
    'bg-blue-100', 'bg-indigo-100', 'bg-purple-100',
    'bg-pink-100', 'bg-orange-100', 'bg-teal-100'
  ];

  // Check admin role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        navigate('/');
        return;
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (error || data?.role !== 'admin') {
        navigate('/');
        return;
      }
      setUserRole(data.role);
      setUserRoleChecked(true);
    };
    checkUserRole();
  }, [navigate]);

  // Load data after admin validated
  useEffect(() => {
    if (!userRoleChecked) return;
    loadBookings();
    loadSeatChangeRequests();
    loadExpiringMembers();
    loadSeatMap();
    loadStats();
  }, [userRoleChecked]);

  // Data loader functions
  const loadBookings = async () => {
    const { data, error } = await supabase.from('seat_bookings').select('*');
    if (!error) setBookings(data || []);
  };
  const loadSeatChangeRequests = async () => {
    const { data, error } = await supabase.from('seat_change_requests').select('*').eq('status','pending');
    if (!error) setSeatChangeRequests(data || []);
  };
  const loadExpiringMembers = async () => {
    const { data, error } = await supabase.rpc('get_soon_expiring_memberships');
    if (!error) setExpiringMembers(data || []);
  };
  const loadSeatMap = async () => {
    const { data, error } = await supabase.from('seats').select('seat_id, seat_label');
    if (!error && data) {
      const map: Record<string,string> = {};
      data.forEach(s => map[s.seat_id] = s.seat_label);
      setSeatMap(map);
    }
  };
  const loadStats = async () => {
    const { count: pending } = await supabase.from('seat_bookings').select('*',{count:'exact',head:true}).eq('status','pending');
    const { count: seatChanges } = await supabase.from('seat_change_requests').select('*',{count:'exact',head:true}).eq('status','pending');
    const { data: seats } = await supabase.from('seats').select('seat_id');
    const { count: booked } = await supabase.from('seat_bookings').select('*',{count:'exact',head:true}).eq('status','approved');
    const { data: held } = await supabase.from('seat_holds').select('seat_id');
    const { count: biometric } = await supabase.from('biometric_cards').select('*',{count:'exact',head:true});
    setStats({
      pending: pending||0,
      seatChanges: seatChanges||0,
      expiring: expiringMembers.length,
      totalSeats: seats?.length||0,
      booked: booked||0,
      held: held?.length||0,
      available: (seats?.length||0)-(booked||0)-(held?.length||0),
      biometric: biometric||0
    });
  };

  // Build pending actions queue
  const [queue, setQueue] = useState<any[]>([]);
  useEffect(() => {
    if (!userRoleChecked) return;
    const merged = [
      ...bookings.filter(b=>b.status==='pending').map(b=>({
        id:b.booking_id, type:'booking',
        label:`New seat request by ${b.user_email} for seat #${seatMap[b.seat_id]||b.seat_id}`,
        date:b.from_time||b.created_at
      })),
      ...seatChangeRequests.map(r=>({ id:r.id, type:'seat_change', label:`Seat Change Request: ${r.user_name}`, date:r.created_at })),
      ...expiringMembers.map(m=>({ id:m.id||m.user_id, type:'expiry', label:`Expiring Membership: ${m.name}`, date:m.valid_till }))
    ];
    setQueue(merged);
  },[bookings,seatChangeRequests,expiringMembers,seatMap,userRoleChecked]);

  const handleActionClick = (item:any) => {
    if(item.type==='booking') navigate('/admin/pending-bookings');
    if(item.type==='seat_change') navigate('/admin/seat-changes');
    if(item.type==='expiry') navigate('/admin/expiring-memberships');
    setQueue(q=>q.filter(i=>i.id!==item.id));
  };

  // Logout & change password
  const handleLogout = async()=>{ await supabase.auth.signOut(); navigate('/'); };
  const handleChangePassword = async()=>{
    if(newPassword!==confirmPassword){ setPasswordError("New passwords do not match."); return; }
    const { error } = await supabase.auth.updateUser({ password:newPassword });
    if(error) setPasswordError(error.message);
    else{ setShowChangePassword(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }
  };

  if(!userRoleChecked) {
    return <div className="p-6 text-center text-gray-600">Checking access...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white p-4 space-y-2">
        <div className="text-2xl font-bold mb-4">Admin</div>
        {[{label:'Pending Bookings',icon:ClipboardList},{label:'Seat Change Requests',icon:Repeat},{label:'All Users',icon:Users},{label:'All Transactions',icon:FileText},{label:'Notice Management',icon:Bell},{label:'Expiring Memberships',icon:FileText},{label:'Biometric Enrollments',icon:IdCard}].map(item=> (
          <div key={item.label} className="flex items-center p-2 rounded hover:bg-blue-700 cursor-pointer" onClick={()=>navigate(`/admin/${item.label.toLowerCase().replace(/ /g,'-')}`)}>
            <item.icon className="w-4 h-4 mr-2" />{item.label}
          </div>
        ))}
        <hr className="border-t border-blue-600 my-2" />
        <div className="flex items-center p-2 rounded hover:bg-red-700 cursor-pointer" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </div>
        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <DialogTrigger asChild>
            <div className="flex items-center p-2 rounded hover:bg-yellow-700 cursor-pointer">
              <Lock className="w-4 h-4 mr-2" /> Change Password
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Change Password</DialogTitle>
            <Input type="password" placeholder="Old Password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="mb-2" />
            <Input type="password" placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mb-2" />
            <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="mb-2" />
            {passwordError && <p className="text-red-500 text-sm mb-2">{passwordError}</p>}
            <Button onClick={handleChangePassword}>Update Password</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-pink-100 p-4 cursor-pointer hover:shadow-lg hover:bg-pink-200" onClick={()=>navigate('/admin/pending-bookings')}><CardContent><div>Pending Bookings</div><div className="text-xl font-bold">{stats.pending}</div></CardContent></Card>
          <Card className="bg-blue-100 p-4"><CardContent><div>Seat Changes</div><div className="text-xl font-bold">{stats.seatChanges}</div></CardContent></Card>
          <Card className="bg-green-100 p-4"><CardContent><div>Expiring Memberships</div><div className="text-xl font-bold">{stats.expiring}</div></CardContent></Card>
          <Card className="bg-yellow-100 p-4"><CardContent><div>Total Seats</div><div className="text-xl font-bold">{stats.totalSeats}</div></CardContent></Card>
          <Card className="bg-purple-100 p-4"><CardContent><div>Booked</div><div className="text-xl font-bold">{stats.booked}</div></CardContent></Card>
          <Card className="bg-orange-100 p-4"><CardContent><div>On Hold</div><div className="text-xl font-bold">{stats.held}</div></CardContent></Card>
          <Card className="bg-teal-100 p-4"><CardContent><div>Available</div><div className="text-xl font-bold">{stats.available}</div></CardContent></Card>
          <Card className="bg-indigo-100 p-4"><CardContent><div className="flex items-center"><Fingerprint className="w-4 h-4 mr-1"/> Biometric Issued</div><div className="text-xl font-bold">{stats.biometric}</div></CardContent></Card>
        </div>
        {/* Pending Actions */}
        <Card className="p-6 bg-white shadow">
          <CardContent>
            <div className="font-bold text-lg mb-3">🔔 Pending Actions</div>
            <div className="flex flex-col gap-2">
              {queue.length===0 ? (
                <div className="text-gray-500">No pending actions. All caught up!</div>
              ) : (
                queue.map((item,idx)=>(
                  <div key={item.id||idx} className={`w-full p-4 rounded-xl shadow flex items-center justify-between ${cardColors[idx%cardColors.length]}`}>
                    <div>
                      <div className="font-semibold mb-1">{item.label}</div>
                      <div className="text-xs text-gray-600 mb-2">{new Date(item.date).toLocaleString()}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={()=>handleActionClick(item)}>Go</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
