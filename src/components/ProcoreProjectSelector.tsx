import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  project_number?: string;
}

interface Props {
  accessToken: string;
  companyId: string;
  onProjectSelected: (projectId: string, projectName: string) => void;
}

export default function ProcoreProjectSelector({ accessToken, companyId, onProjectSelected }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('procore-api', {
        body: { action: 'get_projects', accessToken, companyId }
      });

      if (error) throw error;
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast({ title: 'Error', description: 'Failed to load Procore projects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      onProjectSelected(projectId, project.name);
      toast({ title: 'Project Selected', description: `Connected to ${project.name}` });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Select Procore Project
        </CardTitle>
        <CardDescription>Choose a project to sync estimates and photos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedProject} onValueChange={handleSelectProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name} {project.project_number ? `(${project.project_number})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedProject && (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Project Connected
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
