
"use client";

import type { ComodatoItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ComodatoListTableProps {
  comodatos: ComodatoItem[];
}

export function ComodatoListTable({ comodatos }: ComodatoListTableProps) {
  if (!comodatos || comodatos.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum equipamento em comodato encontrado para este cliente.</p>;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cód. Item</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Nº Patrimônio</TableHead>
            <TableHead className="text-right">Qtd.</TableHead>
            <TableHead>Data Envio</TableHead>
            <TableHead>Data Retorno</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comodatos.map((item) => {
            const enviado = item.sendDate && isValid(parseISO(item.sendDate));
            const retornado = item.returnDate && isValid(parseISO(item.returnDate));
            let statusText = "Pendente Envio";
            let statusVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

            if (enviado && !retornado) {
              statusText = "Em Uso";
              statusVariant = "default"; // default is primary color
            } else if (enviado && retornado) {
              statusText = "Retornado";
              statusVariant = "secondary";
            }


            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.itemId}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.patrimonyNo}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell>
                  {item.sendDate && isValid(parseISO(item.sendDate)) 
                    ? format(parseISO(item.sendDate), 'dd/MM/yyyy', { locale: ptBR }) 
                    : '--'}
                </TableCell>
                <TableCell>
                  {item.returnDate && isValid(parseISO(item.returnDate)) 
                    ? format(parseISO(item.returnDate), 'dd/MM/yyyy', { locale: ptBR }) 
                    : 'Pendente'}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant} className={statusVariant === 'default' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                    {statusText}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
