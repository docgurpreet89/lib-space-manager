
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SeatChangeModalProps {
  user: User;
  currentBookingId?: string;
  currentSeatId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SeatChangeModal = ({ 
  user, 
  currentBookingId, 
  currentSeatId, 
  isOpen, 
  onClose, 
  onSuccess 
}: SeatChangeModalProps) => {
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newSeatNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a seat number",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for seat change",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First, check if the seat exists and get its ID
      const { data: seatData, error: seatError } = await supabase
        .from('seats')
        .select('seat_id')
        .eq('seat_label', newSeatNumber.toUpperCase())
        .single();

      if (seatError || !seatData) {
        toast({
          title: "Error",
          description: `Seat ${newSeatNumber.toUpperCase()} not found. Please check the seat number and try again.`,
          variant: "destructive",
        });
        return;
      }

      // Check if the seat is available (not booked by someone else)
      const { data: existingBooking, error: bookingError } = await supabase
        .from('seat_bookings')
        .select('*')
        .eq('seat_id', seatData.seat_id)
        .eq('status', 'approved')
        .gte('to_time', new Date().toISOString())
        .neq('user_id', user.id);

      if (bookingError) {
        throw bookingError;
      }

      if (existingBooking && existingBooking.length > 0) {
        toast({
          title: "Error",
          description: `Seat ${newSeatNumber.toUpperCase()} is already booked by another user.`,
          variant: "destructive",
        });
        return;
      }

      // Get current user's active booking if not provided
      let bookingId = currentBookingId;
      let oldSeatId = currentSeatId;

      if (!bookingId) {
        const { data: userBooking, error: userBookingError } = await supabase
          .from('seat_bookings')
          .select('booking_id, seat_id')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .gte('to_time', new Date().toISOString())
          .single();

        if (userBookingError || !userBooking) {
          toast({
            title: "Error",
            description: "No active booking found to change seat.",
            variant: "destructive",
          });
          return;
        }

        bookingId = userBooking.booking_id;
        oldSeatId = userBooking.seat_id;
      }

      // Create seat change request
      const { error: requestError } = await supabase
        .from('seat_change_requests')
        .insert({
          booking_id: bookingId,
          old_seat_id: oldSeatId,
          new_seat_id: seatData.seat_id,
          user_id: user.id,
          reason: reason,
          status: 'pending'
        });

      if (requestError) {
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Seat change request submitted successfully. Admin will review it shortly.",
      });

      setNewSeatNumber('');
      setReason('');
      onClose();
      onSuccess?.();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit seat change request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Seat Change</DialogTitle>
          <DialogDescription>
            Enter the new seat number you'd like to change to. Make sure the seat number is correct.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="seat-number" className="text-right">
              New Seat
            </Label>
            <Input
              id="seat-number"
              value={newSeatNumber}
              onChange={(e) => setNewSeatNumber(e.target.value)}
              placeholder="e.g., A1, B5, C3"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="reason" className="text-right mt-2">
              Reason
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for the seat change..."
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
