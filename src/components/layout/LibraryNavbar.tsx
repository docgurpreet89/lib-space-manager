
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { TransactionsModal } from '@/components/profile/TransactionsModal';
import { Bell, User as UserIcon, CreditCard, LogOut } from 'lucide-react';

interface LibraryNavbarProps {
  user: User;
  userRole: string | null;
}

export const LibraryNavbar = ({ user, userRole }: LibraryNavbarProps) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
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
      <nav className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Left - Profile Icon */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-[#00B9F1] flex items-center justify-center text-white font-semibold text-lg shadow-md"
              >
                {getUserInitial()}
              </button>
              
              {showProfileMenu && (
                <div className="absolute left-0 mt-2 w-56 app-card border border-[#E0E0E0] shadow-xl rounded-xl overflow-hidden z-50">
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
                      className="w-full px-4 py-3 text-left text-[#333333] hover:bg-[#F5F5F5] flex items-center gap-3 transition-colors"
                    >
                      <UserIcon size={18} className="text-[#002E6E]" />
                      Profile Details
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowTransactionsModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-[#333333] hover:bg-[#F5F5F5] flex items-center gap-3 transition-colors"
                    >
                      <CreditCard size={18} className="text-[#002E6E]" />
                      My Transactions
                    </button>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 text-left text-[#FF3B30] hover:bg-[#F5F5F5] flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Center - Logo or empty for clean look */}
            <div className="flex items-center space-x-3">
              <h1 className="app-logo text-lg font-semibold">
                अध्ययन Library
              </h1>
              {userRole === 'admin' && (
                <span className="bg-[#002E6E] text-white text-xs px-2 py-1 rounded-full font-semibold">
                  Admin
                </span>
              )}
            </div>
            
            {/* Right - Notification Bell */}
            <button className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#002E6E] shadow-sm">
              <Bell size={20} />
            </button>
          </div>
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
    </>
  );
};
