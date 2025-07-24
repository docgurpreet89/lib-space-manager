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
    loadPendingBookings();
    loadSeatChangeRequests();
    loadExpiringMembers();
    const interval = setInterval(cleanupExpiredHolds, 60000); // cleanup every 1 min
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
        expiring: 0,
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
      setPendingBookings(data || []);
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

      await supabase.from('seat_bookings').insert({
        name: holdData.name,
        amount: holdData.amount,
        status: 'approved'
      });

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
          await supabase.from('seat_bookings').insert({
            name: hold.name,
            amount: hold.amount,
            status: 'cancelled'
          });
          await supabase.from('seat_holds').delete().eq('id', hold.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired holds:', error.message);
    }
  };

  const filteredBookings = pendingBookings.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    // ... JSX remains unchanged ...
  );
};
