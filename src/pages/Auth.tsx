
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, Coffee, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateUserExists = async (firstName: string, lastName: string) => {
    try {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('user_name, first_name, last_name')
        .eq('first_name', firstName.trim())
        .eq('last_name', lastName.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return existingUser;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!firstName.trim() || !lastName.trim()) {
        toast({
          title: "Validation Error",
          description: "First name and last name are required to register.",
          variant: "destructive",
        });
        return;
      }

      const existingUser = await validateUserExists(firstName, lastName);
      
      if (!existingUser) {
        toast({
          title: "Registration Failed",
          description: "No user found with the provided first name and last name. Please contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: existingUser.user_name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Registration successful!",
        description: `Account linked to ${existingUser.user_name}. Please check your email to confirm your registration before signing in.`,
      });

      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-3 sm:p-6 overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-gradient-to-r from-orange-300 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Floating Elements */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-5 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full opacity-60 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-orange-300 rounded-full opacity-50 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="w-full max-w-sm sm:max-w-md animate-fade-in relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-4 shadow-lg animate-bounce">
            <Coffee className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Canteen Buddy
          </h1>
          <p className="text-sm sm:text-base text-orange-600 dark:text-orange-400 opacity-90">
            Your canteen management companion
          </p>
        </div>
        
        {/* Auth Form */}
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-orange-200 dark:border-orange-700">
            <TabsTrigger 
              value="signin" 
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
            >
              <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          {/* Sign In Tab */}
          <TabsContent value="signin">
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-orange-100/50 dark:border-orange-800/50">
              <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Sign in to continue to your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 sm:h-11 text-sm border-orange-200 dark:border-orange-700 focus:border-orange-400 focus:ring-orange-400 bg-white/70 dark:bg-gray-900/70"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="signin-password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 sm:h-11 text-sm border-orange-200 dark:border-orange-700 focus:border-orange-400 focus:ring-orange-400 pr-10 bg-white/70 dark:bg-gray-900/70"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 sm:px-6 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-orange-100/50 dark:border-orange-800/50">
              <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Create Account
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Join the canteen community
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </Label>
                      <Input 
                        id="signup-firstname" 
                        type="text" 
                        placeholder="First name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-9 sm:h-10 text-sm border-orange-200 dark:border-orange-700 focus:border-orange-400 focus:ring-orange-400 bg-white/70 dark:bg-gray-900/70"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </Label>
                      <Input 
                        id="signup-lastname" 
                        type="text" 
                        placeholder="Last name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-9 sm:h-10 text-sm border-orange-200 dark:border-orange-700 focus:border-orange-400 focus:ring-orange-400 bg-white/70 dark:bg-gray-900/70"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 sm:h-11 text-sm border-orange-200 dark:border-orange-700 focus:border-orange-400 focus:ring-orange-400 bg-white/70 dark:bg-gray-900/70"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="signup-password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 sm:h-11 text-sm border-orange-200 dark:border-orange-700 focus:border-orange-400 focus:ring-orange-400 pr-10 bg-white/70 dark:bg-gray-900/70"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-center text-gray-600 dark:text-gray-400 bg-blue-50/70 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>Your name must match our database records for successful registration.</p>
                  </div>
                </CardContent>
                <CardFooter className="px-4 sm:px-6 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
