import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const { status, online, triggerSync } = useOfflineSync();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8"
          onClick={triggerSync}
          disabled={!online || status === 'syncing'}
        >
          {online ? (
            <Wifi className="h-4 w-4 text-primary" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          
          {status === 'syncing' ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : online ? (
            <Cloud className="h-3 w-3 text-primary" />
          ) : (
            <CloudOff className="h-3 w-3 text-muted-foreground" />
          )}
          
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] px-1.5 py-0',
              online 
                ? status === 'syncing' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {online ? (status === 'syncing' ? 'Syncing...' : 'Synced') : 'Offline'}
          </Badge>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {online
            ? status === 'syncing'
              ? 'Syncing your data...'
              : 'All changes synced. Click to refresh.'
            : 'Working offline. Changes will sync when online.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
