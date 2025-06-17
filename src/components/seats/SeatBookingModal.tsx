
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Seat = Database['public']['Tables']['seats']['Row'];

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
    phone: '',
    email: user.email || '',
    duration: '1'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const baseRate = 4000;
  const discountMap: { [key: number]: number } = {
    1: 1,
    2: 0.97,
    3: 0.94,
    4: 0.91,
    5: 0.88,
    6: 0.85,
    7: 0.833,
    8: 0.817,
    9: 0.80,
    10: 0.783,
    11: 0.767,
    12: 0.75
  };

  const calculatePrice = (duration: number) => {
    const discount = discountMap[duration] || 1;
    return Math.round(baseRate * duration * discount);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to load profile:', error.message);
      } else if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.full_name || '',
          phone: data.phone || ''
        }));
      }
    };

    fetchProfile();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const durationNum = parseInt(formData.duration);
      const fromTime = new Date();
      const toTime = new Date();
      toTime.setMonth(toTime.getMonth() + durationNum);
      const price = calculatePrice(durationNum);

      const { error } = await supabase.rpc('process_seat_booking', {
        _seat_id: seat.seat_id,
        _user_id: user.id,
        _user_name: formData.name,
        _user_email: formData.email,
        _user_phone: formData.phone,
        _from: fromTime.toISOString(),
        _to: toTime.toISOString(),
        _price: price
      });

      if (error) throw error;

      toast({
        title: "Booking Submitted",
        description: `Your booking request for ₹${price} is pending admin approval.`,
      });

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
            <Label htmlFor="duration">Duration (months)</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1} {i + 1 === 1 ? 'month' : 'months'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.duration && (() => {
            const durationNum = parseInt(formData.duration);
            const discount = discountMap[durationNum] || 1;
            const originalPrice = baseRate * durationNum;
            const discountedPrice = calculatePrice(durationNum);
            const discountPercent = Math.round((1 - discount) * 100);

            return (
              <div className="text-right text-sm">
                Original: <span className="line-through text-gray-500">₹ {originalPrice}</span> | 
                <span className="text-lg font-bold text-green-600 ml-1">Discounted: ₹ {discountedPrice}</span>
                {discountPercent > 0 && (
                  <div className="text-blue-600 text-sm">
                    You save: {discountPercent}%
                  </div>
                )}
              </div>
            );
          })()}

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
