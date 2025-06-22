
"use client";

import type { Manifestation } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CollectionTrackingTableProps {
  manifestations: Manifestation[];
}

// Placeholder data for logistic status
const logisticStatuses = [
  { value: 'pending_assignment', label: 'Aguardando Atribuição', color: 'bg-gray-500' },
  { value: 'assigned_motoboy', label: 'Atribuído ao Motoboy', color: 'bg-blue-500' },
  { value: 'in_transit_motoboy', label: 'Em Trânsito (Motoboy)', color: 'bg-cyan-500' },
  { value: 'assigned_carrier', label: 'Atribuído à Transportadora', color: 'bg-indigo-500' },
  { value: 'in_transit_carrier', label: 'Em Trânsito (Transportadora)', color: 'bg-purple-500' },
  { value: 'collected', label: 'Coletado', color: 'bg-green-500' },
  { value: 'return_to_sender', label: 'Devolvido ao Remetente', color: 'bg-yellow-500' },
  { value: 'delivery_issue', label: 'Problema na Coleta/Entrega', color: 'bg-red-500' },
  { value: 'completed', label: 'Finalizado (Logística)', color: 'bg-emerald-600' },
];

// Function to get a mock logistic status
const getMockLogisticStatus = (manifestationNo: string) => {
  // Simple hash to get a somewhat consistent random status for mock purposes
  let hash = 0;
  for (let i = 0; i < manifestationNo.length; i++) {
    const char = manifestationNo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return logisticStatuses[Math.abs(hash) % logisticStatuses.length];
};


export function CollectionTrackingTable({ manifestations }: CollectionTrackingTableProps) {
  const router = useRouter();

  const handleViewManifestation = (manifestationId: string) => {
    router.push(`/manifestations/${manifestationId}`);
  };

  const handleEditLogisticStatus = (manifestationId: string) => {
    // Placeholder for editing logistic status - could open a modal or navigate
    alert(`Simulando edição do status logístico para manifestação ID: ${manifestationId}`);
  };

  if (manifestations.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma manifestação para acompanhamento logístico no momento.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Manifestação</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo de Coleta</TableHead>
            <TableHead>Data Abertura</TableHead>
            <TableHead>Status Logística</TableHead>
            <TableHead>Transportadora/Motoboy</TableHead>
            <TableHead>Previsão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {manifestations.map((m) => {
            const logisticStatus = getMockLogisticStatus(m.manifestationNo);
            const mockCarrier = m.collectionType?.includes('Motoboy') ? `Motoboy ${m.manifestationNo.slice(-2)}` : `Transp. XYZ ${m.manifestationNo.slice(-3)}`;
            const mockEta = m.slaDueDate && isValid(parseISO(m.slaDueDate)) ? format(parseISO(m.slaDueDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';

            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.manifestationNo}</TableCell>
                <TableCell>{m.clientName}</TableCell>
                <TableCell>{m.collectionType || 'N/A'}</TableCell>
                <TableCell>
                  {m.openingDate && isValid(parseISO(m.openingDate)) ? format(parseISO(m.openingDate), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data inválida'}
                </TableCell>
                <TableCell>
                  <Badge className={`${logisticStatus.color} text-white hover:${logisticStatus.color}`}>
                    {logisticStatus.label}
                  </Badge>
                </TableCell>
                <TableCell>{mockCarrier}</TableCell>
                <TableCell>{mockEta}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="outline" size="icon" onClick={() => handleViewManifestation(m.id)} title="Ver Manifestação">
                    <Eye className="h-4 w-4" />
                  </Button>
                   <Button variant="outline" size="icon" onClick={() => handleEditLogisticStatus(m.id)} title="Atualizar Status Logístico">
                    <Settings2 className="h-4 w-4" />
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

    