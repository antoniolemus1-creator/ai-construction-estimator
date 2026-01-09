import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VideoAnnotation, WorkflowStep } from '@/types/videoAnnotations';
import { FileText, Download, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface WorkflowDocumentationGeneratorProps {
  annotations: VideoAnnotation[];
  recordingId: string;
  onSave: (title: string, description: string, steps: WorkflowStep[]) => void;
}

export function WorkflowDocumentationGenerator({
  annotations,
  recordingId,
  onSave
}: WorkflowDocumentationGeneratorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const addStepFromAnnotation = (annotation: VideoAnnotation) => {
    const newStep: WorkflowStep = {
      step_number: steps.length + 1,
      timestamp_ms: annotation.timestamp_ms,
      title: annotation.title || `Step ${steps.length + 1}`,
      description: annotation.description || '',
      annotations: [annotation.id]
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      step_number: i + 1
    })));
  };

  const exportToMarkdown = () => {
    let markdown = `# ${title}\n\n${description}\n\n## Steps\n\n`;
    steps.forEach(step => {
      markdown += `### ${step.step_number}. ${step.title}\n\n`;
      markdown += `**Timestamp:** ${Math.floor(step.timestamp_ms / 1000)}s\n\n`;
      markdown += `${step.description}\n\n`;
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
  };

  const workflowAnnotations = annotations.filter(a => a.type === 'workflow_step');

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Workflow Documentation
        </h3>
        <Button onClick={exportToMarkdown} disabled={steps.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Workflow Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter workflow title..."
            className="bg-gray-800 border-gray-700"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the workflow..."
            className="bg-gray-800 border-gray-700"
            rows={3}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Available Annotations</Label>
            <ScrollArea className="h-[300px] border border-gray-800 rounded-lg p-2">
              {workflowAnnotations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No workflow steps yet
                </p>
              ) : (
                <div className="space-y-2">
                  {workflowAnnotations.map(annotation => (
                    <Card key={annotation.id} className="p-2 bg-gray-800 border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{annotation.title}</p>
                          <p className="text-xs text-gray-400">
                            {Math.floor(annotation.timestamp_ms / 1000)}s
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addStepFromAnnotation(annotation)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div>
            <Label className="mb-2 block">Workflow Steps ({steps.length})</Label>
            <ScrollArea className="h-[300px] border border-gray-800 rounded-lg p-2">
              {steps.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Add steps from annotations
                </p>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <Card key={index} className="p-2 bg-gray-800 border-gray-700">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{step.step_number}</Badge>
                            <p className="text-sm font-medium text-white">{step.title}</p>
                          </div>
                          <p className="text-xs text-gray-400">{step.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <Button
          onClick={() => onSave(title, description, steps)}
          disabled={!title || steps.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-600"
        >
          Save Workflow Documentation
        </Button>
      </div>
    </Card>
  );
}
