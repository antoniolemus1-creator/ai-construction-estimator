import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Award, TrendingUp, CheckCircle, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ContributionDashboard() {
  const [stats, setStats] = useState({
    totalContributions: 0,
    feedbackProvided: 0,
    clarificationsAnswered: 0,
    accuracyImprovement: 0
  });
  const [recentContributions, setRecentContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [feedbackRes, clarificationsRes, contributionsRes] = await Promise.all([
      supabase.from('extraction_feedback').select('*').eq('user_id', user.id),
      supabase.from('ai_clarification_questions').select('*').eq('answered_by', user.id).not('answer', 'is', null),
      supabase.from('federated_contributions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    ]);

    const feedback = feedbackRes.data || [];
    const clarifications = clarificationsRes.data || [];
    const contributions = contributionsRes.data || [];

    setStats({
      totalContributions: contributions.length,
      feedbackProvided: feedback.length,
      clarificationsAnswered: clarifications.length,
      accuracyImprovement: contributions.reduce((sum, c) => sum + (c.accuracy_improvement || 0), 0)
    });

    setRecentContributions(contributions);
    setLoading(false);
  };

  const contributionLevel = stats.totalContributions < 10 ? 'Beginner' : 
                           stats.totalContributions < 50 ? 'Contributor' :
                           stats.totalContributions < 100 ? 'Expert' : 'Master';

  const progressToNext = stats.totalContributions < 10 ? (stats.totalContributions / 10) * 100 :
                        stats.totalContributions < 50 ? ((stats.totalContributions - 10) / 40) * 100 :
                        stats.totalContributions < 100 ? ((stats.totalContributions - 50) / 50) * 100 : 100;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Learning Contributions</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributionLevel}</div>
            <Progress value={progressToNext} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(progressToNext)}% to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContributions}</div>
            <p className="text-xs text-muted-foreground">Helping improve the AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Given</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.feedbackProvided}</div>
            <p className="text-xs text-muted-foreground">Extraction reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.accuracyImprovement.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Model improvement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentContributions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No contributions yet. Start by providing feedback on extractions!
            </p>
          ) : (
            <div className="space-y-3">
              {recentContributions.map((contrib) => (
                <div key={contrib.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{contrib.contribution_type.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(contrib.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      +{contrib.accuracy_improvement?.toFixed(1)}% accuracy
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
