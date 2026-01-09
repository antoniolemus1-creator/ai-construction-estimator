import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AccuracyTrendChart } from './analytics/AccuracyTrendChart';
import { ConfidenceDistributionChart } from './analytics/ConfidenceDistributionChart';
import { CommonCorrectionsTable } from './analytics/CommonCorrectionsTable';
import { UserActivityChart } from './analytics/UserActivityChart';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';

export function ValidationAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [accuracyData, setAccuracyData] = useState<any[]>([]);
  const [confidenceData, setConfidenceData] = useState<any[]>([]);
  const [correctionsData, setCorrectionsData] = useState<any[]>([]);
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, corrected: 0, flagged: 0 });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: validations } = await supabase
        .from('plan_extraction_validations')
        .select('*, user_profiles(full_name)')
        .order('validated_at', { ascending: true });

      if (!validations) return;

      // Calculate stats
      const total = validations.length;
      const verified = validations.filter(v => v.validation_status === 'verified').length;
      const corrected = validations.filter(v => v.validation_status === 'needs_correction').length;
      const flagged = validations.filter(v => v.validation_status === 'incorrect').length;
      setStats({ total, verified, corrected, flagged });

      // Accuracy trend
      const dailyStats = new Map();
      validations.forEach(v => {
        const date = new Date(v.validated_at).toLocaleDateString();
        if (!dailyStats.has(date)) dailyStats.set(date, { verified: 0, total: 0 });
        const day = dailyStats.get(date);
        day.total++;
        if (v.validation_status === 'verified') day.verified++;
      });
      const trend = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        accuracy: (stats.verified / stats.total) * 100,
        totalValidations: stats.total
      }));
      setAccuracyData(trend);

      // Confidence distribution
      const ranges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
      const distribution = ranges.map(range => {
        const [min, max] = range.split('-').map(s => parseInt(s));
        const inRange = validations.filter(v => {
          const conf = (v.confidence_score || 0) * 100;
          return conf >= min && conf <= max;
        });
        return {
          range,
          count: inRange.length,
          verified: inRange.filter(v => v.validation_status === 'verified').length,
          incorrect: inRange.filter(v => v.validation_status === 'incorrect').length
        };
      });
      setConfidenceData(distribution);

      // Common corrections
      const fieldCounts = new Map();
      validations.filter(v => v.corrected_data).forEach(v => {
        Object.keys(v.corrected_data || {}).forEach(field => {
          fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
        });
      });
      const corrections = Array.from(fieldCounts.entries())
        .map(([field, count]) => ({
          field,
          count,
          percentage: (count / corrected) * 100,
          commonIssue: 'Measurement accuracy'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setCorrectionsData(corrections);

      // User activity
      const userStats = new Map();
      validations.forEach(v => {
        const userName = v.user_profiles?.full_name || 'Unknown';
        if (!userStats.has(userName)) {
          userStats.set(userName, { validated: 0, corrected: 0, flagged: 0 });
        }
        const stats = userStats.get(userName);
        if (v.validation_status === 'verified') stats.validated++;
        if (v.validation_status === 'needs_correction') stats.corrected++;
        if (v.validation_status === 'incorrect') stats.flagged++;
      });
      const activity = Array.from(userStats.entries())
        .map(([user, stats]) => ({ user, ...stats }))
        .sort((a, b) => (b.validated + b.corrected + b.flagged) - (a.validated + a.corrected + a.flagged))
        .slice(0, 10);
      setUserActivityData(activity);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Correction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.corrected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flagged Incorrect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccuracyTrendChart data={accuracyData} />
        <ConfidenceDistributionChart data={confidenceData} />
      </div>

      <CommonCorrectionsTable corrections={correctionsData} />
      <UserActivityChart data={userActivityData} />
    </div>
  );
}
