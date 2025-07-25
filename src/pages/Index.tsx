
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppStyleAuthForm } from '@/components/auth/AppStyleAuthForm';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { LibraryNavbar } from '@/components/layout/LibraryNavbar';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Wait a moment for the database trigger to complete
          // This ensures profile and role are created before we try to fetch them
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 1000);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching user role for:', userId);
      
      // Try to get user role with retries for newly verified users
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
        }

        if (data?.role) {
          console.log('User role found:', data.role);
          setUserRole(data.role);
          break;
        } else {
          console.log(`User role not found, attempt ${attempts + 1}/${maxAttempts}`);
          attempts++;
          if (attempts < maxAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Default to 'user' if not found after retries
            setUserRole('user');
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="app-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#00B9F1] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container min-h-screen">
        <AppStyleAuthForm />
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen">
      <LibraryNavbar user={user} userRole={userRole} />
      <main className="pb-safe">
        {userRole === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default Index;
