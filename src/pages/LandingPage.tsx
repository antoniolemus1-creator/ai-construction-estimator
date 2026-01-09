import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthModal } from '@/components/AuthModal';
import { SuperAdminSetup } from '@/components/SuperAdminSetup';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Star } from 'lucide-react';

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    { title: 'AI Smart Estimating', desc: 'Machine learning algorithms analyze blueprints and calculate costs automatically' },
    { title: 'Real-Time Pricing', desc: 'Access 68M+ construction materials with live market pricing data' },
    { title: 'Screen Learning', desc: 'Record your workflow once, let AI replicate it forever' },
    { title: 'Mobile Field Tools', desc: 'Capture site data offline with photo documentation' },
    { title: 'Template Library', desc: 'Pre-built templates for common construction projects' },
    { title: 'Integration Ready', desc: 'Seamless integration with Procore and other platforms' }
  ];

  const testimonials = [
    { name: 'Michael Chen', role: 'General Contractor', company: 'BuildPro Inc', text: 'Cut our estimation time by 70%. The AI learns our specific pricing patterns.', rating: 5 },
    { name: 'Sarah Johnson', role: 'Project Manager', company: 'Apex Construction', text: 'Game-changer for our team. Accuracy improved and proposals are professional.', rating: 5 },
    { name: 'David Martinez', role: 'Estimator', company: 'Elite Builders', text: 'The material pricing integration alone is worth it. Saves hours every week.', rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      {/* Navigation */}
      <nav className="border-b border-amber-900/20 bg-[#0a0e1a]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">EstimateAI</h1>
          <div className="flex gap-4">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <span className="text-amber-400 text-sm font-semibold">AI-Powered Construction Intelligence</span>
            </div>
            <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
              Estimate Faster.<br/>
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Win More.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Revolutionary AI that learns your construction workflow, automates material takeoffs, and delivers professional estimates in minutes, not hours.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setShowAuthModal(true)} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2" />
              </Button>
              <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} size="lg" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <img src="https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760208857883_efd6bf43.webp" alt="EstimateAI Platform" className="rounded-2xl shadow-2xl shadow-amber-500/20" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">Everything You Need</h3>
          <p className="text-xl text-gray-400">Professional tools for modern construction estimation</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="p-6 bg-[#0f1419] border-amber-900/20 hover:border-amber-500/50 transition-all">
              <CheckCircle2 className="w-10 h-10 text-amber-500 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">{f.title}</h4>
              <p className="text-gray-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">Trusted by Industry Leaders</h3>
          <p className="text-xl text-gray-400">See what construction professionals are saying</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-6 bg-[#0f1419] border-amber-900/20">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />)}
              </div>
              <p className="text-gray-300 mb-4">"{t.text}"</p>
              <div>
                <p className="text-white font-bold">{t.name}</p>
                <p className="text-sm text-gray-400">{t.role}, {t.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
      {/* Super Admin Setup - Dev Tool */}
      <section className="container mx-auto px-6 py-12">
        <SuperAdminSetup />
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24">
        <Card className="p-12 bg-gradient-to-r from-amber-600/10 to-amber-500/10 border-amber-500/30 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Estimation Process?</h3>
          <p className="text-xl text-gray-300 mb-8">Join thousands of contractors saving time and winning more bids</p>
          <Button onClick={() => setShowAuthModal(true)} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-lg px-8">
            Start Your Free Trial <ArrowRight className="ml-2" />
          </Button>
        </Card>
      </section>


      {/* Footer */}
      <footer className="border-t border-amber-900/20 bg-[#0a0e1a] py-12">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© 2025 EstimateAI. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
