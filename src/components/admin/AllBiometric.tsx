// src/components/pages/admin/AllBiometric.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  ClipboardList,
  Repeat,
  Users,
  FileText,
  Bell,
  IdCard,
  LogOut,
  ArrowLeft,
  Search,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import dayjs from 'dayjs';

const ID_RANGE = Array.from({ length: 60 }, (_, i) => i + 1);

const AllBiometric = () => {
  const navigate = useNavigate();
  const [userRoleChecked, setUserRoleChecked] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal state
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ biometric_id: '', biometric_issued: false });
  const [modalLoading, setModalLoading] = useState(false);

  // Admin guard + initial fetch
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
      fetchData();
    })();
  }, [navigate]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    const { data: recs } = await supabase
      .from('seat_bookings')
      .select(
        'booking_id, user_name, user_email, user_phone, biometric_id, biometric_issued, from_time, to_time'
      );
      
    const all = recs || [];
    setNewUsers(all.filter(r => !r.biometric_id));
    setRecords(all.filter(r => !!r.biometric_id));
    setLoading(false);
  };

  // Open edit modal
  const openEdit = (rec: any) => {
    setEditing(rec);
    setForm({ biometric_id: rec.biometric_id || '', biometric_issued: rec.biometric_issued });
  };

  // Close modal
  const closeModal = () => {
    setEditing(null);
    setModalLoading(false);
  };

  // // Save changes
  // const saveEdit = async () => {
  //   if (!editing) return;
  //   setModalLoading(true);
  //   await supabase
  //     .from('seat_bookings')
  //     .update(form)
  //     .eq('booking_id', editing.booking_id);
  //   setModalLoading(false);
  //   closeModal();
  //   fetchData();
  // };

  // Save changes (including issuing toggle logic)
  const saveEdit = async () => {
    if (!editing) return;
    setModalLoading(true);
    // Prepare update object
    const updates: any = {
      biometric_issued: form.biometric_issued,
      biometric_id: form.biometric_issued ? form.biometric_id : 0,
    };
    if (!form.biometric_issued) {
      updates.status = 'expired';
    }
    await supabase
      .from('seat_bookings')
      .update(updates)
      .eq('booking_id', editing.booking_id);
    setModalLoading(false);
    closeModal();
    fetchData();
  };



  if (!userRoleChecked) return <div className="p-6 text-center">Checking access...</div>;

  // Navigation items
  const navItems = [
    { label: 'Admin Home', icon: FileText, path: '/admin' },
    { label: 'Pending Bookings', icon: ClipboardList, path: '/admin/pending-bookings' },
    { label: 'Seat Change Requests', icon: Repeat, path: '/admin/seat-changes' },
    { label: 'All Users', icon: Users, path: '/admin/all-users' },
    { label: 'All Transactions', icon: FileText, path: '/admin/all-transactions' },
    { label: 'Notice Management', icon: Bell, path: '/admin/notices' },
    { label: 'Expiring Memberships', icon: FileText, path: '/admin/expiring-memberships' },
    { label: 'Biometric Management', icon: IdCard, path: '/admin/biometrics' },
  ];

  // Prepare ID grid
  const assigned = records.map(r => Number(r.biometric_id)).filter(Boolean);
  const idGrid = ID_RANGE.map(id => ({ id, taken: assigned.includes(id) }));

  // Filter and paginate enrolled
  const filtered = records.filter(r =>
    [r.user_name, r.user_email, r.user_phone, r.biometric_id]
      .some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((currentPage - 1) * perPage, (currentPage - 1) * perPage + perPage);

  return (


    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-blue-800 text-white p-4 space-y-2">
        <div className="text-2xl font-bold mb-4">Admin Panel</div>
        {navItems.map(item => (
          <div
            key={item.label}
            className="flex items-center p-2 rounded hover:bg-blue-700 cursor-pointer"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="w-4 h-4 mr-2" /> {item.label}
          </div>
        ))}
        <hr className="border-t border-blue-600 my-2" />
        <div
          className="flex items-center p-2 rounded hover:bg-red-700 cursor-pointer"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/');
          }}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </div>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Homepage
          </Button>
        </div>

        {/* Biometric Status */}
        <Card>
          <CardHeader>
            <CardTitle>Biometric Status</CardTitle>
            <CardDescription>IDs 1–60 (green=available, red=assigned)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {idGrid.map(({ id, taken }) => (
                <div
                  key={id}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    taken ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                  }`}
                  title={taken ? 'Assigned' : 'Available'}
                >
                  {id}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New Users */}
        <Card>
          <CardHeader>
            <CardTitle>New Users</CardTitle>
            <CardDescription>Approved bookings without biometric</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No new users
                    </TableCell>
                  </TableRow>
                ) : (
                  newUsers.map(n => (
                    <TableRow key={n.booking_id}>
                      <TableCell>{n.booking_id}</TableCell>
                      <TableCell>{n.user_name}</TableCell>
                      <TableCell>{n.user_email}</TableCell>
                      <TableCell>{n.user_phone}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => openEdit(n)}>
                          <Edit3 className="w-4 h-4" /> Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Enrolled Biometrics */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Biometrics</CardTitle>
            <CardDescription>Manage biometric assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-8 w-64"
                  placeholder="Search enrolled..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Biometric ID</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : pageData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        No enrolled records
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageData.map(r => {
                      const daysLeft = dayjs(r.to_time).diff(dayjs(), 'day');
                      const expired = daysLeft < 0 && r.biometric_issued;
                      return (
                        <TableRow key={r.booking_id} className={expired ? 'bg-red-100' : ''}>
                          <TableCell>{r.booking_id}</TableCell>
                          <TableCell>{r.user_name}</TableCell>
                          <TableCell>{r.user_email}</TableCell>
                          <TableCell>{r.user_phone}</TableCell>
                          <TableCell>{r.biometric_id}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                r.biometric_issued
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {r.biometric_issued ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>{dayjs(r.from_time).format('YYYY-MM-DD')}</TableCell>
                          <TableCell>{daysLeft >= 0 ? daysLeft : 'Expired'}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {editing && (
          <Dialog open onOpenChange={open => !open && closeModal()}>
            <DialogContent className="max-w-md">
              <DialogTitle>Edit Biometric</DialogTitle>
              <div className="space-y-4 mt-4">
                <div>
                  <strong>Booking:</strong> {editing.booking_id}
                </div>
                <Input
                  label="Biometric ID"
                  value={form.biometric_id}
                  onChange={e => setForm({ ...form, biometric_id: e.target.value })}
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.biometric_issued}
                    onChange={e => setForm({ ...form, biometric_issued: e.target.checked })}
                  />
                <span>Issued?</span>

                </label>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={closeModal}>
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                  <Button onClick={saveEdit} disabled={modalLoading}>
                    <Save className="w-4 h-4" /> Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default AllBiometric;
