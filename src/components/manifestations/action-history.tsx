
"use client";

import type { ManifestationHistoryLog } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Info } from 'lucide-react';

interface ActionHistoryProps {
  history: ManifestationHistoryLog[];
  onItemClick: (log: ManifestationHistoryLog) => void;
  manifestationReason?: string; // Added for modal
  manifestationDescription?: string; // Added for modal
  manifestationId?: string; // Added for modal button
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

export function ActionHistory({ 
    history, 
    onItemClick, 
    // These props are not directly used here but passed to onItemClick 
    // which then opens a modal that might use them.
    // Consider if the modal should fetch fresh data instead or if this is sufficient.
    manifestationReason, 
    manifestationDescription,
    manifestationId
}: ActionHistoryProps) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico de ações disponível.</p>;
  }

  return (
    <ScrollArea className="h-72 w-full rounded-md border p-0 bg-muted/30">
      <div className="space-y-0">
        {history.slice().sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime() ).map((log) => (
          <div 
            key={log.id} 
            className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => onItemClick(log)} // onItemClick will open the modal with log, and modal can access manifestation props
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onItemClick(log);}}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(log.userName)}`} alt={log.userName} data-ai-hint="user avatar" />
              <AvatarFallback>{getInitials(log.userName)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="text-sm font-medium text-foreground">
                {log.action}
                <span className="text-xs text-muted-foreground ml-1">por {log.userName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {log.timestamp && isValid(parseISO(log.timestamp)) ? format(parseISO(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }) : 'Data inválida'}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" aria-label="Ver detalhes do histórico">
                <Info className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

