
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email to continue.",
        variant: "destructive"
      });
      return;
    }

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

    // Navigate to dashboard or return to intended page
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/dashboard';
    navigate(returnUrl);
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
            <FormItem>
              <FormLabel className="text-slate-300">Full Name</FormLabel>
              <FormControl>
                <Input
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel className="text-slate-300">Email</FormLabel>
              <FormControl>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel className="text-slate-300">Phone (Optional)</FormLabel>
              <FormControl>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </FormControl>
            </FormItem>

            <Button 
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
