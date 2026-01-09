import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { detectBrowser, isSecureContext, hasScreenCaptureAPI } from '@/lib/browserDetection';

interface CompatibilityIssue {
  type: 'browser' | 'api' | 'security' | 'permission';
  severity: 'error' | 'warning';
  message: string;
}

export function BrowserCompatibilityChecker() {
  const [open, setOpen] = useState(false);
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [browserInfo, setBrowserInfo] = useState(detectBrowser());

  useEffect(() => {
    checkCompatibility();
  }, []);

  const checkCompatibility = () => {
    const detectedIssues: CompatibilityIssue[] = [];
    const browser = detectBrowser();
    setBrowserInfo(browser);

    if (!browser.isSupported) {
      detectedIssues.push({
        type: 'browser',
        severity: 'error',
        message: `${browser.name} version ${browser.version} is outdated. Please update to the latest version.`
      });
    }

    if (!isSecureContext()) {
      detectedIssues.push({
        type: 'security',
        severity: 'error',
        message: 'App must run on HTTPS or localhost for screen recording.'
      });
    }

    if (!hasScreenCaptureAPI()) {
      detectedIssues.push({
        type: 'api',
        severity: 'error',
        message: 'Screen capture API not available in this browser.'
      });
    }

    setIssues(detectedIssues);
    if (detectedIssues.length > 0) {
      setOpen(true);
    }
  };

  const getBrowserInstructions = () => {
    switch (browserInfo.name) {
      case 'Chrome':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Chrome Setup:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Ensure you're using Chrome 72+</li>
              <li>Access via HTTPS or localhost</li>
              <li>Click "Share your screen" when prompted</li>
              <li>Select "Entire Screen" or "Window"</li>
              <li>Check "Share audio" if needed</li>
            </ol>
          </div>
        );
      case 'Firefox':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Firefox Setup:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Ensure you're using Firefox 66+</li>
              <li>Access via HTTPS or localhost</li>
              <li>Grant permission when prompted</li>
              <li>Select screen/window to share</li>
            </ol>
          </div>
        );
      case 'Safari':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Safari Setup:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Ensure you're using Safari 13+</li>
              <li>Go to Safari → Preferences → Websites</li>
              <li>Enable "Screen Recording" for this site</li>
              <li>Reload the page after enabling</li>
            </ol>
          </div>
        );
      case 'Edge':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Edge Setup:</h4>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Ensure you're using Edge 79+</li>
              <li>Access via HTTPS or localhost</li>
              <li>Click "Share" when prompted</li>
              <li>Select screen/window to share</li>
            </ol>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Recommended Browsers:</h4>
            <p className="text-sm">Chrome 72+, Firefox 66+, Safari 13+, or Edge 79+</p>
          </div>
        );
    }
  };

  if (issues.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Browser Compatibility Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {issues.map((issue, idx) => (
              <Alert key={idx} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                <XCircle className="h-4 w-4" />
                <AlertDescription>{issue.message}</AlertDescription>
              </Alert>
            ))}
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            {getBrowserInstructions()}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Quick Fixes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Update your browser to the latest version</li>
              <li>✓ Use HTTPS or localhost (not HTTP)</li>
              <li>✓ Allow permissions when prompted</li>
              <li>✓ Restart browser after updates</li>
            </ul>
          </div>

          <Button onClick={() => { checkCompatibility(); setOpen(false); }} className="w-full">
            Recheck Compatibility
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
