
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileModal } from '@/components/profile/ProfileModal';
import { TransactionsModal } from '@/components/profile/TransactionsModal';

interface LibraryNavbarProps {
  user: User;
  userRole: string | null;
}

export const LibraryNavbar = ({ user, userRole }: LibraryNavbarProps) => {
  const { toast } = useToast();
  const [showProfile, setShowProfile] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

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

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
      <nav className="glass-card border-b border-gray-800 sticky top-0 z-50">
        <div className="mobile-container">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-['Playfair_Display'] font-bold text-gradient">
                अध्ययन Library
              </h1>
              {userRole === 'admin' && (
                <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full font-semibold border border-purple-500/30">
                  Admin
                </span>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 hover:bg-primary/30">
                  <span className="text-primary font-semibold">
                    {getInitials(user.email || 'U')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-gray-700 w-48" align="end">
                <DropdownMenuItem 
                  onClick={() => setShowProfile(true)}
                  className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  Profile Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowTransactions(true)}
                  className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                >
                  My Transactions
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <ProfileModal 
        user={user} 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
      <TransactionsModal 
        isOpen={showTransactions} 
        onClose={() => setShowTransactions(false)} 
      />
    </>
  );
};
