import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth/AuthForm';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { LibraryNavbar } from '@/components/layout/LibraryNavbar';
import { User } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserRecords(session.user);
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          ensureUserRecords(session.user);
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserRecords = async (userObj: User) => {
    try {
      // Upsert into profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userObj.id,
        email: userObj.email,
        full_name: userObj.user_metadata?.full_name || '',
        phone: userObj.user_metadata?.phone || ''
      });

      if (profileError) {
        console.error('Profile upsert failed:', profileError);
      }

      // Upsert into user_roles
      const { error: roleError } = await supabase.from('user_roles').upsert({
        user_id: userObj.id,
        role: 'user'
      }, { onConflict: 'user_id' }); // Prevent duplicate insert

      if (roleError) {
        console.error('User role upsert failed:', roleError);
      }
    } catch (err) {
      console.error('Error ensuring user records:', err);
    }
  };

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
      <div className="app-container min-h-screen">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen">
      <LibraryNavbar user={user} userRole={userRole} />
      <main className="pb-safe">
        {userRole === null ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
            <span className="ml-2 text-gray-500">Loading dashboard...</span>
          </div>
        ) : userRole === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
};

export default Index;
