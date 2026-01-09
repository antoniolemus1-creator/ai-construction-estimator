import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, Calculator, Layers, DollarSign, FileText, Upload, Brain, Smartphone, Video, Settings, User, GitCompare, FileCheck, Sparkles, GraduationCap, PlayCircle, History, Wrench } from 'lucide-react';
import CrossReferenceMonitorWidget from '@/components/CrossReferenceMonitorWidget';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';


export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    setIsAdmin(data?.role === 'admin' || data?.role === 'super_admin');
  };

  const tools = [
    { title: 'Estimation Calculator', desc: 'Basic construction cost calculator', icon: Calculator, path: '/estimation', color: 'amber' },
    { title: 'Enhanced Estimation', desc: 'Advanced calculator with AI features', icon: Layers, path: '/enhanced-estimation', color: 'amber' },
    { title: 'AI Plan Analysis', desc: 'AI-powered construction plan analysis', icon: Sparkles, path: '/ai-plan-analysis', color: 'blue' },
    { title: 'Plan Revisions', desc: 'Compare plan versions & track changes', icon: GitCompare, path: '/plan-revisions', color: 'green' },
    { title: 'Change Orders', desc: 'Manage change orders & cost impacts', icon: FileCheck, path: '/change-orders', color: 'orange' },
    { title: 'Video Analysis', desc: 'Analyze construction training videos', icon: PlayCircle, path: '/video-analysis', color: 'purple' },
    { title: 'Analysis History', desc: 'View past plan analyses', icon: History, path: '/analysis-history', color: 'indigo' },
    { title: 'AI Learning', desc: 'AI insights & learning progress', icon: GraduationCap, path: '/ai-learning', color: 'pink' },
    { title: 'Materials & Labor', desc: 'Manage materials and labor rates', icon: Wrench, path: '/materials-labor', color: 'cyan' },
    { title: 'Material Pricing', desc: 'Real-time pricing from 1Build', icon: DollarSign, path: '/material-pricing', color: 'amber' },
    { title: 'Template Library', desc: 'Pre-built project templates', icon: FileText, path: '/templates', color: 'amber' },
    { title: 'Proposal Generator', desc: 'Create professional proposals', icon: FileText, path: '/proposals', color: 'amber' },
    { title: 'Proposal Templates', desc: 'Reusable proposal templates', icon: Layers, path: '/proposal-templates', color: 'amber' },
    { title: 'Bulk Import', desc: 'Upload CSV for bulk pricing', icon: Upload, path: '/bulk-import', color: 'amber' },
    { title: 'AI Training', desc: 'Train AI on your workflows', icon: Brain, path: '/training', color: 'amber' },
    { title: 'Screen Recording', desc: 'Record estimation workflows', icon: Video, path: '/screen-recording', color: 'amber' },
    { title: 'Mobile Field Tools', desc: 'Offline site data capture', icon: Smartphone, path: '/mobile-field', color: 'amber' },
    { title: 'Integrations', desc: 'Connect with Procore & more', icon: Settings, path: '/integrations', color: 'amber' },
    { title: 'Account Settings', desc: 'Manage subscription & billing', icon: User, path: '/account', color: 'amber' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      <nav className="border-b border-amber-900/20 bg-[#0a0e1a]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">EstimateAI</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button onClick={() => navigate('/admin')} variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <span className="text-gray-400">{user?.email}</span>
            <Button onClick={() => signOut()} variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-xl text-gray-400">Choose a tool to get started</p>
        </div>

        <div className="mb-8">
          <CrossReferenceMonitorWidget />
        </div>


        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool, i) => (
            <Card key={i} onClick={() => navigate(tool.path)} className="p-6 bg-[#0f1419] border-amber-900/20 hover:border-amber-500/50 transition-all cursor-pointer group">
              <tool.icon className="w-12 h-12 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
              <p className="text-gray-400 text-sm">{tool.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
