import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast({ title: 'Account created!', description: 'Welcome to AI Construction Estimator' });
      } else {
        await signIn(email, password);
        toast({ title: 'Signed in successfully!' });
      }
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f2e] border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-[#0f1419] border-cyan-500/20 text-white" />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[#0f1419] border-cyan-500/20 text-white" />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-[#0f1419] border-cyan-500/20 text-white" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600">
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-cyan-400">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
