import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { BackgroundJobsProvider } from "@/contexts/BackgroundJobsContext";
import { BackgroundJobsStatusBar } from "@/components/BackgroundJobsStatusBar";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminDashboard } from "@/components/AdminDashboard";
import { BrowserCompatibilityChecker } from "@/components/BrowserCompatibilityChecker";
import BillingHistory from "@/components/BillingHistory";
import LicenseGuard from "@/components/LicenseGuard";


import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EstimationPage from "./pages/EstimationPage";
import EnhancedEstimationPage from "./pages/EnhancedEstimationPage";
import MaterialPricingPage from "./pages/MaterialPricingPage";
import TemplatesPage from "./pages/TemplatesPage";
import ProposalGeneratorPage from "./pages/ProposalGeneratorPage";
import ProposalTemplatesPage from "./pages/ProposalTemplatesPage";
import BulkImportPage from "./pages/BulkImportPage";
import TrainingPage from "./pages/TrainingPage";
import ScreenRecordingPage from "./pages/ScreenRecordingPage";
import VideoAnnotationPage from "./pages/VideoAnnotationPage";

import MobileFieldPage from "./pages/MobileFieldPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AccountPage from "./pages/AccountPage";
import MaterialsAndLaborPage from "./pages/MaterialsAndLaborPage";
import AnalysisHistoryPage from "./pages/AnalysisHistoryPage";
import AILearningPage from "./pages/AILearningPage";
import VideoAnalysisDashboard from "./pages/VideoAnalysisDashboard";
import AIPlanAnalysisPage from "./pages/AIPlanAnalysisPage";
import ExtractionTrainingPage from "./pages/ExtractionTrainingPage";
import FederatedLearningPage from "./pages/FederatedLearningPage";
import FineTuningPage from "./pages/FineTuningPage";
import TrainingDataCurationPage from "./pages/TrainingDataCurationPage";
import PlanValidationPage from "./pages/PlanValidationPage";
import ValidationAnalyticsPage from "./pages/ValidationAnalyticsPage";
import ConflictsPage from "./pages/ConflictsPage";
import UserAdminPage from "./pages/UserAdminPage";
import OrganizationPage from "./pages/OrganizationPage";








import ActivateLicensePage from "./pages/ActivateLicensePage";
import VerifyLicensePage from "./pages/VerifyLicensePage";
import MyLicensesPage from "./pages/MyLicensesPage";


import PlanRevisionPage from "./pages/PlanRevisionPage";
import PlanViewerPage from "./pages/PlanViewerPage";
import Model3DViewerPage from "./pages/Model3DViewerPage";
import NotFound from "./pages/NotFound";











const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <BackgroundJobsProvider>
            <TooltipProvider>
              <BrowserCompatibilityChecker />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <BackgroundJobsStatusBar />
                <LicenseGuard>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/estimation" element={<EstimationPage />} />
                  <Route path="/enhanced-estimation" element={<EnhancedEstimationPage />} />
                  <Route path="/material-pricing" element={<MaterialPricingPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/proposals" element={<ProposalGeneratorPage />} />
                  <Route path="/proposal-templates" element={<ProposalTemplatesPage />} />
                  <Route path="/bulk-import" element={<BulkImportPage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/analysis-history" element={<AnalysisHistoryPage />} />
                  <Route path="/ai-learning" element={<AILearningPage />} />
                  <Route path="/video-analysis" element={<VideoAnalysisDashboard />} />
                  <Route path="/ai-plan-analysis" element={<AIPlanAnalysisPage />} />
                  <Route path="/extraction-training" element={<ExtractionTrainingPage />} />
                  <Route path="/federated-learning" element={<FederatedLearningPage />} />
                  <Route path="/fine-tuning" element={<FineTuningPage />} />
                  <Route path="/training-curation" element={<TrainingDataCurationPage />} />
                  <Route path="/plan-validation" element={<PlanValidationPage />} />
                  <Route path="/validation-analytics" element={<ValidationAnalyticsPage />} />
                  <Route path="/conflicts" element={<ConflictsPage />} />





                  <Route path="/activate-license" element={<ActivateLicensePage />} />
                  <Route path="/verify-license" element={<VerifyLicensePage />} />
                  <Route path="/my-licenses" element={<MyLicensesPage />} />
                  <Route path="/plan-revisions" element={<PlanRevisionPage />} />
                  <Route path="/plan-viewer" element={<PlanViewerPage />} />
                  <Route path="/plan-viewer/:planId" element={<PlanViewerPage />} />
                  <Route path="/3d-viewer" element={<Model3DViewerPage />} />
                  <Route path="/3d-viewer/:planId" element={<Model3DViewerPage />} />
                  <Route path="/screen-recording" element={<ScreenRecordingPage />} />
                  <Route path="/video-annotation/:recordingId" element={<VideoAnnotationPage />} />

                  <Route path="/mobile-field" element={<MobileFieldPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/user-admin" element={<UserAdminPage />} />
                  <Route path="/organization" element={<OrganizationPage />} />


                  <Route path="/billing" element={<BillingHistory />} />
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </LicenseGuard>
              </BrowserRouter>
            </TooltipProvider>
          </BackgroundJobsProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
