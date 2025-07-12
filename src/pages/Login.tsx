import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store user data in localStorage (passwordless login)
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('alika_user', JSON.stringify(userData));
      
      toast({
        title: "Welcome to Alika!",
        description: "You're now logged in and ready to create events.",
      });

      // Small delay to ensure storage is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to dashboard or return to intended page
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      navigate(returnUrl, { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-teal-400 mr-2" />
            <span className="text-2xl font-bold text-white">Alika</span>
          </div>
          <CardTitle className="text-white">Welcome Back</CardTitle>
          <p className="text-slate-300">Enter your details to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;