import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AUTHORIZED_EMAIL = 'murdochcpm_08@yahoo.com';

interface NerveCenterGateProps {
  children: React.ReactNode;
}

export function NerveCenterGate({ children }: NerveCenterGateProps) {
  const { user } = useAuth();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If the logged-in user isn't the authorized email, render nothing
  if (user?.email !== AUTHORIZED_EMAIL) {
    return null;
  }

  if (verified) {
    return <>{children}</>;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Re-authenticate by attempting sign-in with provided credentials
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Verification failed. Check your credentials.');
        setLoading(false);
        return;
      }

      // Confirm the re-authenticated user matches
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (verifiedUser?.email !== AUTHORIZED_EMAIL) {
        toast.error('Unauthorized access.');
        setLoading(false);
        return;
      }

      setVerified(true);
      toast.success('Identity confirmed. Welcome to The Nerve Center.');
    } catch {
      toast.error('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Identity Verification</CardTitle>
          <CardDescription>
            Re-enter your credentials to access this restricted area
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-email">Email</Label>
              <Input
                id="gate-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-password">Password</Label>
              <Input
                id="gate-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Identity
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
