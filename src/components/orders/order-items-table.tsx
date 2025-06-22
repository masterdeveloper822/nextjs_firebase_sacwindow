
"use client";

import type { OrderItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button'; // Import Button
import { PlusCircle } from 'lucide-react'; // Import an icon

interface OrderItemsTableProps {
  items: OrderItem[];
  orderNo?: string; // Added to know which order these items belong to
  onAddItemToReturn?: (item: OrderItem, orderNo: string) => void; // Callback to add item to return list
}

export function OrderItemsTable({ items, orderNo, onAddItemToReturn }: OrderItemsTableProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum item encontrado para este pedido.</p>;
  }

  const totalOrderValue = items.reduce((sum, item) => sum + item.totalItem, 0);

  return (
    <div className="rounded-md border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cód. Produto</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Qtd.</TableHead>
            <TableHead className="text-right">Vlr. Unit.</TableHead>
            <TableHead className="text-right">Total Item</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Etiqueta</TableHead>
            {onAddItemToReturn && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.productId}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell className="text-right">{item.totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell>{item.lot || 'N/A'}</TableCell>
              <TableCell>{item.labelNo || 'N/A'}</TableCell>
              {onAddItemToReturn && orderNo && (
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddItemToReturn(item, orderNo)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Reclamação
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
            <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={onAddItemToReturn ? 4 : 4} className="text-right">Valor Total do Pedido:</TableCell>
                <TableCell className="text-right">{totalOrderValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell colSpan={onAddItemToReturn ? 3 : 2}></TableCell>
            </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}

    
