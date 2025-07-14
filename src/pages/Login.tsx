import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { loginUser, registerUser } from '@/utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in your email and password to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await loginUser({
        email: loginData.email,
        password: loginData.password
      });
      
      toast({
        title: "Welcome back!",
        description: "You're now logged in and ready to create events.",
      });

      // Navigate to dashboard or return to intended page
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      navigate(returnUrl, { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, email, and password to continue.",
        variant: "destructive"
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone || undefined
      });
      
      toast({
        title: "Account Created!",
        description: "Your account has been created successfully. Please log in to continue.",
      });

      // Show additional guidance
      setTimeout(() => {
        toast({
          title: "Ready to Log In",
          description: "Your email has been pre-filled. Enter your password to continue.",
        });
      }, 2000);

      // Clear registration form and switch to login tab
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
      });
      setActiveTab('login');
      
      // Pre-fill the login email with the registered email
      setLoginData(prev => ({
        ...prev,
        email: registerData.email
      }));
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "There was a problem creating your account. Please try again.",
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
          <CardTitle className="text-white">Welcome to Alika</CardTitle>
          <p className="text-slate-300">Create and manage your events with ease</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="login" className="text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="text-slate-300 data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-300">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={handleLoginInputChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-slate-400 text-sm">
                    Create your account to start managing events
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-slate-300">Full Name</Label>
                  <Input
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerData.name}
                    onChange={handleRegisterInputChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-slate-300">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={handleRegisterInputChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-slate-300">Password</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password (min 6 characters)"
                    value={registerData.password}
                    onChange={handleRegisterInputChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password" className="text-slate-300">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterInputChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-slate-300">Phone (Optional)</Label>
                  <Input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={registerData.phone}
                    onChange={handleRegisterInputChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;