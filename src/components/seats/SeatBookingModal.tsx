
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Seat } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface SeatBookingModalProps {
  seat: Seat;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const SeatBookingModal = ({ seat, user, isOpen, onClose, onBookingSuccess }: SeatBookingModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: user.email || '',
    phone: '',
    duration: '2',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate from and to times
      const fromTime = new Date();
      const toTime = new Date(fromTime.getTime() + parseInt(formData.duration) * 60 * 60 * 1000);

      // Call the book_seat function
      const { data, error } = await supabase
        .rpc('book_seat', {
          p_seat_id: seat.seat_id,
          p_user_id: user.id,
          p_user_name: formData.name,
          p_user_email: formData.email,
          p_user_phone: formData.phone,
          p_from_time: fromTime.toISOString(),
          p_to_time: toTime.toISOString(),
        });

      if (error) throw error;

      onBookingSuccess();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Seat {seat.seat_label}</DialogTitle>
          <DialogDescription>
            Fill in your details to reserve this seat. Your booking will be pending admin approval.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Hour</SelectItem>
                <SelectItem value="2">2 Hours</SelectItem>
                <SelectItem value="3">3 Hours</SelectItem>
                <SelectItem value="4">4 Hours</SelectItem>
                <SelectItem value="6">6 Hours</SelectItem>
                <SelectItem value="8">8 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? 'Booking...' : 'Book Seat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
