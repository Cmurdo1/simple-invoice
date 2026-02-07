import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Listen for auth state changes (recovery link creates a session)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setValidSession(true);
          } else if (session) {
            setValidSession(true);
          }
          setCheckingSession(false);
        }
      );

      // If already have session, allow password reset
      if (session) {
        setValidSession(true);
      }
      setCheckingSession(false);

      return () => subscription.unsubscribe();
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success('Password updated successfully!');
        // Sign out and redirect to login
        await supabase.auth.signOut();
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!validSession && !success) {
    return (
      <>
        <SEOHead 
          title="Reset Password - Honest Invoice"
          description="Set a new password for your Honest Invoice account."
          canonicalUrl="/reset-password"
          noIndex={true}
        />
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Invalid or Expired Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link to="/forgot-password" className="w-full">
                <Button className="w-full">Request New Link</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Reset Password - Honest Invoice"
        description="Set a new password for your Honest Invoice account."
        canonicalUrl="/reset-password"
        noIndex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {success ? (
                <CheckCircle className="h-8 w-8 text-primary" />
              ) : (
                <Lock className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {success ? 'Password Updated!' : 'Set new password'}
            </CardTitle>
            <CardDescription>
              {success 
                ? 'Your password has been updated. Redirecting to login...'
                : 'Your new password must be at least 6 characters.'
              }
            </CardDescription>
          </CardHeader>
          
          {!success && (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
