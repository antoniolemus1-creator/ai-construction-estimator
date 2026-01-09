import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Shield, Loader2 } from 'lucide-react';

export function SuperAdminSetup() {
  const [email, setEmail] = useState('superadmin@estimateai.com');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [fullName, setFullName] = useState('Super Admin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createSuperAdmin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Invoking create-super-admin function...');
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: { email, password, fullName }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }
      
      if (data?.success) {
        setMessage('✅ Super admin account created! You can now sign in with these credentials.');
      } else {
        setMessage('❌ ' + (data?.error || 'Failed to create account'));
      }
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      setMessage('❌ Error: ' + (error.message || 'Failed to create super admin account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-900 to-slate-800 border-amber-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-500" />
          <CardTitle className="text-white">Create Super Admin</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Set up a super admin account for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Password</Label>
          <Input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button 
          onClick={createSuperAdmin} 
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Super Admin'}
        </Button>
        {message && (
          <p className="text-sm text-center text-slate-300 mt-4">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
