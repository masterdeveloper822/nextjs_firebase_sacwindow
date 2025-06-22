
"use client";

import type { ProductForReturn, Order, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { PlusCircle, Trash2, PackageSearch, ScanLine, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { mockOrders, mockClients } from '@/lib/types'; // Mock data
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const productReturnSchema = z.object({
  orderNo: z.string().min(1, "Nº do Pedido é obrigatório."),
  productId: z.string().min(1, "Código do produto é obrigatório."),
  productName: z.string(), // Auto-filled
  quantityToReturn: z.number().min(1, "Quantidade a devolver deve ser maior que 0."),
  labelNo: z.string().min(1, "Nº da etiqueta é obrigatório."),
  labelQuantity: z.number(), // Auto-filled
});

const returnFormSchema = z.object({
  products: z.array(productReturnSchema).min(1, "Adicione pelo menos um produto para devolução.")
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

interface ProductReturnFormProps {
  manifestationId: string;
  onSubmit: (data: ReturnFormValues) => Promise<void>;
}

export function ProductReturnForm({ manifestationId, onSubmit }: ProductReturnFormProps) {
  const [availableOrders, setAvailableOrders] = useState<Order[]>(mockOrders); // In real app, fetch orders related to manifestation/client
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      products: [{ orderNo: '', productId: '', productName: '', quantityToReturn: 1, labelNo: '', labelQuantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const handleOrderChange = (orderNo: string, productIndex: number) => {
    const order = availableOrders.find(o => o.orderNo === orderNo);
    if (order) {
      setSelectedOrderItems(order.items);
      form.setValue(`products.${productIndex}.productId`, ''); // Reset product selection
      form.setValue(`products.${productIndex}.productName`, '');
    } else {
      setSelectedOrderItems([]);
    }
  };
  
  const handleProductChange = (productId: string, productIndex: number) => {
    const product = selectedOrderItems.find(item => item.productId === productId);
    if (product) {
      form.setValue(`products.${productIndex}.productName`, product.description);
      form.setValue(`products.${productIndex}.quantityToReturn`, product.quantity); // Default to full quantity
    }
  };

  const handleLabelNoChange = (labelNo: string, productIndex: number) => {
    // Simulate fetching label quantity based on labelNo
    if (labelNo) {
      const mockLabelQty = Math.floor(Math.random() * 5) + 1; // Random qty for mock
      form.setValue(`products.${productIndex}.labelQuantity`, mockLabelQty);
      
      // Validation: quantityToReturn <= labelQuantity
      const qtyToReturn = form.getValues(`products.${productIndex}.quantityToReturn`);
      if (qtyToReturn > mockLabelQty) {
        form.setError(`products.${productIndex}.quantityToReturn`, {
          type: 'manual',
          message: `Quantidade a devolver não pode ser maior que a quantidade da etiqueta (${mockLabelQty}).`
        });
      } else {
         form.clearErrors(`products.${productIndex}.quantityToReturn`);
      }
    }
  };


  const handleFormSubmit = async (data: ReturnFormValues) => {
    setIsLoading(true);
    // Basic validation example (can be expanded with Zod refine)
    let isValid = true;
    data.products.forEach((p, index) => {
        if (p.quantityToReturn > p.labelQuantity) {
            form.setError(`products.${index}.quantityToReturn`, {
                type: "manual",
                message: `Quantidade a devolver (${p.quantityToReturn}) não pode ser maior que a quantidade da etiqueta (${p.labelQuantity}).`
            });
            isValid = false;
        }
    });

    if (!isValid) {
        setIsLoading(false);
        return;
    }
    
    // await new Promise(resolve => setTimeout(resolve, 1000)); // REMOVED DELAY
    await onSubmit(data);
    setIsLoading(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <PackageSearch className="h-6 w-6 text-primary" />
          Registrar Produtos para Devolução
        </CardTitle>
        <CardDescription>Manifestação Nº {manifestationId}. Adicione os produtos a serem devolvidos.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`products.${index}.orderNo`}
                    render={({ field: orderField }) => (
                      <FormItem>
                        <FormLabel>Nº do Pedido</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            orderField.onChange(value);
                            handleOrderChange(value, index);
                          }}
                          defaultValue={orderField.value}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione o pedido" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableOrders.map(o => <SelectItem key={o.id} value={o.orderNo}>{o.orderNo} ({o.clientName || mockClients.find(c => c.id === o.clientId)?.name})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`products.${index}.productId`}
                    render={({ field: productField }) => (
                      <FormItem>
                        <FormLabel>Código do Produto</FormLabel>
                         <Select
                          onValueChange={(value) => {
                            productField.onChange(value);
                            handleProductChange(value, index);
                          }}
                          value={productField.value} // Ensure value is controlled
                          disabled={!form.watch(`products.${index}.orderNo`)}
                        >
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {selectedOrderItems.length > 0 ? selectedOrderItems.map(item => <SelectItem key={item.productId} value={item.productId}>{item.productId} - {item.description.substring(0,30)}...</SelectItem>) : <SelectItem value="" disabled>Selecione um pedido primeiro</SelectItem>}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <Input {...form.register(`products.${index}.productName`)} readOnly placeholder="Automático" className="bg-muted" />
                  </FormItem>
                   <FormField
                    control={form.control}
                    name={`products.${index}.quantityToReturn`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qtd. a Devolver</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`products.${index}.labelNo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº da Etiqueta</FormLabel>
                        <div className="flex gap-1">
                        <FormControl>
                          <Input placeholder="Leia ou digite a etiqueta" {...field} onChange={(e) => {field.onChange(e.target.value); handleLabelNoChange(e.target.value, index);}} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" aria-label="Ler etiqueta"> <ScanLine className="h-4 w-4"/> </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Qtd. da Etiqueta</FormLabel>
                    <Input {...form.register(`products.${index}.labelQuantity`)} type="number" readOnly placeholder="Automático" className="bg-muted" />
                     {form.formState.errors.products?.[index]?.quantityToReturn && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{form.formState.errors.products?.[index]?.quantityToReturn?.message}</AlertDescription>
                        </Alert>
                    )}
                  </FormItem>
                </div>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="mt-2 text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Remover Produto
                  </Button>
                )}
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ orderNo: '', productId: '', productName: '', quantityToReturn: 1, labelNo: '', labelQuantity: 0 })}
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Outro Produto
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
               {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirmar Devolução
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
