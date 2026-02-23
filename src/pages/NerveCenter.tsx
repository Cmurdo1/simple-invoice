import { AppLayout } from '@/components/layout/AppLayout';
import { NerveCenterGate } from '@/components/auth/NerveCenterGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Radio, BrainCircuit } from 'lucide-react';

export default function NerveCenter() {
  return (
    <NerveCenterGate>
      <AppLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">The Nerve Center</h1>
              <p className="text-muted-foreground">
                Central hub for automations, signals, and AI task orchestration
              </p>
            </div>
          </div>

          {/* Incoming Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Incoming Signals
                <Badge variant="outline" className="ml-auto">0 active</Badge>
              </CardTitle>
              <CardDescription>
                Endpoint URLs for external services (n8n, Zapier, Make) to push data into the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                No signals configured yet. Coming soon.
              </div>
            </CardContent>
          </Card>

          {/* Outgoing Pulses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Outgoing Pulses
                <Badge variant="outline" className="ml-auto">0 configured</Badge>
              </CardTitle>
              <CardDescription>
                Configure where notifications fire — Slack, email, SMS, or custom targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                No outgoing pulses configured yet. Coming soon.
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity Feed
              </CardTitle>
              <CardDescription>
                Live stream of all signals, task completions, and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                No activity yet. The nerve center is quiet.
              </div>
            </CardContent>
          </Card>

          {/* AI Task Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                AI Task Queue
              </CardTitle>
              <CardDescription>
                Where AI agents pick up assignments and report back with results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
                No tasks in queue. AI agents are standing by.
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </NerveCenterGate>
  );
}
