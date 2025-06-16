
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface LibraryNavbarProps {
  user: User;
  userRole: string | null;
}

export const LibraryNavbar = ({ user, userRole }: LibraryNavbarProps) => {
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

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">
              📚 Library Seat Booking
            </h1>
            {userRole === 'admin' && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold">
                Admin
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Welcome, {user.email}
            </span>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
