import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PayloadPreviewProps {
  sessionId: number;
  stageType: 'competency_mapping' | 'architecture_stage' | 'approach_note';
}

const stageLabels: Record<string, string> = {
  competency_mapping: 'Competency Mapping',
  architecture_stage: 'Architecture Stage',
  approach_note: 'Approach Note',
};

const stageDescriptions: Record<string, string> = {
  competency_mapping: 'Suggested competencies and theme answers for competency mapping',
  architecture_stage: 'Faculty archetypes, peer grouping sensitivities, and capability baseline',
  approach_note: 'Strategic trigger and target behaviour for the approach note',
};

export default function PayloadPreview({ sessionId, stageType }: PayloadPreviewProps) {
  const { data: payload, isLoading } = trpc.discovery.getDownstreamPayload.useQuery(
    { sessionId, stageType },
    { retry: false }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{stageLabels[stageType]}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!payload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{stageLabels[stageType]}</CardTitle>
          <CardDescription>{stageDescriptions[stageType]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <AlertCircle className="w-5 h-5" />
            <span>Payload not available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const payloadData = typeof payload.payload === 'string' ? JSON.parse(payload.payload) : payload.payload;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{stageLabels[stageType]}</CardTitle>
            <CardDescription>{stageDescriptions[stageType]}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {payload.isValid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <Badge variant="default" className="bg-green-600">
                  Valid
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <Badge variant="destructive">Invalid</Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payload Content */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono">
            {JSON.stringify(payloadData, null, 2)}
          </pre>
        </div>

        {/* Validation Errors */}
        {payload.validationErrors && payload.validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="font-medium text-red-900 dark:text-red-200 mb-2">Validation Errors:</p>
            <ul className="space-y-1">
              {payload.validationErrors.map((error: string, idx: number) => (
                <li key={idx} className="text-sm text-red-800 dark:text-red-300">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p>Created: {new Date(payload.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(payload.updatedAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
