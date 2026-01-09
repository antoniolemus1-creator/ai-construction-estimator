import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Video, TrendingUp, Download, Search, Filter, BarChart3, PieChart, Activity, FileText, RefreshCw, AlertCircle, Clock } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import VideoAnalysisModal from '@/components/VideoAnalysisModal';
import OpenAIDiagnostics from '@/components/OpenAIDiagnostics';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



interface AnalyzedVideo {
  id: string;
  video_id: string;
  video_title: string;
  analysis_results: any;
  concepts_count: number;
  created_at: string;
  thumbnail_url?: string;
  analysis_status?: string;
  retry_count?: number;
  last_error?: string;
  last_error_at?: string;
  next_retry_at?: string;
}


const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function VideoAnalysisDashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<AnalyzedVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<AnalyzedVideo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<AnalyzedVideo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);


  // Removed retry functionality - all video analysis happens in Training Videos tab

  const getStatusBadge = (video: AnalyzedVideo) => {
    const status = video.analysis_status || 'completed';
    
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-500">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'retrying':
        return <Badge variant="secondary" className="bg-yellow-500">Retrying</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };



  useEffect(() => {
    loadVideos();
  }, [user]);

  useEffect(() => {
    filterAndSortVideos();
  }, [videos, searchTerm, difficultyFilter, sortBy]);

  const loadVideos = async () => {
    if (!user) {
      console.log('No user found');
      setLoading(false);
      return;
    }
    
    console.log('Loading videos for user:', user.id);
    const { data, error } = await supabase
      .from('analyzed_videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading videos:', error);
      toast.error('Failed to load videos: ' + error.message);
    } else {
      console.log('Loaded videos:', data);
      if (data) setVideos(data);
    }
    setLoading(false);
  };


  const filterAndSortVideos = () => {
    let filtered = videos.filter(v => {
      const matchesSearch = v.video_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || 
        v.analysis_results?.difficultyLevel === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'concepts') return b.concepts_count - a.concepts_count;
      if (sortBy === 'title') return a.video_title.localeCompare(b.video_title);
      return 0;
    });

    setFilteredVideos(filtered);
  };

  const exportCSV = () => {
    const csv = [
      ['Title', 'Concepts', 'Difficulty', 'Analysis Date', 'Materials', 'Techniques'].join(','),
      ...filteredVideos.map(v => [
        `"${v.video_title}"`,
        v.concepts_count,
        v.analysis_results?.difficultyLevel || 'N/A',
        new Date(v.created_at).toLocaleDateString(),
        v.analysis_results?.materialsMentioned?.length || 0,
        v.analysis_results?.techniquesDescribed?.length || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const exportPDF = () => {
    toast.info('PDF export coming soon');
  };

  const conceptsOverTime = videos.slice(0, 10).reverse().map(v => ({
    date: new Date(v.created_at).toLocaleDateString(),
    concepts: v.concepts_count
  }));

  const allConcepts = videos.flatMap(v => 
    v.analysis_results?.keyConcepts?.map((c: any) => c.name) || []
  );
  const conceptCounts = allConcepts.reduce((acc: any, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const topConcepts = Object.entries(conceptCounts)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const difficultyDist = videos.reduce((acc: any, v) => {
    const level = v.analysis_results?.difficultyLevel || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  const difficultyData = Object.entries(difficultyDist).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Video Analysis Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Brain className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Concepts</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.reduce((sum, v) => sum + v.concepts_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Concepts/Video</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.length ? (videos.reduce((sum, v) => sum + v.concepts_count, 0) / videos.length).toFixed(1) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Concepts Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={conceptsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="concepts" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <OpenAIDiagnostics />

      <Card>
        <CardHeader>
          <CardTitle>Most Common Concepts</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topConcepts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Analyzed Videos</CardTitle>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="concepts">Sort by Concepts</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Concepts</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>

            </TableHeader>
            <TableBody>
              {filteredVideos.map(v => (
                <TableRow 
                  key={v.id} 
                  className="hover:bg-muted/50"
                >
                  <TableCell 
                    className="font-medium cursor-pointer"
                    onClick={() => {
                      setSelectedVideo(v);
                      setModalOpen(true);
                    }}
                  >
                    {v.video_title}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(v)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{v.concepts_count || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      v.analysis_results?.difficultyLevel === 'beginner' ? 'default' :
                      v.analysis_results?.difficultyLevel === 'intermediate' ? 'secondary' : 'destructive'
                    }>
                      {v.analysis_results?.difficultyLevel || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(v.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {v.analysis_status === 'failed' && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          Failed - Retry in Training Tab
                        </Badge>
                        {v.last_error && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.error(v.last_error, { duration: 5000 });
                            }}
                          >
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                    {v.retry_count && v.retry_count > 0 && v.analysis_status !== 'failed' && (
                      <Badge variant="outline" className="text-xs">
                        Retry {v.retry_count}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}

            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VideoAnalysisModal
        video={selectedVideo}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedVideo(null);
        }}
        onUpdate={loadVideos}
      />
    </div>
  );
}
