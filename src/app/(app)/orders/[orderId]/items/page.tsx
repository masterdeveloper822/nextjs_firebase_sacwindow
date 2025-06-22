
"use client";

// This page might become obsolete if order items are always shown in a modal
// within the ManifestationForm. However, keeping it for now in case it's needed
// for direct access or other flows. If fully replaced by modal, it can be deleted.

import type { Order, Client } from '@/lib/types';
import { OrderItemsTable } from '@/components/orders/order-items-table';
import { mockOrders, mockClients } from '@/lib/types'; // Using mock data
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, UserCircle, CalendarDays, FileText, Truck, CreditCard, Tag, PackageCheck, Package, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OrderItemsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = typeof params.orderId === 'string' ? params.orderId : undefined;
  const manifestationId = searchParams.get('manifestationId');

  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      // Simulate fetching order data - REMOVED DELAY
      const foundOrder = mockOrders.find(o => o.id === orderId || o.orderNo === orderId);
      setOrder(foundOrder);
      if (foundOrder) {
        const foundClient = mockClients.find(c => c.id === foundOrder.clientId);
        setClient(foundClient);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" /> {/* Back button */}
        <Skeleton className="h-12 w-1/2" /> {/* Title */}
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
            </CardContent>
        </Card>
        <Skeleton className="h-64 w-full" /> {/* Table */}
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-destructive py-8">Pedido não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => manifestationId ? router.push(`/manifestations/${manifestationId}`) : router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar {manifestationId ? 'para Manifestação' : ''}
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-primary" />
          Itens do Pedido: {order.orderNo}
        </h1>
        <p className="text-muted-foreground">Detalhes dos produtos incluídos no pedido.</p>
      </div>

      {client && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Informações do Pedido</CardTitle>
            <CardDescription>Resumo do pedido e dados do cliente.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary"/>
              <strong>Nº Pedido:</strong> {order.orderNo}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary"/>
              <strong>Nº NF:</strong> {order.invoiceNo || '--'}
            </div>
             <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary"/>
              <strong>Data Pedido:</strong> {order.date && isValid(parseISO(order.date)) ? format(parseISO(order.date), 'dd/MM/yyyy', { locale: ptBR }) : '--'}
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary"/>
              <strong>Cliente:</strong> {client.fantasyName || client.name} ({client.code})
            </div>
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l9.3-9.3a1 1 0 0 0 0-1.41L12 2z"/><path d="M7 7h.01"/></svg>
                <strong>Filial:</strong> {order.branchNo}
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary"/>
              <strong>Vendedor Emissor:</strong> {order.salespersonIssuer || '--'}
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary"/>
              <strong>Forma Pag.:</strong> {order.paymentMethod || '--'}
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary"/>
              <strong>Tipo Entrega:</strong> {order.deliveryType || '--'}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary"/>
              <strong>Data Entrega:</strong> {order.deliveryDate && isValid(parseISO(order.deliveryDate)) ? format(parseISO(order.deliveryDate), 'dd/MM/yyyy', { locale: ptBR }) : '--'}
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary"/>
              <strong>Separador:</strong> {order.separatorName || '--'}
            </div>
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-primary"/>
              <strong>Conferente:</strong> {order.checkerName || '--'}
            </div>
             <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary"/>
              <strong>Entregador:</strong> {order.deliveryPersonName || '--'}
            </div>
          </CardContent>
        </Card>
      )}

      <OrderItemsTable items={order.items} />
    </div>
  );
}
