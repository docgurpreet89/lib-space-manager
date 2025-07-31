import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Repeat, FileText, Bell, IdCard, LogOut, Lock } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';

const PendingBookings = () => {
  const navigate = useNavigate();
  const [userRoleChecked, setUserRoleChecked] = useState(false);

  // Booking data
  const [pending, setPending] = useState<any[]>([]);
  const [seatMap, setSeatMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [form, setForm] = useState({ amount: '', receipt: null as File | null, remarks: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Password modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Admin guard
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return navigate('/');
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (error || data?.role !== 'admin') return navigate('/');
      setUserRoleChecked(true);
    })();
  }, [navigate]);

  // Load bookings once admin validated
  useEffect(() => {
    if (!userRoleChecked) return;
    loadPending();
    loadSeatMap();
  }, [userRoleChecked]);

  const loadPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('seat_bookings')
      .select('*')
      .eq('status', 'pending');
    setPending(data || []);
    setLoading(false);
  };

  const loadSeatMap = async () => {
    const { data, error } = await supabase.from('seats').select('seat_id, seat_label');
    if (!error && data) {
      const map: Record<string, string> = {};
      data.forEach((s) => (map[s.seat_id] = s.seat_label));
      setSeatMap(map);
    }
  };

  const openApproveModal = (b: any) => {
    setEditBooking(b);
    setForm({ amount: b.price || '', receipt: null, remarks: '' });
    setModalType('approve');
  };

  const openRejectModal = (b: any) => {
    setEditBooking(b);
    setRejectReason('');
    setModalType('reject');
  };

  const handleApprove = async () => {
    setModalLoading(true);
    // upload receipt if exists
    let receiptUrl = editBooking.receipt_url || null;
    if (form.receipt) {
      const file = form.receipt;
      const ext = file.name.split('.').pop();
      const path = `receipts/${editBooking.booking_id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, file);
      if (!upErr) {
        const { data: pu } = supabase.storage.from('receipts').getPublicUrl(path);
        receiptUrl = pu.publicUrl;
      }
    }

    // update booking CONSTRAINT seat_bookings_status ='pending', 'approved', 'rejected'
     await supabase.from("seat_bookings").update({
      price: form.amount,      
      status: "approved",
    }).eq("booking_id", editBooking.booking_id);

    await supabase.from("transactions").insert({
      booking_id: editBooking.booking_id,
      user_id: editBooking.user_id,      
      remarks: form.remarks,
      amount: form.amount,
      status: "success",
      receipt_url: receiptUrl,
      created_at: new Date().toISOString(),
    });

    setModalLoading(false);
    closeModal();
    await loadPending();
  };

  const handleReject = async () => {
    setModalLoading(true);
    // mark booking rejected
    await supabase
      .from('seat_bookings')
      .update({ status: 'rejected' })
      .eq('booking_id', editBooking.booking_id);


    
    // record failed transaction status ='success', 'failure'
    await supabase
      .from('transactions')
      .insert({
        booking_id: editBooking.booking_id,
        user_id: editBooking.user_id,      
        remarks: rejectReason || null,
        amount: editBooking.price,
        status: 'failure',
        receipt_url: null,
        created_at: new Date().toISOString(),
      });

    setModalLoading(false);
    closeModal();
    await loadPending();
  };

  const closeModal = () => {
    setModalType(null);
    setEditBooking(null);
    setForm({ amount: '', receipt: null, remarks: '' });
    setRejectReason('');
    setModalLoading(false);
  };

  const filtered = pending.filter((p) => p.user_name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordError(error.message);
    else { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }
  };

  if (!userRoleChecked) return <div className="p-6 text-center">Checking access...</div>;

  const navItems = [
    
    { label: 'Pending Bookings', icon: ClipboardList, path: '/admin/pending-bookings' },
    { label: 'Seat Change Requests', icon: Repeat, path: '/admin/seat-changes' },
    { label: 'All Transactions', icon: FileText, path: '/admin/all-transactions' },
    { label: 'Notice Management', icon: Bell, path: '/admin/notices' },
    { label: 'Expiring Memberships', icon: FileText, path: '/admin/expiring-memberships' },
    { label: 'Biometric Enrollments', icon: IdCard, path: '/admin/biometrics' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-blue-800 text-white p-4 space-y-2">
        <div className="text-2xl font-bold mb-4">Admin Panel</div>
        {navItems.map((item) => (
          <div key={`${item.label}-${item.path}`} className="flex items-center p-2 rounded hover:bg-blue-700 cursor-pointer" onClick={() => navigate(item.path)}>
            <item.icon className="w-4 h-4 mr-2" /> {item.label}
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
            <Input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mb-2" />
            <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mb-2" />
            {passwordError && <p className="text-red-500 text-sm mb-2">{passwordError}</p>}
            <Button onClick={handleChangePassword}>Update Password</Button>
          </DialogContent>
        </Dialog>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Pending Bookings</h1>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => navigate('/admin')}>Admin Dashboard</Button>
            <Input placeholder="Search by user name" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          </div>
        </div>

        <Card className="border border-gray-300 rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Amount</th>
                  <th className="text-left py-2 px-3">Seat</th>
                  <th className="text-left py-2 px-3">Created At</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">Loading...</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">No pending bookings.</td>
                  </tr>
                ) : (
                  paginated.map((booking, index) => (
                    <tr key={booking.booking_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <td className="py-2 px-3">{booking.user_name}</td>
                      <td className="py-2 px-3">₹{booking.price}</td>
                      <td className="py-2 px-3">{seatMap[booking.seat_id] || booking.seat_id}</td>
                      <td className="py-2 px-3">{new Date(booking.created_at).toLocaleString()}</td>
                      <td className="py-2 px-3 space-x-2">
                        <Button size="sm" onClick={() => openApproveModal(booking)}>Approve</Button>
                        <Button size="sm" className="bg-red-100 text-red-700 hover:bg-red-200" onClick={() => openRejectModal(booking)}>Reject</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex justify-between items-center px-4 py-3">
              <Button size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-600">Page {currentPage}</span>
              <Button size="sm" disabled={currentPage * itemsPerPage >= filtered.length} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </CardContent>
        </Card>

        {modalType && editBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">{modalType === 'approve' ? 'Approve Booking' : 'Reject Booking'}</h2>
              {modalType === 'approve' ? (
                <>
                  <div><label className="block text-sm font-medium">User Name</label><div className="p-2 bg-gray-100 rounded text-sm">{editBooking.user_name}</div></div>
                  <div><label className="block text-sm font-medium">Email</label><div className="p-2 bg-gray-100 rounded text-sm">{editBooking.user_email}</div></div>
                  <Input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mb-2" />
                  <Input placeholder="Remarks (optional)" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="mb-2" />
                  <Input type="file" accept="image/*,application/pdf" onChange={e => setForm({ ...form, receipt: e.target.files![0] })} className="mb-4" />
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleApprove} disabled={modalLoading}>{modalLoading ? 'Approving...' : 'Approve & Save'}</Button>
                    <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <Input placeholder="Reason for rejection" value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="mb-4" />
                  <div className="flex justify-end gap-2">
                    <Button className="bg-red-100 text-red-700 hover:bg-red-200" onClick={handleReject} disabled={modalLoading}>{modalLoading ? 'Rejecting...' : 'Reject'}</Button>
                    <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PendingBookings;
