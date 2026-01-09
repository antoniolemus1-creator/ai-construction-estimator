import { useState, useEffect } from 'react';
import { Upload, MessageSquare, Loader2, FileText, Eye, AlertCircle, Settings, CheckCircle2 } from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { VisionExtractorPanel } from './VisionExtractorPanel';
import { TakeoffDataViewer } from './TakeoffDataViewer';
import { TakeoffDataEditor } from './TakeoffDataEditor';
import { AIExtractionSettings } from './AIExtractionSettings';
import { PlanExtractionValidator } from './PlanExtractionValidator';
import { DocumentTypeSelector, ExtractionConfig } from './DocumentTypeSelector';

interface AIPlanAnalyzerProps {
  planId?: string;
  extractionConfig?: ExtractionConfig;
}

export function AIPlanAnalyzer({ planId, extractionConfig: initialConfig }: AIPlanAnalyzerProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansWithData, setPlansWithData] = useState<Set<string>>(new Set());
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [hasExtractedData, setHasExtractedData] = useState(false);
  const [activeTab, setActiveTab] = useState('extract');
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig | undefined>(initialConfig);
  const { toast } = useToast();



  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      console.log('Selected plan changed:', selectedPlan.id);
      loadExtractedData(selectedPlan.id);
      loadConversation(selectedPlan.id);
    }
  }, [selectedPlan]);

  // Reload extracted data when switching to chat or view tabs
  useEffect(() => {
    if (selectedPlan && (activeTab === 'chat' || activeTab === 'takeoff' || activeTab === 'edit')) {
      console.log('Tab changed to', activeTab, '- reloading extracted data');
      loadExtractedData(selectedPlan.id);
    }
  }, [activeTab, selectedPlan]);


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Upload file first, then show document type selector
    setPendingFile(file);
    uploadPlanFile(file);
  };

  const uploadPlanFile = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('construction-plans')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          project_name: file.name.replace('.pdf', ''),
          file_path: fileName,
          file_url: fileName,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: 'Plan uploaded successfully!',
        description: 'Now configure extraction settings'
      });
      
      setSelectedPlan(data);
      loadPlans();
      
      // Show document type selector after upload
      setShowDocTypeSelector(true);
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleExtractionConfigConfirmed = async (config: ExtractionConfig) => {
    setExtractionConfig(config);
    
    // Save extraction config to the plan record
    if (selectedPlan) {
      await supabase
        .from('plans')
        .update({
          extraction_config: config,
          document_type: config.documentType === 'plans' ? 'drawings' : 
                        config.documentType === 'specs' ? 'specifications' : 'both',
          has_specifications: config.documentType !== 'plans',
        })
        .eq('id', selectedPlan.id);
    }

    toast({ 
      title: 'Configuration saved', 
      description: 'Ready to extract data with your specified settings.' 
    });
  };



  const loadPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    
    if (data) {
      setPlans(data);
      
      // Check which plans have extracted data
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
    console.log('Loading extracted data for plan:', planId);
    const { data, error } = await supabase
      .from('takeoff_data')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading extracted data:', error);
      setExtractedItems([]);
      setHasExtractedData(false);
      return;
    }
    
    console.log('Loaded extracted items:', data?.length || 0, 'items');
    if (data && data.length > 0) {
      console.log('Sample item:', data[0]);
    }
    setExtractedItems(data || []);
    setHasExtractedData((data || []).length > 0);
    
    // Update the plans with data indicator
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

  const handleExtractionComplete = (switchToChat?: boolean) => {
    if (selectedPlan) {
      loadExtractedData(selectedPlan.id);
      
      // Automatically switch to chat tab if requested
      if (switchToChat) {
        setTimeout(() => {
          setActiveTab('chat');
        }, 500);
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setPrompt(prev => prev ? `${prev} ${text}` : text);
  };
  const handleAsk = async () => {
    if (!prompt.trim() || !selectedPlan) return;

    setAnalyzing(true);
    try {
      // Diagnostic: Check session state
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('=== CLIENT AUTH CHECK ===');
      console.log('Session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        tokenPrefix: session?.access_token?.slice(0, 20) || 'none',
        expiresAt: session?.expires_at,
        expiresIn: session?.expires_at ? Math.floor((session.expires_at - Date.now() / 1000) / 60) + ' minutes' : 'N/A'
      });

      if (!session?.access_token) {
        throw new Error('No active session. Please log out and log back in.');
      }

      // Check if token is about to expire (less than 5 minutes)
      if (session.expires_at && (session.expires_at - Date.now() / 1000) < 300) {
        console.warn('Token expiring soon, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error('Session expired. Please log out and log back in.');
        }
        console.log('Session refreshed successfully');
      }

      // Get the plan's image URL from storage
      const { data: publicUrlData } = supabase.storage
        .from('construction-plans')
        .getPublicUrl(selectedPlan.file_path || selectedPlan.file_url);
      
      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not get plan image URL');
      }

      console.log('Calling function with:', {
        imageUrl: publicUrlData.publicUrl.slice(0, 50) + '...',
        planType: selectedPlan.document_type || 'construction',
        hasExtractedData,
        itemCount: extractedItems.length
      });

      // Use supabase.functions.invoke which automatically includes the auth header
      const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
        body: { 
          imageUrl: publicUrlData.publicUrl,
          planType: selectedPlan.document_type || 'construction',
          prompt,
          extractedData: extractedItems,
          hasVisionData: hasExtractedData
        }
      });

      if (error) {
        console.error('Function error:', error);
        
        // Provide helpful error messages based on error code
        let errorMessage = error.message || 'Function invocation failed';
        if (error.message?.includes('401') || error.message?.includes('authentication')) {
          errorMessage = 'Authentication failed. Please try:\n1. Log out and log back in\n2. Refresh the page\n3. Check browser console for details';
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Function response:', data);

      // Save the conversation locally
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        message: prompt,
        created_at: new Date().toISOString()
      };
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        message: data.response || data.extractedData || 'Analysis complete',
        created_at: new Date().toISOString()
      };
      
      setConversation(prev => [...prev, userMessage, aiMessage]);

      toast({ 
        title: 'Analysis complete!',
        description: data.response ? 'AI responded successfully' : `Found ${data.takeoffItemsCount || 0} items`
      });
      
      setPrompt('');
      
      // Reload extracted data if new items were found
      if (data.takeoffItemsCount > 0) {
        loadExtractedData(selectedPlan.id);
      }
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      toast({ 
        title: 'Analysis failed', 
        description: error.message || 'An unexpected error occurred. Check console for details.', 
        variant: 'destructive' 
      });
    } finally {
      setAnalyzing(false);
    }
  };





  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Your Plans
        </h3>
        <label className="block">
          <Button disabled={uploading} className="w-full" asChild>
            <span>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Plans
            </span>
          </Button>
          <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

        </label>
        <div className="mt-4 space-y-2">
          {plans.map(plan => (
            <Card 
              key={plan.id} 
              className={`p-3 cursor-pointer transition-colors ${selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{plan.project_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(plan.upload_date).toLocaleDateString()}</p>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="extract">1. Extract</TabsTrigger>
              <TabsTrigger value="chat">2. Chat</TabsTrigger>
              <TabsTrigger value="takeoff">3. View</TabsTrigger>
              <TabsTrigger value="edit">4. Edit</TabsTrigger>
              <TabsTrigger value="validate">5. Validate</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4" />
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
                    Please configure extraction settings first by uploading a plan.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="chat" className="mt-4">
              {!hasExtractedData ? (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Extract data first!</strong> Go to the "Vision Extract" tab to extract takeoff data from your plans before using AI Chat.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <Eye className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{extractedItems.length} items extracted!</strong> Ask questions about your plan data below.
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
                  placeholder={hasExtractedData 
                    ? "Type or use voice: 'What's the total wall length?' or 'How many doors?'" 
                    : "Extract data first, then ask questions here..."
                  }
                  disabled={!hasExtractedData} 
                  className="flex-1"
                />
                <div className="flex flex-col gap-2">
                  <VoiceInput 
                    onTranscript={handleVoiceTranscript} 
                    disabled={!hasExtractedData}
                  />
                  <Button onClick={handleAsk} disabled={analyzing || !hasExtractedData}>
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="takeoff" className="mt-4">
              <TakeoffDataViewer planId={selectedPlan.id} />
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <TakeoffDataEditor planId={selectedPlan.id} />
            </TabsContent>

            <TabsContent value="validate" className="mt-4">
              {selectedPlan.file_url ? (
                <PlanExtractionValidator planId={selectedPlan.id} planImageUrl={selectedPlan.file_url} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Plan image not available for validation.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <AIExtractionSettings />
            </TabsContent>


          </Tabs>
        ) : (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Select a plan to start</p>
            <p className="text-sm text-muted-foreground mt-2">Step 1: Upload and configure extraction</p>
            <p className="text-sm text-muted-foreground">Step 2: Extract data with AI Vision</p>
            <p className="text-sm text-muted-foreground">Step 3: Chat with AI about your data</p>
          </div>
        )}
      </Card>

      <DocumentTypeSelector
        open={showDocTypeSelector}
        onClose={() => {
          setShowDocTypeSelector(false);
          setPendingFile(null);
        }}
        onConfirm={handleExtractionConfigConfirmed}
      />
    </div>
  );
}

