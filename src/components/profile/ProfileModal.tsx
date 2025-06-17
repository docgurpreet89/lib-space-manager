
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const ProfileModal = ({ isOpen, onClose, user }: ProfileModalProps) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    email: user.email || ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || user.email || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          email: profile.email,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-[#E0E0E0] shadow-xl rounded-xl max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-[#333333] text-xl font-semibold">Profile Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-[#333333] font-medium">
              Full Name
            </Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Enter your full name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="app-input h-12 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[#333333] font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="app-input h-12 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#333333] font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              className="app-input h-12 text-base bg-[#F5F5F5]"
              disabled
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="paytm-button flex-1 h-12 text-base font-semibold"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onClose}
              className="paytm-button-secondary flex-1 h-12 text-base font-medium"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
