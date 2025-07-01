
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, Coffee, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Auto-focus email input
    const emailInput = document.getElementById('signin-email') || document.getElementById('signup-email');
    if (emailInput) {
      emailInput.focus();
    }

    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();

    // Listen for auth changes
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
      // Clean up any existing auth state first
      cleanupAuthState();
      
      // Attempt to sign in
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
      // Clean up any existing auth state
      cleanupAuthState();

      // Validate that user exists in database with matching first and last name
      if (!firstName.trim() || !lastName.trim()) {
        toast({
          title: "Validation Error",
          description: "First name and last name are required to register.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const existingUser = await validateUserExists(firstName, lastName);
      
      if (!existingUser) {
        toast({
          title: "Registration Failed",
          description: "No user found with the provided first name and last name. Please contact your administrator.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Attempt to sign up with user data including the matched username
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: existingUser.user_name // Link to the existing user record
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Registration successful!",
        description: `Account linked to ${existingUser.user_name}. Please check your email to confirm your registration before signing in.`,
      });

      // Clear form
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

  // Helper function to clean up auth state
  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center justify-center gap-3">
            <Coffee className="h-8 w-8" /> 
            <span>Canteen Buddy</span>
          </h1>
          <p className="text-orange-600 dark:text-orange-400 text-sm sm:text-base">
            Sign in to access the canteen management system
          </p>
        </div>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin" className="flex items-center gap-2 text-xs sm:text-sm">
              <LogIn className="w-4 h-4" /> Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2 text-xs sm:text-sm">
              <UserPlus className="w-4 h-4" /> Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-lg sm:text-xl">Welcome Back</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm sm:text-base">Email</Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 transition-all"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm sm:text-base">Password</Label>
                    <Input 
                      id="signin-password" 
                      type="password" 
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 transition-all"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-orange-600 hover:bg-orange-700 text-sm sm:text-base transition-all" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-lg sm:text-xl">Create Account</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Register to access the canteen system
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname" className="text-sm sm:text-base">First Name *</Label>
                      <Input 
                        id="signup-firstname" 
                        type="text" 
                        placeholder="First name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10 sm:h-11 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname" className="text-sm sm:text-base">Last Name *</Label>
                      <Input 
                        id="signup-lastname" 
                        type="text" 
                        placeholder="Last name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-10 sm:h-11 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm sm:text-base">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm sm:text-base">Password</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 transition-all"
                      required
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p><strong>Important:</strong> Your first name and last name must match an existing user record in our database. If they don't match, registration will fail.</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-orange-600 hover:bg-orange-700 text-sm sm:text-base transition-all" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Sign Up"
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
