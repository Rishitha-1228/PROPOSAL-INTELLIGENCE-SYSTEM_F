import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle2, Clock, FileText, Zap } from 'lucide-react';
import SessionDetail from '@/components/SessionDetail';
import PayloadPreview from '@/components/PayloadPreview';

interface DiscoverySession {
  id: number;
  opportunityId: string;
  status: 'open' | 'in_progress' | 'submitted' | 'completed';
  programmeKind: 'new' | 'repeat' | 'new_content_same_cohort';
  totalQuestions: number;
  answeredCount: number;
  skippedByRuleCount: number;
  systemConfirmedCount: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedSession, setSelectedSession] = useState<DiscoverySession | null>(null);
  const [opportunityId, setOpportunityId] = useState<string>('');
  const [showSessionDetail, setShowSessionDetail] = useState(false);

  // Fetch sessions for opportunity
  const { data: sessions, isLoading: sessionsLoading } = trpc.discovery.getSessionsByOpportunity.useQuery(
    { opportunityId },
    { enabled: !!opportunityId }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please sign in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'outline', icon: Clock },
      in_progress: { variant: 'secondary', icon: Zap },
      submitted: { variant: 'default', icon: CheckCircle2 },
      completed: { variant: 'default', icon: CheckCircle2 },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const getProgrammeKindLabel = (kind: string) => {
    const labels: Record<string, string> = {
      new: 'New Programme',
      repeat: 'Repeat Programme',
      new_content_same_cohort: 'New Content, Same Cohort',
    };
    return labels[kind] || kind;
  };

  const getCompletionPercentage = (session: DiscoverySession) => {
    const completed = session.answeredCount + session.skippedByRuleCount + session.systemConfirmedCount;
    return Math.round((completed / session.totalQuestions) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Discovery Questions Management
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Manage discovery sessions and track question responses across opportunities
          </p>
        </div>

        {/* Opportunity Filter */}
        <Card className="mb-8 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Filter by Opportunity</CardTitle>
            <CardDescription>Enter an opportunity ID to view its discovery sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter opportunity ID..."
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={() => setOpportunityId(opportunityId)} className="bg-blue-600 hover:bg-blue-700">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {opportunityId && (
          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session: DiscoverySession) => (
                <Card
                  key={session.id}
                  className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedSession(session);
                    setShowSessionDetail(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">Session #{session.id}</CardTitle>
                          {getStatusBadge(session.status)}
                        </div>
                        <CardDescription className="text-base">
                          {getProgrammeKindLabel(session.programmeKind)} • Opportunity: {session.opportunityId}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Completion Progress
                          </span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {getCompletionPercentage(session)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getCompletionPercentage(session)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {session.answeredCount}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Answered</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {session.skippedByRuleCount}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Skipped</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {session.systemConfirmedCount}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Confirmed</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {session.totalQuestions}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total</div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                        {session.submittedAt && (
                          <span>Submitted: {new Date(session.submittedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="py-8">
                  <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>No discovery sessions found for this opportunity</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Session Detail Modal */}
        {showSessionDetail && selectedSession && (
          <SessionDetail
            session={selectedSession}
            onClose={() => {
              setShowSessionDetail(false);
              setSelectedSession(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
