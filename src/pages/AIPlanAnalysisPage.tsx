import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload, ArrowLeftRight, Loader2, FileText, CheckCircle2, Eye, AlertCircle, FolderPlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VisionExtractorPanel } from '@/components/VisionExtractorPanel';
import SpecsDrawingsCrossReference from '@/components/SpecsDrawingsCrossReference';
import { WallMaterialEstimator } from '@/components/WallMaterialEstimator';
import { Calculator } from 'lucide-react';
import { DocumentTypeSelector, ExtractionConfig } from '@/components/DocumentTypeSelector';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectSelectionModal } from '@/components/ProjectSelectionModal';
import { ExistingProjectSelector } from '@/components/ExistingProjectSelector';
import { MultiFileUploadDialog } from '@/components/MultiFileUploadDialog';

import { VoiceInput } from '@/components/VoiceInput';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';


export default function AIPlanAnalysisPage() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [plansWithData, setPlansWithData] = useState<Set<string>>(new Set());
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showExistingProject, setShowExistingProject] = useState(false);
  const [showMultiFileUpload, setShowMultiFileUpload] = useState(false);
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);

  const [currentProjectName, setCurrentProjectName] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('extract');
  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig | null>(null);
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<any[]>([]);
  const [hasExtractedData, setHasExtractedData] = useState(false);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const { toast } = useToast();


  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      loadExtractedData(selectedPlan.id);
      loadConversation(selectedPlan.id);
    }
  }, [selectedPlan]);

  const loadPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setPlans(data);
      const planIds = data.map(p => p.id);
      const { data: takeoffData } = await supabase
        .from('takeoff_data')
        .select('plan_id')
        .in('plan_id', planIds);
      
      const plansWithExtractedData = new Set(takeoffData?.map(t => t.plan_id) || []);
      setPlansWithData(plansWithExtractedData);
    }
  };

  const loadExtractedData = async (planId: string) => {
    const { data } = await supabase
      .from('takeoff_data')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });
    
    setExtractedItems(data || []);
    setHasExtractedData((data || []).length > 0);
    
    if (data && data.length > 0) {
      setPlansWithData(prev => new Set([...prev, planId]));
    }
  };

  const loadConversation = async (planId: string) => {
    const { data } = await supabase
      .from('plan_conversations')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });
    setConversation(data || []);
  };

  const handleCreateProjectClick = () => {
    setShowProjectSelection(true);
  };

  const handleNewProject = () => {
    setShowProjectSelection(false);
    setShowCreateProject(true);
  };

  const handleExistingProject = () => {
    setShowProjectSelection(false);
    setShowExistingProject(true);
  };

  const handleProjectCreated = (projectName: string) => {
    setCurrentProjectName(projectName);
    setShowMultiFileUpload(true);
  };

  const handleExistingPlansSelected = (selectedPlans: any[]) => {
    if (selectedPlans.length > 0) {
      setSelectedPlan(selectedPlans[0]);
      if (selectedPlans[0].extraction_config) {
        setExtractionConfig(selectedPlans[0].extraction_config);
      }
      toast({
        title: 'Plans loaded',
        description: `${selectedPlans.length} plan(s) selected`
      });
    }
  };


  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(files);
    setShowDocTypeSelector(true);
  };

  const handleExtractionConfigConfirmed = async (config: ExtractionConfig) => {
    if (pendingFiles.length === 0) return;
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedPlans = [];

      for (const file of pendingFiles) {
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('construction-plans')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data, error } = await supabase
          .from('plans')
          .insert({
            user_id: user.id,
            project_name: currentProjectName,
            file_path: fileName,
            file_url: fileName,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            extraction_config: config,
            document_type: config.documentType === 'plans' ? 'drawings' : 
                          config.documentType === 'specs' ? 'specifications' : 'both',
            has_specifications: config.documentType !== 'plans',
          })
          .select()
          .single();

        if (error) throw error;
        uploadedPlans.push(data);
      }

      toast({ 
        title: 'Files uploaded!',
        description: `${uploadedPlans.length} file(s) uploaded to ${currentProjectName}`
      });
      
      setSelectedPlan(uploadedPlans[0]);
      setExtractionConfig(config);
      loadPlans();
      setPendingFiles([]);
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleExtractionComplete = () => {
    if (selectedPlan) {
      loadExtractedData(selectedPlan.id);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setPrompt(prev => prev ? `${prev} ${text}` : text);
  };

  const handleAsk = async () => {
    if (!prompt.trim() || !selectedPlan) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
        body: { 
          planId: selectedPlan.id, 
          prompt,
          extractedData: extractedItems,
          hasVisionData: hasExtractedData
        }
      });

      if (error) throw error;

      toast({ title: 'Analysis complete!' });
      setPrompt('');
      loadConversation(selectedPlan.id);
    } catch (error: any) {
      toast({ title: 'Analysis failed', description: error.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Plan Analysis</h1>
          <p className="text-gray-600 mt-1">
            Upload construction documents and let AI analyze them
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Projects
          </h3>
          <Button 
            onClick={handleCreateProjectClick} 
            disabled={uploading} 
            className="w-full mb-4"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderPlus className="w-4 h-4 mr-2" />
            )}
            Begin Analysis
          </Button>

          <div className="space-y-2">
            {plans.map(plan => (
              <Card 
                key={plan.id} 
                className={`p-3 cursor-pointer transition-colors ${selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.project_name}</p>
                    <p className="text-xs text-muted-foreground">{plan.file_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(plan.created_at).toLocaleDateString()}</p>
                  </div>
                  {plansWithData.has(plan.id) && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" title="Data extracted" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2 p-6">
          {selectedPlan ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="extract">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Extract
                </TabsTrigger>
                <TabsTrigger value="estimate" disabled={!hasExtractedData}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Estimate
                </TabsTrigger>
                <TabsTrigger value="crossref" disabled={!hasExtractedData}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Cross-Reference
                </TabsTrigger>
                <TabsTrigger value="chat" disabled={!hasExtractedData}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="extract" className="mt-4">
                {extractionConfig ? (
                  <VisionExtractorPanel 
                    planId={selectedPlan.id} 
                    onComplete={handleExtractionComplete}
                    extractionConfig={extractionConfig}
                  />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Upload a plan and configure extraction settings to begin.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="estimate" className="mt-4">
                {hasExtractedData && (
                  <WallMaterialEstimator
                    planId={selectedPlan.id}
                    projectName={selectedPlan.name || 'Project'}
                  />
                )}
              </TabsContent>

              <TabsContent value="crossref" className="mt-4">
                {hasExtractedData && <SpecsDrawingsCrossReference planId={selectedPlan.id} />}
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                {hasExtractedData && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <Eye className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>{extractedItems.length} items extracted!</strong> Ask questions below.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="h-96 overflow-y-auto mb-4 space-y-3">
                  {conversation.map(msg => (
                    <div key={msg.id} className={`p-3 rounded ${msg.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'}`}>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                    placeholder="Ask about your extracted data..."
                    className="flex-1"
                  />
                  <div className="flex flex-col gap-2">
                    <VoiceInput onTranscript={handleVoiceTranscript} />
                    <Button onClick={handleAsk} disabled={analyzing}>
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">Create a project to start</p>
            </div>
          )}
        </Card>
      </div>

      <ProjectSelectionModal
        open={showProjectSelection}
        onClose={() => setShowProjectSelection(false)}
        onNewProject={handleNewProject}
        onExistingProject={handleExistingProject}
      />

      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onConfirm={handleProjectCreated}
      />

      <ExistingProjectSelector
        open={showExistingProject}
        onClose={() => setShowExistingProject(false)}
        onConfirm={handleExistingPlansSelected}
      />

      <MultiFileUploadDialog
        open={showMultiFileUpload}
        onClose={() => setShowMultiFileUpload(false)}
        onConfirm={handleFilesSelected}
        projectName={currentProjectName}
      />

      <DocumentTypeSelector
        open={showDocTypeSelector}
        onClose={() => setShowDocTypeSelector(false)}
        onConfirm={handleExtractionConfigConfirmed}
      />

    </div>
  );
}
