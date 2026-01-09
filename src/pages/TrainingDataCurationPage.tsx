import { useEffect } from 'react';
import TrainingDataCurationInterface from '@/components/TrainingDataCurationInterface';

export default function TrainingDataCurationPage() {
  useEffect(() => {
    document.title = 'Training Data Curation - AI Construction Estimator';
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <TrainingDataCurationInterface />
    </div>
  );
}