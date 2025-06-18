import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AppStyleAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    mobile: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'fullName' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.mobile
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.mobile
          });
        }

        toast({
          title: "Account Created",
          description: "Check your email to verify your account."
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Add logo + library name */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/logo.png" 
            alt="Library Logo" 
            className="h-24 w-auto mb-2" 
          />
          <div className="text-2xl font-bold text-blue-600">अध्ययन Library</div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {isLogin ? 'Login to your account to continue' : 'Register to access your study space'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="h-12 text-base"
                  required
                />
              </div>
              <div>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter Mobile Number"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  className="h-12 text-base"
                  required
                />
              </div>
            </>
          )}

          <div>
            <Input
              id="email"
              type="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="h-12 text-base pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-white"
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Proceed'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          By proceeding, you agree to our <span className="text-blue-600">Terms & Conditions</span> and <span className="text-blue-600">Privacy Policy</span>
        </p>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-medium text-sm"
          >
            {isLogin ? "Don't have an account? Create Account" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
