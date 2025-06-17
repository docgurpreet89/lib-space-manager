import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { TransactionsModal } from '@/components/profile/TransactionsModal';
import { User as UserIcon, CreditCard, LogOut, KeyRound, Bell } from 'lucide-react';

interface LibraryNavbarProps {
  user: User;
  userRole: string | null;
}

export const LibraryNavbar = ({ user, userRole }: LibraryNavbarProps) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    }
  };

  const getUserInitial = () => {
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <nav className="bg-blue-50 border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="max-w-screen-lg mx-auto flex justify-between items-center px-4 py-3">
          {/* Left - User Initial */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-[#00B9F1] flex items-center justify-center text-white font-semibold text-lg shadow-md"
            >
              {getUserInitial()}
            </button>

            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-56 app-card border border-[#E0E0E0] shadow-xl rounded-xl overflow-hidden z-50 bg-white">
                <div className="p-4 border-b border-[#E0E0E0]">
                  <p className="text-[#333333] font-medium truncate">{user.email}</p>
                  <p className="text-[#666666] text-sm">Welcome back!</p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-[#333333] hover:bg-[#F5F5F5] flex items-center gap-3"
                  >
                    <UserIcon size={18} className="text-[#002E6E]" />
                    Profile Details
                  </button>

                  <button
                    onClick={() => {
                      setShowTransactionsModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-[#333333] hover:bg-[#F5F5F5] flex items-center gap-3"
                  >
                    <CreditCard size={18} className="text-[#002E6E]" />
                    My Transactions
                  </button>

                  <button
                    onClick={() => {
                      setShowChangePasswordModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-[#333333] hover:bg-[#F5F5F5] flex items-center gap-3"
                  >
                    <KeyRound size={18} className="text-[#002E6E]" />
                    Change Password
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-[#FF3B30] hover:bg-[#F5F5F5] flex items-center gap-3"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center - Logo */}
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            <span className="text-lg font-bold text-[#002E6E]">
              अध्ययन Library
            </span>
            {userRole === 'admin' && (
              <span className="bg-[#002E6E] text-white text-xs px-2 py-1 rounded-full font-semibold">
                Admin
              </span>
            )}
          </div>

          {/* Right - Bell */}
          <button className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#002E6E] shadow-sm">
            <Bell size={20} />
          </button>
        </div>
      </nav>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />

      <TransactionsModal
        isOpen={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
      />

      {showChangePasswordModal && <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />}
    </>
  );
};

const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: oldPassword
    });

    if (signInError) {
      toast({
        title: "Error",
        description: "Old password is incorrect.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password changed successfully.",
      });
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-bold text-[#002E6E] mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm text-[#333333]">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-[#333333]">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-[#333333]">Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-[#E0E0E0] rounded-lg"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#E0E0E0] text-[#333333]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-[#00B9F1] text-white font-semibold hover:bg-[#0095C7]"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
