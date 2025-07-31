import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
    console.log('🟡 useEffect: Checking session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📦 Session:', session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchUserRole(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session);
        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          // Wait a moment to let backend triggers populate role
          setTimeout(() => {
            fetchUserRole(newUser.id);
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
      console.log('📥 Fetching user role for:', userId);
      let attempts = 0;
      const maxAttempts = 3;
      let foundRole: string | null = null;

      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error fetching user role:', error);
        }

        if (data?.role) {
          console.log('✅ Role fetched:', data.role);
          foundRole = data.role;
          break;
        } else {
          console.warn(`🔁 Role not found, retry ${attempts + 1}/${maxAttempts}`);
          attempts++;
          await new Promise(res => setTimeout(res, 1500));
        }
      }

      setUserRole(foundRole || 'user');
    } catch (err) {
      console.error('❌ Unexpected error during role fetch:', err);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Still loading
  if (loading) {
    console.log('⏳ Still loading...');
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔐 Not logged in
  if (!user) {
    return (
      <div className="app-container min-h-screen">
        <AppStyleAuthForm />
      </div>
    );
  }

  // 🔐 Logged in: check role
  if (userRole === 'admin') {
    console.log('🧑‍💼 Redirecting admin to /admin');
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="app-container min-h-screen">
      <LibraryNavbar user={user} userRole={userRole} />
      <main className="pb-safe">
        <UserDashboard user={user} />
      </main>
    </div>
  );
};

export default Index;
