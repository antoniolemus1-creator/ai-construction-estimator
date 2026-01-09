// Copyright © 2025 - PROPRIETARY & CONFIDENTIAL - All Rights Reserved
import { useState, useEffect } from 'react';

import FeatureCard from './FeatureCard';
import TrainingWorkflow from './TrainingWorkflow';
import EstimationCalculator from './EstimationCalculator';
import { MaterialPricingSearch } from './MaterialPricingSearch';
import { EnhancedEstimationCalculator } from './EnhancedEstimationCalculator';
import BulkMaterialImport from './BulkMaterialImport';
import CostEstimateReport from './CostEstimateReport';
import { TemplateLibrary } from './TemplateLibrary';
import { ProposalTemplatesLibrary } from './ProposalTemplatesLibrary';
import { SubscriptionManager } from './SubscriptionManager';
import { SubscriptionGuard } from './SubscriptionGuard';
import { ServiceTicketForm } from './ServiceTicketForm';
import { supabase } from '@/lib/supabase';
import DemoRequestForm from './DemoRequestForm';
import AIStatusIndicator from './AIStatusIndicator';
import IntegrationManager from './IntegrationManager';
import { MobileFieldView } from './MobileFieldView';
import { RecordingControls } from './RecordingControls';
import { AnnotationTools } from './AnnotationTools';
import { WorkflowReplay } from './WorkflowReplay';
import { AuthModal } from './AuthModal';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { useScreenRecording } from '@/hooks/useScreenRecording';
import { useAuth } from '@/contexts/AuthContext';
import { Recording, Annotation } from '@/types/recording';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Video, Trash2, LogOut, User, Shield, FileText, GitCompare, FileCheck, Brain, Users as UsersIcon, Sparkles, CheckSquare, ShieldCheck, AlertTriangle } from 'lucide-react';




import { ConfidentialWatermark } from './ConfidentialWatermark';







export default function AppLayout() {
  const [activeDemo, setActiveDemo] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [currentAnnotations, setCurrentAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState('pointer');
  const [activeColor, setActiveColor] = useState('#00d4ff');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bulkMaterials, setBulkMaterials] = useState<any[]>([]);
  const [showBulkReport, setShowBulkReport] = useState(false);
  const [bulkProjectName, setBulkProjectName] = useState('');
  const [bulkState, setBulkState] = useState('');
  const [bulkCounty, setBulkCounty] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  
  const { user, signOut } = useAuth();
  const {
    isRecording,
    isPaused,
    recordingTime,
    recordings,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    loadRecordings
  } = useScreenRecording();

  useEffect(() => {
    if (user) {
      loadRecordings();
      checkAdminStatus();
    }
  }, [user, loadRecordings]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    console.log('🔍 AppLayout: Checking admin status for user:', user.email);
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();
    
    console.log('👤 AppLayout: Profile data:', profile);
    console.log('⚠️ AppLayout: Profile error:', error);
    
    // Allow both super_admin and admin (system admin) to access /admin route
    const isSystemAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
    console.log('✅ AppLayout: Is system admin (super_admin or admin)?', isSystemAdmin, '(role:', profile?.role, ')');
    console.log('📋 AppLayout: Role hierarchy:');
    console.log('   - super_admin: Full platform access');
    console.log('   - admin: System admin with delegated permissions');
    console.log('   - Organization admin: Scoped to organization only (no /admin access)');
    
    setIsAdmin(isSystemAdmin);
  };






  const handleAddAnnotation = (annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation = {
      ...annotation,
      id: Date.now().toString()
    };
    setCurrentAnnotations([...currentAnnotations, newAnnotation]);
  };


  const handleBulkImport = (materials: any[], projectName: string, state?: string, county?: string) => {
    setBulkMaterials(materials);
    setBulkProjectName(projectName);
    setBulkState(state || '');
    setBulkCounty(county || '');
    setShowBulkReport(true);
  };


  const features = [
    {
      icon: '📐',
      title: 'Blueprint Reading',
      description: 'AI analyzes architectural drawings and identifies all components automatically',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192803584_b2df1c6e.webp'
    },
    {
      icon: '🧮',
      title: 'Cost Calculation',
      description: 'Intelligent algorithms calculate materials, labor, overhead, and profit margins',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192804301_a4572c61.webp'
    },
    {
      icon: '👷',
      title: 'Labor Estimation',
      description: 'Learn from your historical data to predict accurate labor hours and costs',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192805006_4971038c.webp'
    },
    {
      icon: '🤖',
      title: 'Machine Learning',
      description: 'Continuously improves accuracy by learning from your estimation patterns',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192805706_442c68ec.webp'
    },
    {
      icon: '🏗️',
      title: 'Project Analysis',
      description: 'Comprehensive project scope analysis with risk assessment and recommendations',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192806529_c432935a.webp'
    },
    {
      icon: '📦',
      title: 'Material Database',
      description: 'Access real-time pricing data and material specifications from suppliers',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192807251_f85afb24.webp'
    },
    {
      icon: '📊',
      title: 'Report Generation',
      description: 'Generate professional, detailed estimation reports in multiple formats',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192807972_94e66fc3.webp'
    },
    {
      icon: '🔄',
      title: 'Workflow Integration',
      description: 'Seamlessly integrates with your existing estimation software and tools',
      image: 'https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192805006_4971038c.webp'
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      {/* Top Navigation Bar */}
      <nav className="bg-[#0f1219] border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-xl">EstimateAI</h3>
          <div className="flex items-center gap-4">
            {user && <OrganizationSwitcher />}
            {user ? (
              <>
                <Button 
                  onClick={() => window.location.href = '/plan-revisions'} 
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Plan Revisions
                </Button>

                <Button 
                  onClick={() => window.location.href = '/change-orders'} 
                  variant="outline" 
                  size="sm"
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Change Orders
                </Button>
                <Button 
                  onClick={() => window.location.href = '/ai-plan-analysis'} 
                  variant="outline" 
                  size="sm"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  AI Plan Analysis
                </Button>
                <Button 
                  onClick={() => window.location.href = '/extraction-training'} 
                  variant="outline" 
                  size="sm"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                >
                  <Brain className="w-4 h-4 mr-2" />

                  Extraction Training
                </Button>
                <Button 
                  onClick={() => window.location.href = '/federated-learning'} 
                  variant="outline" 
                  size="sm"
                  className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                >
                  <UsersIcon className="w-4 h-4 mr-2" />

                  Learning Network
                </Button>
                <Button 
                  onClick={() => window.location.href = '/fine-tuning'} 
                  variant="outline" 
                  size="sm"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fine-Tuning
                </Button>
                <Button 
                  onClick={() => window.location.href = '/training-curation'} 
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />

                  Data Curation
                </Button>
                <Button 
                  onClick={() => window.location.href = '/validation-analytics'} 
                  variant="outline" 
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Data Validation
                </Button>
                <Button 
                  onClick={() => window.location.href = '/conflicts'} 
                  variant="outline" 
                  size="sm"
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Plan Conflicts
                </Button>






                {isAdmin && (
                  <Button 
                    onClick={() => window.location.href = '/admin'} 
                    variant="outline" 
                    size="sm"
                    className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                )}

                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {user.email}
                </span>
                <Button onClick={() => signOut()} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="bg-cyan-500 hover:bg-cyan-600">
                Sign In / Sign Up
              </Button>
            )}
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/20 to-transparent"></div>
        <div className="container mx-auto px-4 py-20 relative">

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                AI That Learns Your <span className="text-[#00d4ff]">Construction Workflow</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Revolutionary screen-learning AI that watches, learns, and masters construction estimation. 
                Automate material takeoffs, labor calculations, overhead analysis, and profit margins.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#00d4ff] text-[#1a1f2e] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#00b8e6] transition-colors"
                >
                  Start Free Trial
                </button>
                <button 
                  onClick={() => setActiveDemo(!activeDemo)}
                  className="border-2 border-[#00d4ff] text-[#00d4ff] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#00d4ff]/10 transition-colors"
                >
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://d64gsuwffb70l.cloudfront.net/68ea68ee88bca34cbf39b4bd_1760192802841_d78969e2.webp"
                alt="AI analyzing construction blueprints"
                className="rounded-xl shadow-2xl shadow-[#00d4ff]/30"
              />
              {activeDemo && (
                <div className="absolute inset-0 bg-[#00d4ff]/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-white text-6xl animate-pulse">▶️</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful AI Capabilities</h2>
          <p className="text-xl text-gray-400">Everything you need for accurate construction estimation</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
      {/* Screen Recording Section - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Screen Learning Studio</h2>
          <p className="text-xl text-gray-400">Record your estimation workflow and train the AI to replicate it</p>
        </div>

        <SubscriptionGuard featureName="Screen Learning Studio" requiredTier="basic">
          <div className="space-y-6">
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              currentTime={recordingTime}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
            />

            {isRecording && (
              <AnnotationTools
                onToolSelect={setActiveTool}
                onColorSelect={setActiveColor}
                onUndo={() => setCurrentAnnotations(currentAnnotations.slice(0, -1))}
                onClear={() => setCurrentAnnotations([])}
                disabled={false}
              />
            )}

            <Card className="p-6 bg-[#1a1f2e] border-cyan-500/20">
              <h3 className="text-2xl font-bold text-white mb-6">Recorded Workflows</h3>
              {recordings.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recordings yet. Start recording to train your AI!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recordings.map(recording => (
                    <Card key={recording.id} className="p-4 bg-[#0f1219] border-gray-700 hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-bold">{recording.title}</h4>
                          <p className="text-sm text-gray-400">
                            {new Date(recording.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">
                          Duration: {Math.floor(recording.duration)}s
                        </p>
                        <Button
                          onClick={() => setSelectedRecording(recording)}
                          className="w-full bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Play & Review
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </SubscriptionGuard>
      </div>

      {/* AI Training Section - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">AI Training Pipeline</h2>
          <p className="text-xl text-gray-400">Train your AI model on recorded workflows to automate estimation</p>
        </div>
        <SubscriptionGuard featureName="AI Training Pipeline" requiredTier="pro">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrainingWorkflow />
            </div>
            <div>
              <AIStatusIndicator />
            </div>
          </div>
        </SubscriptionGuard>
      </div>



      {/* Subscription & Support Section */}
      {user && (
        <div id="subscription-section" className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Account & Support</h2>
            <p className="text-xl text-gray-400">Manage your subscription and get help when you need it</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <SubscriptionManager />
            <ServiceTicketForm />
          </div>
          <div className="mt-6 text-center">
            <Button 
              onClick={() => window.location.href = '/billing'}
              variant="outline"
              className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
            >
              View Billing History & Invoices
            </Button>
          </div>
        </div>
      )}


      {/* Mobile Field View - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Mobile Field Tools</h2>
          <p className="text-xl text-gray-400">Capture site data on-the-go with offline support</p>
        </div>
        <SubscriptionGuard featureName="Mobile Field Tools" requiredTier="basic">
          <MobileFieldView />
        </SubscriptionGuard>
      </div>

      {/* Real-Time Material Pricing - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">1Build Real-Time Material Pricing</h2>
          <p className="text-xl text-gray-400">Access live construction material costs from 1Build's 68M+ item database</p>
        </div>
        <SubscriptionGuard featureName="Material Pricing & Enhanced Calculator" requiredTier="pro">
          <div className="grid lg:grid-cols-2 gap-6">
            <MaterialPricingSearch />
            <EnhancedEstimationCalculator />
          </div>
        </SubscriptionGuard>
      </div>

      {/* Templates - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <SubscriptionGuard featureName="Project Templates Library" requiredTier="basic">
          <TemplateLibrary onSelectTemplate={(template) => {
            supabase.from('template_materials').select('*').eq('template_id', template.id).order('sort_order').then(({ data }) => {
              if (data) {
                const materials = data.map(m => ({ material: m.material_name, description: m.description, quantity: m.quantity, unit: m.unit, category: m.category }));
                handleBulkImport(materials, template.name);
              }
            });
            supabase.from('project_templates').update({ usage_count: template.usage_count + 1 }).eq('id', template.id).then(() => {});
          }} />
        </SubscriptionGuard>
      </div>

      <div className="container mx-auto px-4 py-20">
        <SubscriptionGuard featureName="Proposal Templates" requiredTier="pro">
          <ProposalTemplatesLibrary />
        </SubscriptionGuard>
      </div>

      {/* Bulk Import - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Bulk Material Import & Pricing</h2>
          <p className="text-xl text-gray-400">Upload CSV files with multiple materials for automated pricing</p>
        </div>
        <SubscriptionGuard featureName="Bulk Material Import" requiredTier="pro">
          <div className="grid lg:grid-cols-2 gap-6">
            <BulkMaterialImport onImportComplete={handleBulkImport} />
            {showBulkReport && bulkMaterials.length > 0 && (
              <CostEstimateReport materials={bulkMaterials} projectName={bulkProjectName} state={bulkState} county={bulkCounty} onPricingComplete={() => {}} />
            )}
          </div>
        </SubscriptionGuard>
      </div>

      {/* Calculator & Integrations - PROTECTED */}
      <div className="container mx-auto px-4 py-20">
        <SubscriptionGuard featureName="Advanced Tools" requiredTier="basic">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><EstimationCalculator /></div>
            <div><IntegrationManager /></div>
          </div>
        </SubscriptionGuard>
      </div>


      {/* Demo Form */}
      <div id="demo" className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <DemoRequestForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f1219] border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">EstimateAI</h3>
              <p className="text-gray-400 text-sm">AI-powered construction estimation platform</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#00d4ff]">Features</a></li>
                <li><a href="#" className="hover:text-[#00d4ff]">Pricing</a></li>
                <li><a href="#" className="hover:text-[#00d4ff]">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#00d4ff]">About</a></li>
                <li><a href="#" className="hover:text-[#00d4ff]">Contact</a></li>
                <li><a href="#" className="hover:text-[#00d4ff]">Careers</a></li>
                <li><a href="/admin" className="hover:text-[#00d4ff]">Employees</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#00d4ff]">Privacy</a></li>
                <li><a href="#" className="hover:text-[#00d4ff]">Terms</a></li>
                <li><a href="#" className="hover:text-[#00d4ff]">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            © 2025 EstimateAI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Workflow Replay Modal */}
      {selectedRecording && (
        <WorkflowReplay
          recording={selectedRecording}
          onClose={() => setSelectedRecording(null)}
          onDelete={() => {
            setSelectedRecording(null);
            loadRecordings();
          }}
        />
      )}


      {/* Confidential Watermark */}
      <ConfidentialWatermark />
    </div>
  );
}
