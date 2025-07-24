import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const AdminDashboard = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [seatChangeCount, setSeatChangeCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [seatStats, setSeatStats] = useState({ total: 0, booked: 0, held: 0, available: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: pending } = await supabase
        .from('seat_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: changes } = await supabase
        .from('seat_change_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: expiring } = await supabase
        .rpc('get_soon_expiring_memberships', {}, { count: 'exact', head: true });

      const { data: seats } = await supabase.from('seats').select('seat_id');
      const { data: booked } = await supabase
        .from('seat_bookings')
        .select('seat_id')
        .eq('status', 'approved');
      const { data: held } = await supabase
        .from('seat_holds')
        .select('seat_id')
        .gte('lock_expiry', new Date().toISOString());

      setPendingCount(pending || 0);
      setSeatChangeCount(changes || 0);
      setExpiringCount(expiring || 0);
      setSeatStats({
        total: seats?.length || 0,
        booked: booked?.length || 0,
        held: held?.length || 0,
        available: (seats?.length || 0) - (booked?.length || 0) - (held?.length || 0),
      });
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const cardStyle = "cursor-pointer p-4 rounded-lg shadow-sm bg-white hover:bg-blue-50 border border-blue-100 transition";

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className={cardStyle} onClick={() => navigate('/admin/pending-bookings')}>
          <CardContent>
            <div className="text-sm text-gray-600">Pending Bookings</div>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className={cardStyle} onClick={() => navigate('/admin/seat-changes')}>
          <CardContent>
            <div className="text-sm text-gray-600">Seat Change Requests</div>
            <div className="text-2xl font-bold text-blue-600">{seatChangeCount}</div>
          </CardContent>
        </Card>

        <Card className={cardStyle} onClick={() => navigate('/admin/users')}>
          <CardContent>
            <div className="text-sm text-gray-600">All Users</div>
          </CardContent>
        </Card>

        <Card className={cardStyle} onClick={() => navigate('/admin/transactions')}>
          <CardContent>
            <div className="text-sm text-gray-600">All Transactions</div>
          </CardContent>
        </Card>

        <Card className={cardStyle} onClick={() => navigate('/admin/notices')}>
          <CardContent>
            <div className="text-sm text-gray-600">Notice Management</div>
          </CardContent>
        </Card>

        <Card className={cardStyle + " bg-blue-600 text-white hover:bg-blue-700"} onClick={() => navigate('/admin/expiring-memberships')}>
          <CardContent>
            <div className="text-sm">Expiring Memberships</div>
            <div className="text-2xl font-bold">{expiringCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <Card className={cardStyle}>
          <CardContent>
            <div className="text-sm text-gray-600">Total Seats</div>
            <div className="text-xl font-bold text-blue-600">{seatStats.total}</div>
          </CardContent>
        </Card>
        <Card className={cardStyle}>
          <CardContent>
            <div className="text-sm text-gray-600">Booked Seats</div>
            <div className="text-xl font-bold text-red-500">{seatStats.booked}</div>
          </CardContent>
        </Card>
        <Card className={cardStyle}>
          <CardContent>
            <div className="text-sm text-gray-600">On Hold</div>
            <div className="text-xl font-bold text-yellow-500">{seatStats.held}</div>
          </CardContent>
        </Card>
        <Card className={cardStyle}>
          <CardContent>
            <div className="text-sm text-gray-600">Available Seats</div>
            <div className="text-xl font-bold text-green-500">{seatStats.available}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card className={cardStyle} onClick={() => navigate('/admin/transactions?status=pending')}>
          <CardContent>
            <div className="text-sm text-gray-600">Transactions to Approve</div>
            <div className="text-lg font-bold text-blue-600">View Details</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
