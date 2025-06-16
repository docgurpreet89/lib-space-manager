
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              📚 Library Seat Booking System
            </h1>
            <p className="text-xl text-gray-600">
              Reserve your perfect study spot with ease
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LibraryNavbar user={user} userRole={userRole} />
      <main className="container mx-auto px-4 py-8">
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
