import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface BackgroundJob {
  id: string;
  type: 'extraction' | 'analysis';
  planId: string;
  planName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentPage: number;
  totalPages: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  results?: {
    itemsExtracted: number;
    wallsFound: number;
    pagesProcessed: number;
  };
}

interface BackgroundJobsContextType {
  jobs: BackgroundJob[];
  activeJobs: BackgroundJob[];
  addJob: (job: Omit<BackgroundJob, 'id' | 'startedAt'>) => string;
  updateJob: (id: string, updates: Partial<BackgroundJob>) => void;
  removeJob: (id: string) => void;
  clearCompletedJobs: () => void;
  getJobByPlanId: (planId: string) => BackgroundJob | undefined;
  hasActiveJob: (planId: string) => boolean;
}

const BackgroundJobsContext = createContext<BackgroundJobsContextType | undefined>(undefined);

export function BackgroundJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const { toast } = useToast();

  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');

  const addJob = useCallback((job: Omit<BackgroundJob, 'id' | 'startedAt'>): string => {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newJob: BackgroundJob = {
      ...job,
      id,
      startedAt: new Date(),
    };
    setJobs(prev => [...prev, newJob]);

    toast({
      title: 'Extraction Started',
      description: `Processing ${job.planName} in the background. You can navigate away.`,
    });

    return id;
  }, [toast]);

  const updateJob = useCallback((id: string, updates: Partial<BackgroundJob>) => {
    setJobs(prev => prev.map(job => {
      if (job.id !== id) return job;

      const updated = { ...job, ...updates };

      // Show toast on completion
      if (updates.status === 'completed' && job.status !== 'completed') {
        toast({
          title: 'Extraction Complete!',
          description: `${job.planName}: ${updates.results?.itemsExtracted || 0} items extracted from ${updates.results?.pagesProcessed || 0} pages.`,
        });
      }

      // Show toast on failure
      if (updates.status === 'failed' && job.status !== 'failed') {
        toast({
          title: 'Extraction Failed',
          description: `${job.planName}: ${updates.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }

      return updated;
    }));
  }, [toast]);

  const removeJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  }, []);

  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status === 'pending' || job.status === 'processing'));
  }, []);

  const getJobByPlanId = useCallback((planId: string) => {
    return jobs.find(job => job.planId === planId);
  }, [jobs]);

  const hasActiveJob = useCallback((planId: string) => {
    return jobs.some(job =>
      job.planId === planId &&
      (job.status === 'pending' || job.status === 'processing')
    );
  }, [jobs]);

  return (
    <BackgroundJobsContext.Provider value={{
      jobs,
      activeJobs,
      addJob,
      updateJob,
      removeJob,
      clearCompletedJobs,
      getJobByPlanId,
      hasActiveJob,
    }}>
      {children}
    </BackgroundJobsContext.Provider>
  );
}

export function useBackgroundJobs() {
  const context = useContext(BackgroundJobsContext);
  if (!context) {
    throw new Error('useBackgroundJobs must be used within BackgroundJobsProvider');
  }
  return context;
}
