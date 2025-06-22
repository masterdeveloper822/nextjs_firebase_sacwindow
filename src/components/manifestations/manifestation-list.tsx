
"use client";

import type { Manifestation, ManifestationStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns'; // Added parseISO and isValid
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect } from 'react'; // Added React, useState, useEffect

interface ManifestationListProps {
  manifestations: Manifestation[];
}

const statusColors: Record<ManifestationStatus, string> = {
  pending: 'bg-red-500 hover:bg-red-600', // Red
  analyzing: 'bg-yellow-500 hover:bg-yellow-600', // Yellow
  resolved: 'bg-green-500 hover:bg-green-600', // Green
  overdue: 'bg-orange-500 hover:bg-orange-600', // Orange
  not_analyzed: 'bg-black hover:bg-gray-700', // Black
};

const statusText: Record<ManifestationStatus, string> = {
  pending: 'Pendente',
  analyzing: 'Em Análise',
  resolved: 'Resolvido',
  overdue: 'Atrasado',
  not_analyzed: 'Não Analisada',
};

export function ManifestationList({ manifestations }: ManifestationListProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleViewDetails = (manifestationId: string) => {
    router.push(`/manifestations/${manifestationId}`);
  };
  
  if (manifestations.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma manifestação encontrada.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Manifestação</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Filial</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Abertura</TableHead>
            <TableHead>Usuário Abertura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atendente</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {manifestations.map((m) => {
            const openingUser = m.history && m.history.length > 0 
              ? m.history.sort((a,b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())[0].userName 
              : 'N/D';
            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.manifestationNo}</TableCell>
                <TableCell>{m.clientName}</TableCell>
                <TableCell>{m.branch}</TableCell>
                <TableCell>{m.type}</TableCell>
                <TableCell>
                  {isClient ? (
                    isValid(parseISO(m.openingDate)) ? format(parseISO(m.openingDate), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data inválida'
                  ) : (
                    m.openingDate.substring(0, 10) // Render YYYY-MM-DD during SSR and initial client render
                  )}
                </TableCell>
                <TableCell>{openingUser}</TableCell>
                <TableCell>
                  <Badge className={`${statusColors[m.status]} text-white`}>
                    {statusText[m.status]}
                  </Badge>
                </TableCell>
                <TableCell>{m.attendantName || 'Não atribuído'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(m.id)}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
