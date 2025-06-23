import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Repeat, Users, FileText, Bell, Fingerprint, IdCard } from 'lucide-react';

export const AdminDashboard = () => {
  const [dummyBookings, setDummyBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingBooking, setEditingBooking] = useState(null);
  const itemsPerPage = 5;

  const [stats, setStats] = useState({
    pending: 2,
    seatChanges: 1,
    expiring: 3,
    totalSeats: 50,
    booked: 20,
    held: 5,
    available: 25,
    biometric: 10
  });

  useEffect(() => {
    loadDummyBookings();
  }, []);

  const loadDummyBookings = () => {
    setDummyBookings([
      { id: 1, name: 'John Doe', amount: 500, date: '2025-06-23', validity: '30 days', status: 'pending' },
      { id: 2, name: 'Jane Smith', amount: 750, date: '2025-06-22', validity: '60 days', status: 'pending' }
    ]);
  };

  const handleApproveClick = (booking) => setEditingBooking({ ...booking, biometricCard: booking.biometricCard || '' });

  const handleApproveSubmit = async () => {
    const updated = { ...editingBooking, status: 'approved' };
    setDummyBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    await supabase.from('approved_transactions').insert({
      booking_id: updated.id,
      name: updated.name,
      amount: updated.amount,
      date: updated.date,
      validity: updated.validity,
      biometric_card: updated.biometricCard
    });
    setEditingBooking(null);
  };

  const handleReject = (id) => {
    setDummyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
  };

  const filteredBookings = dummyBookings.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-blue-800 text-white p-4 space-y-2">
        <div className="text-2xl font-bold mb-4">Admin</div>
        {[{ label: 'Pending Bookings', icon: ClipboardList }, { label: 'Seat Change Requests', icon: Repeat }, { label: 'All Users', icon: Users }, { label: 'All Transactions', icon: FileText }, { label: 'Notice Management', icon: Bell }, { label: 'Expiring Memberships', icon: FileText }, { label: 'Biometric Enrollments', icon: IdCard }].map(item => (
          <div key={item.label} className="flex items-center p-2 rounded hover:bg-blue-700 cursor-pointer">
            <item.icon className="w-4 h-4 mr-2" /> {item.label}
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Statistics cards (same as before) */}
        </div>
        <Card className="p-6 shadow bg-white">
          <CardContent>
            <div className="flex justify-between mb-2">
              <div className="font-bold">Booking Management</div>
              <Input placeholder="Search by name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64" />
            </div>
            <table className="min-w-full bg-white rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2 text-left text-xs font-bold">S/N</th>
                  <th className="p-2 text-left text-xs font-bold">Name</th>
                  <th className="p-2 text-left text-xs font-bold">Amount</th>
                  <th className="p-2 text-left text-xs font-bold">Date</th>
                  <th className="p-2 text-left text-xs font-bold">Validity</th>
                  <th className="p-2 text-left text-xs font-bold">Status</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b, index) => (
                  <tr key={b.id} className="border-b">
                    <td className="p-2 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-2 text-xs">{b.name}</td>
                    <td className="p-2 text-xs">₹{b.amount}</td>
                    <td className="p-2 text-xs">{b.date}</td>
                    <td className="p-2 text-xs">{b.validity}</td>
                    <td className="p-2 text-xs">{b.status}</td>
                    <td className="p-2 text-xs space-x-1">
                      {b.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleApproveClick(b)}>Approve</Button>
                          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleReject(b.id)}>Reject</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-2">
              <Button size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <span className="text-xs text-gray-500">Page {currentPage}</span>
              <Button size="sm" disabled={currentPage * itemsPerPage >= filteredBookings.length} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </CardContent>
        </Card>
          {editingBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg space-y-2 w-full max-w-md">
              <div className="font-bold mb-2">Edit Booking</div>
              <Input value={editingBooking.name} onChange={e => setEditingBooking({ ...editingBooking, name: e.target.value })} placeholder="Name" />
              <Input type="number" value={editingBooking.amount} onChange={e => setEditingBooking({ ...editingBooking, amount: +e.target.value })} placeholder="Amount" />
              <Input type="date" value={editingBooking.date} onChange={e => setEditingBooking({ ...editingBooking, date: e.target.value })} />
              <Input value={editingBooking.validity} onChange={e => setEditingBooking({ ...editingBooking, validity: e.target.value })} placeholder="Validity" />
              <Input placeholder="Biometric Card Number" value={editingBooking.biometricCard} onChange={e => setEditingBooking({ ...editingBooking, biometricCard: e.target.value })} />
              <Input type="file" onChange={e => setEditingBooking({ ...editingBooking, proof: e.target.files[0] })} />
              <div className="flex gap-2 mt-2">
                <Button onClick={handleSaveSubmit}>Save</Button>
                <Button variant="destructive" onClick={() => setEditingBooking(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
