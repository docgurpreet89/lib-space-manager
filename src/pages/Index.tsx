
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
// import { AuthForm } from '@/components/auth/AuthForm';
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
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
      }

      setUserRole(data?.role || 'user');
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
      // <div className="app-container min-h-screen">
      //   <div className="container mx-auto px-4 py-8">
      //     <div className="text-center mb-12 mt-8">
      //       <h1 className="app-logo text-5xl md:text-6xl mb-4">
      //         अध्ययन Library
      //       </h1>
      //       <p className="text-xl text-[#666666] font-light">
      //         Your Premium Study Space
      //       </p>
      //     </div>
      //     {/*<AuthForm />*/}
      //     <AppStyleAuthForm />
      //   </div>
      // </div>
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
