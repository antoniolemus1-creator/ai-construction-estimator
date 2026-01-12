import { useState } from 'react';
import { useBackgroundJobs, BackgroundJob } from '@/contexts/BackgroundJobsContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Loader2, CheckCircle2, XCircle, ChevronUp, ChevronDown,
  FileText, Trash2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function JobStatusIcon({ status }: { status: BackgroundJob['status'] }) {
  switch (status) {
    case 'pending':
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function JobItem({ job, onRemove }: { job: BackgroundJob; onRemove: () => void }) {
  const navigate = useNavigate();
  const isActive = job.status === 'pending' || job.status === 'processing';

  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <JobStatusIcon status={job.status} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{job.planName}</p>
            <p className="text-xs text-muted-foreground">{job.message}</p>
          </div>
        </div>
        {!isActive && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isActive && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Page {job.currentPage} of {job.totalPages}</span>
            <span>{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="h-1.5" />
        </div>
      )}

      {job.status === 'completed' && job.results && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {job.results.itemsExtracted} items
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {job.results.wallsFound} walls
          </Badge>
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0 ml-auto"
            onClick={() => navigate(`/plan-viewer/${job.planId}`)}
          >
            View Results
          </Button>
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <p className="mt-2 text-xs text-red-500">{job.error}</p>
      )}
    </div>
  );
}

export function BackgroundJobsStatusBar() {
  const { jobs, activeJobs, removeJob, clearCompletedJobs } = useBackgroundJobs();
  const [expanded, setExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Don't render if no jobs
  if (jobs.length === 0) return null;

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  // Current active job for mini display
  const currentJob = activeJobs[0];

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="container mx-auto">
          {/* Mini status bar */}
          <div
            className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50"
            onClick={() => setSheetOpen(true)}
          >
            <div className="flex items-center gap-3">
              {activeJobs.length > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activeJobs.length === 1
                        ? `Extracting: ${currentJob?.planName}`
                        : `${activeJobs.length} extractions in progress`}
                    </p>
                    {currentJob && (
                      <p className="text-xs text-muted-foreground">
                        {currentJob.message} - Page {currentJob.currentPage}/{currentJob.totalPages}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm">
                    {completedJobs.length} extraction{completedJobs.length !== 1 ? 's' : ''} complete
                    {failedJobs.length > 0 && `, ${failedJobs.length} failed`}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeJobs.length > 0 && currentJob && (
                <div className="w-32">
                  <Progress value={currentJob.progress} className="h-1.5" />
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </Badge>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Background Jobs</SheetTitle>
            {completedJobs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompletedJobs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Completed
              </Button>
            )}
          </SheetHeader>

          <div className="mt-4 space-y-3 overflow-y-auto max-h-[300px]">
            {jobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No background jobs
              </p>
            ) : (
              jobs.map(job => (
                <JobItem
                  key={job.id}
                  job={job}
                  onRemove={() => removeJob(job.id)}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add padding to body so content isn't hidden behind the bar */}
      <style>{`
        body { padding-bottom: 60px; }
      `}</style>
    </>
  );
}

export default BackgroundJobsStatusBar;
