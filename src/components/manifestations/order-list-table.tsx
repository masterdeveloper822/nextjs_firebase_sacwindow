
"use client";

import type { Order } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileText, FileSearch } from 'lucide-react'; // Added FileText and FileSearch
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface OrderListTableProps {
  orders: Order[];
  manifestationId: string;
  onViewItems: (order: Order) => void; // Callback to open modal
}

export function OrderListTable({ orders, manifestationId, onViewItems }: OrderListTableProps) {
  const { toast } = useToast();

  const handleViewNF = (orderNo?: string) => {
    toast({ title: "Ação: Ver NF", description: `Simulando visualização da NF para o pedido ${orderNo || 'desconhecido'}.` });
    // In a real app, this would open the NF, e.g., window.open('/path/to/nf/' + orderNo);
  };

  const handleViewOrderDetails = (orderNo?: string) => {
    toast({ title: "Ação: Ver Pedido", description: `Simulando visualização detalhada do pedido ${orderNo || 'desconhecido'}.` });
    // In a real app, this might navigate to a dedicated order details page or open another modal
  };
  
  if (!orders || orders.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido encontrado para este cliente.</p>;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Filial</TableHead>
            <TableHead>Nº Pedido</TableHead>
            <TableHead>Nº NF</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead className="text-center">Ver NF</TableHead>
            <TableHead className="text-center">Ver Pedido</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.branchNo}</TableCell>
              <TableCell className="font-medium">{order.orderNo}</TableCell>
              <TableCell>{order.invoiceNo || '--'}</TableCell>
              <TableCell>{format(new Date(order.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
              <TableCell>{order.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => handleViewNF(order.orderNo)} aria-label="Ver Nota Fiscal">
                  <FileText className="h-4 w-4 text-primary" />
                </Button>
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => handleViewOrderDetails(order.orderNo)} aria-label="Ver Detalhes do Pedido">
                  <FileSearch className="h-4 w-4 text-primary" />
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onViewItems(order)}>
                  <Eye className="mr-2 h-4 w-4" /> Ver Itens
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
