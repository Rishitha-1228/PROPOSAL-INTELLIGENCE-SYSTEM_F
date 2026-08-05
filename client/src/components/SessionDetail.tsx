import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import PayloadPreview from './PayloadPreview';

interface SessionDetailProps {
  session: any;
  onClose: () => void;
}

export default function SessionDetail({ session, onClose }: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch session answers
  const { data: answers, isLoading: answersLoading } = trpc.discovery.getSessionAnswers.useQuery({
    sessionId: session.id,
  });

  // Fetch completion status
  const { data: completion } = trpc.discovery.checkCompletion.useQuery({
    sessionId: session.id,
  });

  // Fetch validation status
  const { data: validation } = trpc.discovery.validateTransition.useQuery({
    sessionId: session.id,
  });

  // Submit mutation
  const submitMutation = trpc.discovery.submitSession.useMutation({
    onSuccess: () => {
      alert('Session submitted successfully!');
      onClose();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const getStateIcon = (state: string) => {
    const icons: Record<string, any> = {
      answered: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      skipped_by_rule: <Clock className="w-4 h-4 text-amber-600" />,
      system_confirmed: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
      pending: <AlertCircle className="w-4 h-4 text-slate-400" />,
    };
    return icons[state] || icons.pending;
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      answered: 'Answered',
      skipped_by_rule: 'Skipped by Rule',
      system_confirmed: 'System Confirmed',
      pending: 'Pending',
    };
    return labels[state] || state;
  };

  const groupAnswersByTheme = (answers: any[]) => {
    const grouped: Record<string, any[]> = {};
    answers.forEach((answer) => {
      if (!grouped[answer.themeCode]) {
        grouped[answer.themeCode] = [];
      }
      grouped[answer.themeCode].push(answer);
    });
    return grouped;
  };

  const themeLabels: Record<string, string> = {
    BCS: 'Business Context & Strategic Trigger',
    AUD: 'Audience Politics & Cohort Dynamics',
    BAS: 'Capability Baseline',
    BEH: 'Target Behaviour',
    PED: 'Pedagogical Approach',
    DEC: 'Decision Dynamics',
    FOL: 'Follow-up & Measurement',
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Discovery Session #{session.id}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="answers">Answers</TabsTrigger>
            <TabsTrigger value="payloads">Payloads</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                    <p className="text-lg font-semibold mt-1">{session.status.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Programme Kind</label>
                    <p className="text-lg font-semibold mt-1">
                      {session.programmeKind.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Opportunity ID</label>
                    <p className="text-lg font-semibold mt-1">{session.opportunityId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</label>
                    <p className="text-lg font-semibold mt-1">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm font-bold text-blue-600">
                      {completion
                        ? Math.round(
                            ((completion.totalRequired - completion.missingAnswers.length) /
                              completion.totalRequired) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: completion
                          ? `${Math.round(
                              ((completion.totalRequired - completion.missingAnswers.length) /
                                completion.totalRequired) *
                                100
                            )}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 pt-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{session.answeredCount}</div>
                    <div className="text-xs text-green-700 dark:text-green-400 mt-1">Answered</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-600">{session.skippedByRuleCount}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">Skipped by Rule</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{session.systemConfirmedCount}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">System Confirmed</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {session.totalQuestions}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-400 mt-1">Total Questions</div>
                  </div>
                </div>

                {/* Submit Button */}
                {session.status === 'open' && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => submitMutation.mutate({ sessionId: session.id })}
                      disabled={!completion?.isComplete || submitMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Spinner className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Session'
                      )}
                    </Button>
                    {!completion?.isComplete && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        Complete all questions before submitting
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Answers Tab */}
          <TabsContent value="answers" className="space-y-4">
            {answersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : answers ? (
              Object.entries(groupAnswersByTheme(answers)).map(([themeCode, themeAnswers]) => (
                <Card key={themeCode}>
                  <CardHeader>
                    <CardTitle className="text-lg">{themeLabels[themeCode] || themeCode}</CardTitle>
                    <CardDescription>Theme Code: {themeCode}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(themeAnswers as any[]).map((answer) => (
                      <div key={answer.id} className="border-l-4 border-slate-200 dark:border-slate-700 pl-4 py-2">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">{answer.questionText}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {getStateIcon(answer.state)}
                            <Badge variant="outline">{getStateLabel(answer.state)}</Badge>
                          </div>
                        </div>
                        {answer.answerText && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900 p-3 rounded">
                            {answer.answerText}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-slate-600 dark:text-slate-400">No answers found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payloads Tab */}
          <TabsContent value="payloads" className="space-y-4">
            {session.status === 'submitted' || session.status === 'completed' ? (
              <>
                <PayloadPreview sessionId={session.id} stageType="competency_mapping" />
                <PayloadPreview sessionId={session.id} stageType="architecture_stage" />
                <PayloadPreview sessionId={session.id} stageType="approach_note" />
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Payloads are generated after session submission</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completeness Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completion ? (
                  <>
                    <div className="flex items-center gap-2">
                      {completion.isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="font-medium">
                        {completion.isComplete ? 'Session is Complete' : 'Session is Incomplete'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Progress: {completion.totalAnswered} of {completion.totalRequired} questions answered
                      </p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(completion.totalAnswered / completion.totalRequired) * 100}%` }}
                        />
                      </div>
                    </div>

                    {completion.missingAnswers.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                        <p className="font-medium text-amber-900 dark:text-amber-200 mb-2">
                          Missing Answers ({completion.missingAnswers.length}):
                        </p>
                        <ul className="space-y-2">
                          {completion.missingAnswers.map((q: any) => (
                            <li key={q.questionId} className="text-sm text-amber-800 dark:text-amber-300">
                              <span className="font-medium">[{q.themeCode}]</span> {q.questionText}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <Spinner />
                )}
              </CardContent>
            </Card>

            {validation && (
              <Card>
                <CardHeader>
                  <CardTitle>Stage Transition Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {validation.isValid ? 'Ready for Transition' : 'Transition Blocked'}
                    </span>
                  </div>

                  {validation.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <p className="font-medium text-red-900 dark:text-red-200 mb-2">Errors:</p>
                      <ul className="space-y-1">
                        {validation.errors.map((error: string, idx: number) => (
                          <li key={idx} className="text-sm text-red-800 dark:text-red-300">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
