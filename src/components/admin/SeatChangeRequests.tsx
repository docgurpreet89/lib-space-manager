
import { useState, useEffect } from 'react';
import { supabase, SeatChangeRequest } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const SeatChangeRequests = () => {
  const [requests, setRequests] = useState<SeatChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSeatChangeRequests();
  }, []);

  const fetchSeatChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_change_requests')
        .select(`
          *,
          old_seat:seats!seat_change_requests_old_seat_id_fkey (seat_label),
          new_seat:seats!seat_change_requests_new_seat_id_fkey (seat_label),
          seat_bookings (user_name, user_email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load seat change requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .rpc('approve_seat_change', { p_request_id: requestId });

      if (error) throw error;

      toast({
        title: "Seat Change Approved",
        description: "The seat change request has been approved.",
      });

      fetchSeatChangeRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('seat_change_requests')
        .update({ status: 'cancelled' })
        .eq('request_id', requestId);

      if (error) throw error;

      toast({
        title: "Seat Change Cancelled",
        description: "The seat change request has been cancelled.",
      });

      fetchSeatChangeRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seat Change Requests</CardTitle>
        <CardDescription>
          Review and process seat change requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending seat change requests.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.request_id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Change from Seat {(request as any).old_seat?.seat_label} to Seat {(request as any).new_seat?.seat_label}
                    </h3>
                    <p className="text-gray-600">
                      Requested: {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Pending
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">User:</span> {(request as any).seat_bookings?.user_name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {(request as any).seat_bookings?.user_email}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApprove(request.request_id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Change
                  </Button>
                  <Button
                    onClick={() => handleCancel(request.request_id)}
                    variant="destructive"
                  >
                    Cancel Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
