"use client";

import type { Manifestation, ParameterItem, Client, Order, ManifestationHistoryLog, OrderItem, ManifestationStatus, ProductForReturn, ComodatoItem, OperationReceivedItem, AuditComplianceLevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Standard label
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form as RHFForm, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as z from 'zod';
import { UploadCloud, Save, Send, XCircle as CloseIcon, CalendarClock, UserCircle, Info, ListOrdered, History, MessageSquareHeart, ShoppingCart, FileText, BarChartHorizontalBig, Building, Briefcase, MapPin, TrendingUp, MessageSquareWarning, Archive, MessageCircle, Edit2, PackageSearch, PlusCircle, Trash2, ScanLine, AlertTriangle, CreditCard as CreditCardIcon, FilePlus2, CheckCircle, Eye as EyeIcon, ShieldCheck, Library, PackageCheck as PackageCheckIcon, Gift, ShieldAlert, FileArchive, ClipboardCheck, FileUp, Search, Filter as FilterIcon, RotateCcw, CalendarDays, Truck as TruckIcon, FileBadge2, Bike } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { OrderListTable } from './order-list-table';
import { ActionHistory } from './action-history';
import { AiActionSuggester } from './ai-action-suggester';
import { Separator } from '../ui/separator';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter as DialogUIFooter } from '@/components/ui/dialog';
import { OrderItemsTable } from '../orders/order-items-table';
import { ConsumptionDashboard } from './consumption-dashboard';
import { ComodatoListTable } from './comodato-list-table';
import { Alert, AlertDescription as UIAlertDescription, AlertTitle as UIAlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { fetchClients, fetchOrders, fetchParameterItems, updateManifestation } from '@/lib/firebase';


const productReturnSchema = z.object({
  id: z.string().optional(), // ID do useFieldArray
  orderNo: z.string().min(1, "Nº do Pedido é obrigatório."),
  productId: z.string().min(1, "Código do produto é obrigatório."),
  productName: z.string().optional(),
  quantityAcquired: z.coerce.number().optional(),
  quantityToReturn: z.coerce.number().min(1, "Quantidade a devolver deve ser maior que 0."),
  labelNo: z.string().min(1, "Nº da etiqueta é obrigatório.").optional(),
  labelQuantity: z.coerce.number().optional(),
});

const operationReceivedItemSchema = z.object({
  id: z.string().optional(), // ID do useFieldArray para OperationReceivedItem
  productId: z.string(),
  productName: z.string(),
  labelNo: z.string(),
  labelQuantitySac: z.number(), // Qtd. da etiqueta informada pelo SAC
  quantityReturnedSac: z.number(), // Qtd. devolvida informada pelo SAC
  receivedCorrectly: z.enum(['yes', 'no', 'partial', ''], { required_error: "Informe o status do recebimento."}),
  quantityToStock: z.coerce.number().min(0, "Deve ser >= 0").default(0),
  quantityToDiscard: z.coerce.number().min(0, "Deve ser >= 0").default(0),
  operationNotes: z.string().optional(),
}).refine(data => data.quantityToStock + data.quantityToDiscard <= data.quantityReturnedSac, {
  message: "Estoque + Descarte não pode exceder Qtd. Devolvida pelo SAC.",
  path: ["quantityToStock"],
});


const manifestationSchema = z.object({
  reason: z.string().min(1, "Motivo é obrigatório."),
  description: z.string().min(10, "Descrição detalhada é obrigatória (mínimo 10 caracteres)."),
  attendantTypedOpinion: z.string().optional(),
  attendantOpinion: z.string().min(1, "Parecer do atendente (opção) é obrigatório."),
  recommendedAction: z.string().optional(),
  collectionType: z.string().optional(),
  collectionScheduledCarrier: z.string().optional(),
  collectionReturnInvoice: z.string().optional(),
  collectionScheduledDate: z.string().optional(),
  collectionScheduledPeriod: z.enum(['morning', 'afternoon', '']).optional(),
  collectionScheduledNotes: z.string().optional(),
  collectionReceiptUrl: z.string().url({ message: "URL do recibo de coleta inválida." }).optional().or(z.literal('')),
  productsForReturn: z.array(productReturnSchema).optional(),
  creditGranted: z.enum(['yes', 'no'], { required_error: "Informe se o crédito foi concedido." }).optional(),
  creditReasonAttendant: z.string().optional(),
  creditProofAttendantUrl: z.string().optional(),
  creditStatusFinance: z.enum(['approved', 'rejected', 'pending']).optional(),
  creditReasonFinance: z.string().optional(),
  operationReceivedItems: z.array(operationReceivedItemSchema).optional(),
  operationProofUrls: z.array(z.string()).optional(),
  operationOpinion: z.string().optional(),
  auditOpinion: z.string().optional(),
  auditAttachmentUrls: z.array(z.string()).optional(),
  auditComplianceLevel: z.enum(['not_evaluated', 'none', 'low', 'medium', 'high']).optional(),
}).refine(data => {
  if (data.productsForReturn) {
    for (const product of data.productsForReturn) {
      if (product.quantityToReturn > (product.labelQuantity || 0)) return false;
      if (product.quantityToReturn > (product.quantityAcquired || 0)) return false;
    }
  }
  if (data.creditGranted === 'yes' && !data.creditReasonAttendant?.trim()) return false;
  return true;
}, {
  message: "Verifique os campos de devolução ou os detalhes do crédito. A quantidade a devolver não pode exceder a quantidade da etiqueta ou a quantidade adquirida. Se o crédito foi concedido, o motivo é obrigatório.",
  path: ["productsForReturn", "creditReasonAttendant"],
});


type ManifestationFormValues = z.infer<typeof manifestationSchema>;

interface ManifestationFormProps {
  manifestation?: Manifestation;
  clientId?: string;
  initialStatus?: Manifestation['status'];
  onSubmit: (data: ManifestationFormValues, manifestationId?: string) => Promise<void>;
}

const parameterItems = await fetchParameterItems();

const Clients = await fetchClients();

const Orders = await fetchOrders();

const getParams = (type: ParameterItem['type']) => {
  if (!parameterItems || !Array.isArray(parameterItems)) {
    console.warn('Parameter items is not available or invalid');
    return [];
  }
  
  return parameterItems.filter(p => {
    if (!p || typeof p !== 'object') return false;
    return p.type === type && p.isActive === true;
  });
};

export function ManifestationForm({ manifestation: initialManifestation, clientId, initialStatus, onSubmit }: ManifestationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [manifestation, setManifestation] = useState<Manifestation | undefined>(initialManifestation);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [slaDaysRemaining, setSlaDaysRemaining] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryLog, setSelectedHistoryLog] = useState<ManifestationHistoryLog | null>(null);
  const [availableProductsForReturnItem, setAvailableProductsForReturnItem] = useState<OrderItem[][]>([]);
  const [isCollectionOrderModalOpen, setIsCollectionOrderModalOpen] = useState(false);
  const [collectionPassword, setCollectionPassword] = useState('');
  const [collectionPasswordError, setCollectionPasswordError] = useState('');

  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [labelSearchTerm, setLabelSearchTerm] = useState('');
  const [filteredClientOrders, setFilteredClientOrders] = useState<Order[]>([]);


  const form = useForm<ManifestationFormValues>({
    resolver: zodResolver(manifestationSchema),
    defaultValues: {
      reason: initialManifestation?.reason || '',
      description: initialManifestation?.description || (initialManifestation?.id.startsWith('NEW-PRE-') ? initialManifestation.preOpeningSummary : ''),
      attendantTypedOpinion: initialManifestation?.attendantTypedOpinion || '',
      attendantOpinion: initialManifestation?.attendantOpinion || '',
      recommendedAction: initialManifestation?.recommendedAction || '',
      collectionType: initialManifestation?.collectionType || '',
      collectionScheduledCarrier: initialManifestation?.collectionScheduledCarrier || '',
      collectionReturnInvoice: initialManifestation?.collectionReturnInvoice || '',
      collectionScheduledDate: initialManifestation?.collectionScheduledDate || '',
      collectionScheduledPeriod: initialManifestation?.collectionScheduledPeriod || '',
      collectionScheduledNotes: initialManifestation?.collectionScheduledNotes || '',
      collectionReceiptUrl: initialManifestation?.collectionReceiptUrl || '',
      productsForReturn: initialManifestation?.productsForReturn?.map(p => ({...p, id: p.id || `pfr-${Date.now()}-${Math.random().toString(36).substring(7)}`, quantityAcquired: p.quantityAcquired || 0})) || [],
      creditGranted: initialManifestation?.creditGranted || undefined,
      creditReasonAttendant: initialManifestation?.creditReasonAttendant || '',
      creditProofAttendantUrl: initialManifestation?.creditProofAttendantUrl || '',
      creditStatusFinance: initialManifestation?.creditStatusFinance,
      creditReasonFinance: initialManifestation?.creditReasonFinance || '',
      operationReceivedItems: (
        initialManifestation?.operationReceivedItems && initialManifestation.operationReceivedItems.length > 0
        ? initialManifestation.operationReceivedItems.map(item => ({...item, id: item.id || `opitem-initial-${item.productId}-${Math.random().toString(36).substring(7)}`}))
        : initialManifestation?.productsForReturn?.map((pfr, index) => ({
            id: `opitem-pfr-${index}-${pfr.productId}-${Math.random().toString(36).substring(7)}`,
            productId: pfr.productId,
            productName: pfr.productName,
            labelNo: pfr.labelNo || '',
            labelQuantitySac: pfr.labelQuantity || 0,
            quantityReturnedSac: pfr.quantityToReturn || 0,
            receivedCorrectly: '',
            quantityToStock: 0,
            quantityToDiscard: 0,
            operationNotes: '',
          }))
      ) || [],
      operationProofUrls: initialManifestation?.operationProofUrls || [],
      operationOpinion: initialManifestation?.operationOpinion || '',
      auditOpinion: initialManifestation?.auditOpinion || '',
      auditAttachmentUrls: initialManifestation?.auditAttachmentUrls || [],
      auditComplianceLevel: initialManifestation?.auditComplianceLevel || 'not_evaluated',
    },
  });

  const { fields: returnProductFields, append: appendReturnProduct, remove: removeReturnProduct } = useFieldArray({
    control: form.control,
    name: "productsForReturn",
  });

  const { fields: operationItemFields, append: appendOperationItem, remove: removeOperationItem, replace: replaceOperationItems } = useFieldArray({
      control: form.control,
      name: "operationReceivedItems"
  });

  useEffect(() => {
    if (initialManifestation) {
      setManifestation(initialManifestation);
      if(initialManifestation.clientId) {
        const foundClient = Clients.find(c => c.id === initialManifestation.clientId);
        setClient(foundClient);
        if (foundClient) {
          const orders = Orders.filter(o => o.clientId === foundClient.id);
          setClientOrders(orders);
          setFilteredClientOrders(orders);
        }
      }
      const initialAvailableProducts: OrderItem[][] = (initialManifestation.productsForReturn || []).map(pfr => {
        const order = Orders.find(o => o.orderNo === pfr.orderNo);
        return order ? order.items : [];
      });
      setAvailableProductsForReturnItem(initialAvailableProducts);

    } else if (clientId) {
      const foundClient = Clients.find(c => c.id === clientId);
      setClient(foundClient);
      if (foundClient) {
        const orders = Orders.filter(o => o.clientId === foundClient.id);
        setClientOrders(orders);
        setFilteredClientOrders(orders);
      }
      const today = new Date();
      const slaDueDate = new Date(today);
      slaDueDate.setDate(today.getDate() + 3);

      setManifestation({
        id: `NEW-${Date.now()}`,
        manifestationNo: `MAN-${Date.now().toString().slice(-4)}`,
        clientId: clientId || '',
        clientName: foundClient?.fantasyName || foundClient?.name || 'Desconhecido',
        branch: foundClient ? (Orders.find(o => o.clientId === foundClient.id)?.branchNo || 'N/A') : 'N/A',
        type: 'Reclamação',
        openingDate: today.toISOString(),
        status: initialStatus || 'not_analyzed',
        description: '',
        attachments: [],
        history: [{ id:'newhist', timestamp: today.toISOString(), action: 'Criação de rascunho', userId: 'system', userName: 'Sistema', details: `Status inicial: ${initialStatus || 'Não analisada'}` }],
        slaDueDate: slaDueDate.toISOString(),
        productsForReturn: [],
        operationReceivedItems: [],
        comodatos: foundClient?.comodatos || [],
        auditComplianceLevel: 'not_evaluated',
        collectionScheduledCarrier: '',
        collectionReturnInvoice: '',
        collectionScheduledDate: '',
        collectionScheduledPeriod: '',
        collectionScheduledNotes: '',
        collectionReceiptUrl: '',
        preOpeningSummary: undefined, 
        preOpeningUserId: undefined,
        preOpeningUserName: undefined,
        preOpeningTimestamp: undefined,
      });
      setAvailableProductsForReturnItem([]);
    }
  }, [initialManifestation, clientId, initialStatus]);


  useEffect(() => {
    const defaultOpItems = (
        manifestation?.operationReceivedItems && manifestation.operationReceivedItems.length > 0
        ? manifestation.operationReceivedItems.map(item => ({...item, id: item.id || `opitem-initial-${item.productId}-${Math.random().toString(36).substring(7)}`}))
        : manifestation?.productsForReturn?.map((pfr, index) => ({
            id: `opitem-pfr-${index}-${pfr.productId}-${Math.random().toString(36).substring(7)}`,
            productId: pfr.productId,
            productName: pfr.productName,
            labelNo: pfr.labelNo || '',
            labelQuantitySac: pfr.labelQuantity || 0,
            quantityReturnedSac: pfr.quantityToReturn || 0,
            receivedCorrectly: '',
            quantityToStock: 0,
            quantityToDiscard: 0,
            operationNotes: '',
          }))
      ) || [];

    form.reset({
      reason: manifestation?.reason || '',
      description: manifestation?.description || (manifestation?.id.startsWith('NEW-PRE-') ? manifestation.preOpeningSummary : ''),
      attendantTypedOpinion: manifestation?.attendantTypedOpinion || '',
      attendantOpinion: manifestation?.attendantOpinion || '',
      recommendedAction: manifestation?.recommendedAction || '',
      collectionType: manifestation?.collectionType || '',
      collectionScheduledCarrier: manifestation?.collectionScheduledCarrier || '',
      collectionReturnInvoice: manifestation?.collectionReturnInvoice || '',
      collectionScheduledDate: manifestation?.collectionScheduledDate || '',
      collectionScheduledPeriod: manifestation?.collectionScheduledPeriod || '',
      collectionScheduledNotes: manifestation?.collectionScheduledNotes || '',
      collectionReceiptUrl: manifestation?.collectionReceiptUrl || '',
      productsForReturn: manifestation?.productsForReturn?.map(p => ({...p, id: p.id || `pfr-${Date.now()}-${Math.random().toString(36).substring(7)}`, quantityAcquired: p.quantityAcquired || 0 })) || [],
      creditGranted: manifestation?.creditGranted || undefined,
      creditReasonAttendant: manifestation?.creditReasonAttendant || '',
      creditProofAttendantUrl: manifestation?.creditProofAttendantUrl || '',
      creditStatusFinance: manifestation?.creditStatusFinance,
      creditReasonFinance: manifestation?.creditReasonFinance || '',
      operationReceivedItems: defaultOpItems,
      operationProofUrls: manifestation?.operationProofUrls || [],
      operationOpinion: manifestation?.operationOpinion || '',
      auditOpinion: manifestation?.auditOpinion || '',
      auditAttachmentUrls: manifestation?.auditAttachmentUrls || [],
      auditComplianceLevel: manifestation?.auditComplianceLevel || 'not_evaluated',
    });
     if (manifestation?.id.startsWith('NEW-PRE-') && manifestation.preOpeningSummary) {
        form.setValue('description', manifestation.preOpeningSummary);
    }
  }, [manifestation]); // form removed as dependency


  useEffect(() => {
    const watchedPfrs = form.watch('productsForReturn') || [];
    const currentOperationItemsInForm = form.getValues('operationReceivedItems') || [];

    const newOperationItems = watchedPfrs.map((pfrData, index) => {
      const existingOpItem = currentOperationItemsInForm.find(
        op => op.productId === pfrData.productId && op.labelNo === pfrData.labelNo
      );

      return {
        id: existingOpItem?.id || `opitem-dyn-${index}-${pfrData.productId}-${Date.now()}`,
        productId: pfrData.productId,
        productName: pfrData.productName,
        labelNo: pfrData.labelNo || '',
        labelQuantitySac: pfrData.labelQuantity || 0,
        quantityReturnedSac: pfrData.quantityToReturn || 0,
        receivedCorrectly: existingOpItem?.receivedCorrectly || '',
        quantityToStock: existingOpItem?.quantityToStock || 0,
        quantityToDiscard: existingOpItem?.quantityToDiscard || 0,
        operationNotes: existingOpItem?.operationNotes || '',
      };
    });

    const validNewOperationItems = newOperationItems.filter(op => op.productId && op.labelNo);

    const relevantNewOps = validNewOperationItems.map(op => ({
        productId: op.productId, productName: op.productName, labelNo: op.labelNo,
        labelQuantitySac: op.labelQuantitySac, quantityReturnedSac: op.quantityReturnedSac,
        receivedCorrectly: op.receivedCorrectly, quantityToStock: op.quantityToStock,
        quantityToDiscard: op.quantityToDiscard, operationNotes: op.operationNotes
    }));
    const relevantCurrentOps = currentOperationItemsInForm.map(op => ({
        productId: op.productId, productName: op.productName, labelNo: op.labelNo,
        labelQuantitySac: op.labelQuantitySac, quantityReturnedSac: op.quantityReturnedSac,
        receivedCorrectly: op.receivedCorrectly, quantityToStock: op.quantityToStock,
        quantityToDiscard: op.quantityToDiscard, operationNotes: op.operationNotes
    }));

    if (JSON.stringify(relevantNewOps) !== JSON.stringify(relevantCurrentOps)) {
      replaceOperationItems(validNewOperationItems);
    }

  }, [form.watch('productsForReturn'), replaceOperationItems, form]);


  useEffect(() => {
    if (manifestation?.slaDueDate && isValid(parseISO(manifestation.slaDueDate))) {
      const remaining = differenceInDays(parseISO(manifestation.slaDueDate), new Date());
      setSlaDaysRemaining(remaining >= 0 ? `${remaining} dia(s)` : `Vencido (${Math.abs(remaining)} dia(s) atrás)`);
    } else if (manifestation?.openingDate && isValid(parseISO(manifestation.openingDate))) {
      const dueDate = new Date(parseISO(manifestation.openingDate));
      dueDate.setDate(dueDate.getDate() + 3);
      const remaining = differenceInDays(dueDate, new Date());
      setSlaDaysRemaining(remaining >= 0 ? `${remaining} dia(s)` : `Vencido (${Math.abs(remaining)} dia(s) atrás)`);
    } else {
        setSlaDaysRemaining('N/A');
    }
  }, [manifestation]);


  const handleFormSubmit = async (data: ManifestationFormValues) => {
    setIsLoading(true);
    let isValid = true;
    if (data.productsForReturn) {
        data.productsForReturn.forEach((p, productIndex) => {
            if (p.quantityToReturn > (p.labelQuantity || 0)) {
                form.setError(`productsForReturn.${productIndex}.quantityToReturn`, {type: "manual", message: `Qtd. excede etiqueta (${p.labelQuantity || 0}).`});
                isValid = false;
            }
            if (p.quantityToReturn > (p.quantityAcquired || 0)) {
                form.setError(`productsForReturn.${productIndex}.quantityToReturn`, {type: "manual", message: `Qtd. excede adquirida (${p.quantityAcquired || 0}).`});
                isValid = false;
            }
        });
    }
     if (data.creditGranted === 'yes' && !data.creditReasonAttendant?.trim()) {
        form.setError('creditReasonAttendant', {type: 'manual', message: 'Motivo obrigatório se crédito concedido.'});
        isValid = false;
    }
    if (data.operationReceivedItems) {
        data.operationReceivedItems.forEach((item, itemIndex) => {
            if (item.quantityToStock + item.quantityToDiscard > item.quantityReturnedSac) {
                 form.setError(`operationReceivedItems.${itemIndex}.quantityToStock`, {type: "manual", message: `Estoque + Descarte > Devolvido SAC (${item.quantityReturnedSac})`});
                 isValid = false;
            }
            if (!item.receivedCorrectly){
                form.setError(`operationReceivedItems.${itemIndex}.receivedCorrectly`, {type: "manual", message: `Status do recebimento é obrigatório.`});
                isValid = false;
            }
        });
    }

    if (!isValid) {
        setIsLoading(false);
        toast({ title: "Erro de Validação", description: "Por favor, corrija os campos destacados.", variant: "destructive" });
        return;
    }
    await onSubmit(data, manifestation?.id);
    setIsLoading(false);
  };

  const handleAiSuggestionSelect = (suggestion: string) => {
    form.setValue('attendantTypedOpinion', suggestion, { shouldValidate: true });
    toast({
      title: "Sugestão da IA aplicada!",
      description: "A sugestão de abordagem foi copiada para o campo 'Parecer Detalhado do Atendente'.",
    });
  };

  const handleViewOrderItems = (order: Order) => {
    setSelectedOrderForModal(order);
    setIsOrderModalOpen(true);
  };

  const handleHistoryLogClick = (log: ManifestationHistoryLog) => {
    setSelectedHistoryLog(log);
    setIsHistoryModalOpen(true);
  };

  const updateLabelQuantityAndValidate = (labelNo: string | undefined, productIndex: number) => {
    if (labelNo && labelNo.trim() !== '') {
      const orderItem = (availableProductsForReturnItem[productIndex] || []).find(item => item.labelNo === labelNo);
      const mockLabelQty = orderItem?.quantity || Math.floor(Math.random() * 5) + 1; 
      form.setValue(`productsForReturn.${productIndex}.labelQuantity`, mockLabelQty);

      const qtyToReturn = form.getValues(`productsForReturn.${productIndex}.quantityToReturn`);
      if (qtyToReturn > mockLabelQty) {
        form.setError(`productsForReturn.${productIndex}.quantityToReturn`, {type: 'manual', message: `Qtd. devolução (${qtyToReturn}) excede qtd. etiqueta (${mockLabelQty}).`});
      } else {
         form.clearErrors(`productsForReturn.${productIndex}.quantityToReturn`);
      }
    } else {
      form.setValue(`productsForReturn.${productIndex}.labelQuantity`, 0);
      form.clearErrors(`productsForReturn.${productIndex}.quantityToReturn`);
    }
  };


  const handleReturnOrderChange = (orderNo: string, productIndex: number) => {
    const order = clientOrders.find(o => o.orderNo === orderNo);
    setAvailableProductsForReturnItem(prev => {
        const newState = [...prev];
        newState[productIndex] = order ? order.items : [];
        return newState;
    });
    form.setValue(`productsForReturn.${productIndex}.productId`, '');
    form.setValue(`productsForReturn.${productIndex}.productName`, '');
    form.setValue(`productsForReturn.${productIndex}.quantityAcquired`, 0);
    form.setValue(`productsForReturn.${productIndex}.quantityToReturn`, 1);
    form.setValue(`productsForReturn.${productIndex}.labelNo`, '');
    form.setValue(`productsForReturn.${productIndex}.labelQuantity`, 0);
    form.clearErrors(`productsForReturn.${productIndex}.productId`);
    updateLabelQuantityAndValidate(undefined, productIndex); 
  };

  const handleReturnProductChange = (productId: string, productIndex: number) => {
    const products = availableProductsForReturnItem[productIndex] || [];
    const product = products.find(item => item.productId === productId);
    if (product) {
      form.setValue(`productsForReturn.${productIndex}.productName`, product.description);
      form.setValue(`productsForReturn.${productIndex}.quantityAcquired`, product.quantity);
      form.setValue(`productsForReturn.${productIndex}.quantityToReturn`, product.quantity); 
      
      const foundLabelNo = product.labelNo; 
      form.setValue(`productsForReturn.${productIndex}.labelNo`, foundLabelNo || '');
      updateLabelQuantityAndValidate(foundLabelNo, productIndex);
    } else {
      form.setValue(`productsForReturn.${productIndex}.productName`, '');
      form.setValue(`productsForReturn.${productIndex}.quantityAcquired`, 0);
      form.setValue(`productsForReturn.${productIndex}.labelNo`, '');
      updateLabelQuantityAndValidate(undefined, productIndex);
    }
  };

  const handleAddProductToReturnFromModal = (item: OrderItem, orderNo: string) => {
    appendReturnProduct({
        id: `pfr-${Date.now()}-${item.productId}-${Math.random().toString(36).substring(7)}`,
        orderNo: orderNo,
        productId: item.productId,
        productName: item.description,
        quantityAcquired: item.quantity,
        quantityToReturn: item.quantity, 
        labelNo: item.labelNo || '',
        labelQuantity: 0, 
    });
    const order = clientOrders.find(o => o.orderNo === orderNo);
    setAvailableProductsForReturnItem(prev => [...prev, order ? order.items : []]);

    const newProductIndex = form.getValues('productsForReturn').length -1;
    if (newProductIndex >= 0) {
        updateLabelQuantityAndValidate(item.labelNo, newProductIndex);
    }

    setIsOrderModalOpen(false);
    setTimeout(() => {
      document.getElementById('reason-select-trigger')?.focus();
    }, 0);
  };

  const handleOpenCollectionOrderModal = () => {
    setCollectionPassword('');
    setCollectionPasswordError('');
    setIsCollectionOrderModalOpen(true);
  };

  const handleConfirmCollectionOrder = () => {
    if (collectionPassword === "password123") { 
        toast({
            title: "Pedido de Coleta Emitido!",
            description: "O pedido de coleta foi simuladamente emitido com sucesso.",
            variant: "default"
        });
        setIsCollectionOrderModalOpen(false);
    } else {
        setCollectionPasswordError("Senha inválida. Tente novamente.");
    }
  };

  const handleSearchClientOrders = () => {
    let orders = [...clientOrders];
    const orderNoLower = orderSearchTerm.toLowerCase();
    const labelNoLower = labelSearchTerm.toLowerCase();

    if (orderNoLower) {
      orders = orders.filter(order => order.orderNo.toLowerCase().includes(orderNoLower));
    }

    if (labelNoLower) {
      orders = orders.filter(order =>
        order.items.some(item => item.labelNo?.toLowerCase().includes(labelNoLower))
      );
    }
    setFilteredClientOrders(orders);
  };

  const handleClearOrderFilters = () => {
    setOrderSearchTerm('');
    setLabelSearchTerm('');
    setFilteredClientOrders(clientOrders);
  };

  const handlePartialSave = async (stageName: string) => {
    const currentFormValues = form.getValues();
    console.log(`Saving stage: ${stageName}`, currentFormValues);

    let toastMessage = `Os dados para ${stageName} foram registrados (simulado).`;
    let newCreditStatusFinance: Manifestation['creditStatusFinance'] = manifestation?.creditStatusFinance;

    if (stageName === 'Detalhes Iniciais') {
      try {
        // Save to manifestations database
        const manifestationData = {
          reason: currentFormValues.reason,
          description: currentFormValues.description,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Detalhes Iniciais'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            reason: currentFormValues.reason,
            description: currentFormValues.description
          } : prev);
        }
        
        toastMessage = `Detalhes iniciais salvos no banco de dados. Motivo: ${currentFormValues.reason}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar os detalhes iniciais no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    if (stageName === 'Ação e Tipo de Coleta') {
      try {
        // Save to manifestations database
        const manifestationData = {
          recommendedAction: currentFormValues.recommendedAction,
          collectionType: currentFormValues.collectionType,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Ação e Tipo de Coleta'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            recommendedAction: currentFormValues.recommendedAction,
            collectionType: currentFormValues.collectionType
          } : prev);
        }
        
        toastMessage = `Ação e tipo de coleta salvos no banco de dados. Ação: ${currentFormValues.recommendedAction || 'Não informada'}, Tipo: ${currentFormValues.collectionType || 'Não informado'}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar a ação e tipo de coleta no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    if (stageName === 'Agendamento Transportadora') {
      try {
        // Save to manifestations database
        const manifestationData = {
          collectionReturnInvoice: currentFormValues.collectionReturnInvoice,
          collectionScheduledCarrier: currentFormValues.collectionScheduledCarrier,
          collectionScheduledDate: currentFormValues.collectionScheduledDate,
          collectionScheduledNotes: currentFormValues.collectionScheduledNotes,
          collectionScheduledPeriod: currentFormValues.collectionScheduledPeriod,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Agendamento Transportadora'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            collectionReturnInvoice: currentFormValues.collectionReturnInvoice,
            collectionScheduledCarrier: currentFormValues.collectionScheduledCarrier,
            collectionScheduledDate: currentFormValues.collectionScheduledDate,
            collectionScheduledNotes: currentFormValues.collectionScheduledNotes,
            collectionScheduledPeriod: currentFormValues.collectionScheduledPeriod
          } : prev);
        }
        
        toastMessage = `Agendamento de transportadora salvo no banco de dados. Transportadora: ${currentFormValues.collectionScheduledCarrier || 'Não informada'}, NF: ${currentFormValues.collectionReturnInvoice || 'Não informada'}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o agendamento de transportadora no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    if (stageName === 'Recibo de Coleta') {
      try {
        // Save to manifestations database
        const manifestationData = {
          collectionReceiptUrl: currentFormValues.collectionReceiptUrl,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Recibo de Coleta'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            collectionReceiptUrl: currentFormValues.collectionReceiptUrl
          } : prev);
        }
        
        toastMessage = `Recibo de coleta salvo no banco de dados. URL: ${currentFormValues.collectionReceiptUrl || 'Não informada'}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o recibo de coleta no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    if (stageName === 'Crédito Atendente') {
        try {
            // Save to manifestations database
            const manifestationData = {
                creditGranted: currentFormValues.creditGranted,
                creditReasonAttendant: currentFormValues.creditReasonAttendant,
                lastUpdatedBy: 'system', // You might want to get this from auth context
                lastUpdatedStage: 'Crédito Atendente'
            };

            // Update the manifestation in the database
            if (manifestation?.id) {
                await updateManifestation(manifestation.id, manifestationData);
                
                // Update local state to reflect the changes
                setManifestation(prev => prev ? {
                    ...prev,
                    creditGranted: currentFormValues.creditGranted,
                    creditReasonAttendant: currentFormValues.creditReasonAttendant
                } : prev);
            }

            // Existing logic for creditStatusFinance
            const creditGranted = currentFormValues.creditGranted;
            const currentStoredCreditStatus = manifestation?.creditStatusFinance;

            if (creditGranted === 'yes') {
                // Only set to 'pending' if Finance hasn't already approved or rejected.
                if (currentStoredCreditStatus !== 'approved' && currentStoredCreditStatus !== 'rejected') {
                    newCreditStatusFinance = 'pending';
                } else {
                    newCreditStatusFinance = currentStoredCreditStatus; // Preserve Finance's decision
                }
            } else if (creditGranted === 'no') {
                newCreditStatusFinance = undefined; // Clear it, no financial action needed
            }
            // If creditGranted is undefined, newCreditStatusFinance remains as manifestation?.creditStatusFinance (no change from this logic)

            if (newCreditStatusFinance !== manifestation?.creditStatusFinance) {
                setManifestation(prev => {
                    if (!prev) return undefined;
                    // Update the internal manifestation state
                    const updatedManif = { ...prev, creditStatusFinance: newCreditStatusFinance };
                     // Also update the react-hook-form state directly for creditStatusFinance
                    form.setValue('creditStatusFinance', newCreditStatusFinance, { shouldValidate: true, shouldDirty: true });
                    return updatedManif;
                });
                toastMessage = `Dados do crédito (atendente) salvos no banco de dados. Status financeiro atualizado para '${newCreditStatusFinance || 'não aplicável'}'.`;
            } else {
                toastMessage = `Dados do crédito (atendente) salvos no banco de dados. Status financeiro permaneceu '${manifestation?.creditStatusFinance || 'não definido'}'.`;
            }
        } catch (error) {
            console.error('Error saving to database:', error);
            toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
            toast({
                title: "Erro ao Salvar",
                description: "Não foi possível salvar os dados do crédito no banco de dados.",
                variant: "destructive"
            });
            return; // Don't show success toast if there was an error
        }
    }

    if (stageName === 'Crédito Financeiro') {
      try {
        // Save to manifestations database
        const manifestationData = {
          creditReasonFinance: currentFormValues.creditReasonFinance,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Crédito Financeiro'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            creditReasonFinance: currentFormValues.creditReasonFinance
          } : prev);
        }
        
        toastMessage = `Crédito financeiro salvo no banco de dados. Parecer: ${currentFormValues.creditReasonFinance || 'Não informado'}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o parecer financeiro no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    if (stageName === 'Operação') {
      try {
        // Save to manifestations database
        const manifestationData = {
          operationOpinion: currentFormValues.operationOpinion,
          operationReceivedItems: currentFormValues.operationReceivedItems,
          operationProofUrls: currentFormValues.operationProofUrls,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Operação'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            operationOpinion: currentFormValues.operationOpinion,
            operationReceivedItems: currentFormValues.operationReceivedItems,
            operationProofUrls: currentFormValues.operationProofUrls
          } : prev);
        }
        
        toastMessage = `Operação salva no banco de dados. Parecer: ${currentFormValues.operationOpinion || 'Não informado'}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar a operação no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    if (stageName === 'Auditoria') {
      try {
        // Save to manifestations database
        const manifestationData = {
          auditOpinion: currentFormValues.auditOpinion,
          auditAttachmentUrls: currentFormValues.auditAttachmentUrls,
          auditComplianceLevel: currentFormValues.auditComplianceLevel,
          lastUpdatedBy: 'system', // You might want to get this from auth context
          lastUpdatedStage: 'Auditoria'
        };

        // Update the manifestation in the database
        if (manifestation?.id) {
          await updateManifestation(manifestation.id, manifestationData);
          
          // Update local state to reflect the changes
          setManifestation(prev => prev ? {
            ...prev,
            auditOpinion: currentFormValues.auditOpinion,
            auditAttachmentUrls: currentFormValues.auditAttachmentUrls,
            auditComplianceLevel: currentFormValues.auditComplianceLevel
          } : prev);
        }
        
        toastMessage = `Auditoria salva no banco de dados. Parecer: ${currentFormValues.auditOpinion || 'Não informado'}`;
      } catch (error) {
        console.error('Error saving to database:', error);
        toastMessage = 'Erro ao salvar no banco de dados. Tente novamente.';
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar a auditoria no banco de dados.",
          variant: "destructive"
        });
        return; // Don't show success toast if there was an error
      }
    }

    toast({
      title: `Etapa "${stageName}" Salva`,
      description: toastMessage,
    });
  };

  const watchedProductsForReturn = form.watch('productsForReturn') || [];
  const watchedCollectionType = form.watch('collectionType');


  if (!manifestation || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <p className="ml-2">Carregando dados da manifestação...</p>
      </div>
    );
  }
  const statusDisplay: Record<ManifestationStatus, { text: string; color: string }> = {
      pending: { text: 'Pendente', color: 'text-red-600' },
      analyzing: { text: 'Em Análise', color: 'text-yellow-600' },
      resolved: { text: 'Resolvido', color: 'text-green-600' },
      overdue: { text: 'Atrasado', color: 'text-orange-600' },
      not_analyzed: { text: 'Não Analisada', color: 'text-black dark:text-white' },
    };
    
  const motoboyCollectionTypeValue = "Coleta Reversa Agendada"; 

  const handleSaveAllToFirebase = async () => {
    setIsLoading(true);
    try {
      const currentFormValues = form.getValues();
      
      // Save all form values to manifestations database
      const manifestationData = {
        reason: currentFormValues.reason,
        description: currentFormValues.description,
        attendantTypedOpinion: currentFormValues.attendantTypedOpinion,
        attendantOpinion: currentFormValues.attendantOpinion,
        recommendedAction: currentFormValues.recommendedAction,
        collectionType: currentFormValues.collectionType,
        collectionScheduledCarrier: currentFormValues.collectionScheduledCarrier,
        collectionReturnInvoice: currentFormValues.collectionReturnInvoice,
        collectionScheduledDate: currentFormValues.collectionScheduledDate,
        collectionScheduledPeriod: currentFormValues.collectionScheduledPeriod,
        collectionScheduledNotes: currentFormValues.collectionScheduledNotes,
        collectionReceiptUrl: currentFormValues.collectionReceiptUrl,
        productsForReturn: currentFormValues.productsForReturn?.filter(p => p.productName && p.productId) as ProductForReturn[] | undefined,
        creditGranted: currentFormValues.creditGranted,
        creditReasonAttendant: currentFormValues.creditReasonAttendant,
        creditProofAttendantUrl: currentFormValues.creditProofAttendantUrl,
        creditStatusFinance: currentFormValues.creditStatusFinance,
        creditReasonFinance: currentFormValues.creditReasonFinance,
        operationReceivedItems: currentFormValues.operationReceivedItems,
        operationProofUrls: currentFormValues.operationProofUrls,
        operationOpinion: currentFormValues.operationOpinion,
        auditOpinion: currentFormValues.auditOpinion,
        auditAttachmentUrls: currentFormValues.auditAttachmentUrls,
        auditComplianceLevel: currentFormValues.auditComplianceLevel,
        lastUpdatedBy: 'system', // You might want to get this from auth context
        lastUpdatedStage: 'Todos os Dados'
      } as Partial<Manifestation>;

      // Filter out undefined values for Firebase
      const cleanManifestationData = Object.fromEntries(
        Object.entries(manifestationData).filter(([_, value]) => value !== undefined)
      ) as Partial<Manifestation>;

      // Update the manifestation in the database
      if (manifestation?.id) {
        await updateManifestation(manifestation.id, cleanManifestationData);
        
        // Update local state to reflect the changes
        setManifestation(prev => prev ? {
          ...prev,
          ...cleanManifestationData
        } : prev);
      }
      
      toast({
        title: "Dados Salvos com Sucesso!",
        description: "Todos os dados da manifestação foram salvos no banco de dados.",
      });
    } catch (error) {
      console.error('Error saving all data to database:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar todos os dados no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RHFForm {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Card: Dados do Cliente */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <UserCircle className="h-6 w-6 text-primary" /> Dados do Cliente
                    </CardTitle>
                    <CardDescription>Manifestação Nº: <span className="font-semibold text-foreground">{manifestation.manifestationNo}</span> | Status: <span className={`font-semibold ${statusDisplay[manifestation.status]?.color || 'text-foreground'}`}>{statusDisplay[manifestation.status]?.text || manifestation.status}</span></CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div><strong className="text-muted-foreground">Razão Social:</strong> {client.name}</div>
            <div><strong className="text-muted-foreground">Nome Fantasia:</strong> {client.fantasyName || '--'}</div>
            <div><strong className="text-muted-foreground">Código:</strong> {client.code}</div>
            <div><strong className="text-muted-foreground">CNPJ/CPF:</strong> {client.cnpjCpf}</div>
            <div><strong className="text-muted-foreground">E-mail:</strong> {client.email}</div>
            <div><strong className="text-muted-foreground">Telefone:</strong> {client.phone}</div>
            <div className="md:col-span-2"><strong className="text-muted-foreground">Endereço:</strong> {`${client.address || '--'}, ${client.city || '--'} - ${client.state || '--'}, CEP: ${client.zipCode || '--'}`}</div>
            <div><strong className="text-muted-foreground">Cadastrado em:</strong> {client.registrationDate && isValid(parseISO(client.registrationDate)) ? format(parseISO(client.registrationDate), 'dd/MM/yyyy', {locale: ptBR}) : '--'}</div>
            <div><strong className="text-muted-foreground">Meses Ativo:</strong> {client.activeMonths ?? '--'}</div>
            <div><strong className="text-muted-foreground">Total Manifestações:</strong> {client.manifestationCount ?? '--'}</div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div><strong className="text-muted-foreground">Vendedor Interno:</strong> {client.internalSalesperson?.name || '--'} ({client.internalSalesperson?.code || '--'})</div>
                <div><strong className="text-muted-foreground">Vendedor Externo:</strong> {client.externalSalesperson?.name || '--'} ({client.externalSalesperson?.code || '--'})</div>
            </div>
          </CardContent>
        </Card>

        {/* Card: SLA */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarClock className="h-6 w-6 text-primary" /> SLA
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Label>Prazo SLA</Label>
                <Input value={slaDaysRemaining || 'Calculando...'} readOnly className="mt-1 bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">
                Data abertura: {manifestation.openingDate && isValid(parseISO(manifestation.openingDate)) ? format(parseISO(manifestation.openingDate), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}.
                {manifestation.slaDueDate && isValid(parseISO(manifestation.slaDueDate)) ? ` Vencimento: ${format(parseISO(manifestation.slaDueDate), 'dd/MM/yyyy', { locale: ptBR })}.` : ''}
                </p>
            </CardContent>
        </Card>

        {/* Card: Comodatos */}
        {client.comodatos && client.comodatos.length > 0 && (
            <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <Archive className="h-6 w-6 text-primary" /> Equipamentos em Comodato
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ComodatoListTable comodatos={client.comodatos || []} />
            </CardContent>
            </Card>
        )}

        {/* Card: Consumption Dashboard */}
        {client.consumptionData && <ConsumptionDashboard client={client} />}
        
        {/* Card: Histórico da Manifestação */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <History className="h-6 w-6 text-primary" /> Histórico da Manifestação
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ActionHistory
                    history={manifestation.history}
                    onItemClick={handleHistoryLogClick}
                    manifestationReason={form.getValues('reason')}
                    manifestationDescription={form.getValues('description')}
                    manifestationId={manifestation.id}
                />
            </CardContent>
        </Card>

        {/* Card: Pedidos do Cliente */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <ListOrdered className="h-6 w-6 text-primary" /> Pedidos do Cliente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-grow">
                        <Label htmlFor="orderSearchTerm">Buscar por Nº Pedido</Label>
                        <Input
                            id="orderSearchTerm"
                            placeholder="Digite o nº do pedido"
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div className="flex-grow">
                        <Label htmlFor="labelSearchTerm">Buscar por Nº Etiqueta</Label>
                        <Input
                            id="labelSearchTerm"
                            placeholder="Digite o nº da etiqueta"
                            value={labelSearchTerm}
                            onChange={(e) => setLabelSearchTerm(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div className="flex gap-2 pt-2 sm:pt-0">
                        <Button type="button" onClick={handleClearOrderFilters} variant="outline" className="w-full sm:w-auto">
                            <RotateCcw /> Limpar
                        </Button>
                        <Button type="button" onClick={handleSearchClientOrders} className="w-full sm:w-auto">
                            <Search /> Buscar
                        </Button>
                    </div>
                </div>
                <OrderListTable orders={filteredClientOrders} manifestationId={manifestation.id} onViewItems={handleViewOrderItems} />
            </CardContent>
        </Card>

        {/* Card: Dados da Pré-Abertura */}
        <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileBadge2 className="h-6 w-6 text-primary" /> Dados da Pré-Abertura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {manifestation.preOpeningSummary ? (
                <>
                  <div>
                    <Label className="text-muted-foreground">Resumo da Solicitação (Pré-Abertura):</Label>
                    <p className="p-2 bg-muted/50 rounded-md mt-1 whitespace-pre-wrap">{manifestation.preOpeningSummary}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Realizada por:</Label>
                    <p>{manifestation.preOpeningUserName || 'N/A'} ({manifestation.preOpeningUserId || 'N/A'})</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Em:</Label>
                    <p>
                      {manifestation.preOpeningTimestamp && isValid(parseISO(manifestation.preOpeningTimestamp))
                        ? format(parseISO(manifestation.preOpeningTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Data inválida'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Esta manifestação foi aberta diretamente no formulário completo, sem etapa de pré-abertura.</p>
              )}
            </CardContent>
        </Card>

        {/* Card: Detalhes da Manifestação */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle id="manifestation-details-card-title" tabIndex={-1} className="flex items-center gap-2 text-xl outline-none">
                <Info className="h-6 w-6 text-primary" /> Detalhes da Manifestação
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {watchedProductsForReturn.length > 0 && (
                    <div className="space-y-3">
                        <RHFFormLabel>Produtos Reclamados</RHFFormLabel>
                        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                        {watchedProductsForReturn.map((pfr, idx) => {
                            const order = clientOrders.find(o => o.orderNo === pfr.orderNo);
                            const item = order?.items.find(i => i.productId === pfr.productId);
                            return (
                            <div key={`reclamado-${pfr.id || idx}`} className="text-sm p-2 border-b last:border-b-0">
                                <p><span className="font-semibold text-muted-foreground">Pedido:</span> {pfr.orderNo} | <span className="font-semibold text-muted-foreground">NF:</span> {order?.invoiceNo || 'N/A'}</p>
                                <p><span className="font-semibold text-muted-foreground">Cód:</span> {pfr.productId} | <span className="font-semibold text-muted-foreground">Produto:</span> {pfr.productName}</p>
                                <p><span className="font-semibold text-muted-foreground">Lote:</span> {item?.lot || 'N/A'} | <span className="font-semibold text-muted-foreground">Qtd. Adquirida:</span> {pfr.quantityAcquired || item?.quantity || 'N/A'}</p>
                            </div>
                            );
                        })}
                        </div>
                    </div>
                )}
                <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                    <FormItem>
                    <RHFFormLabel>Motivo</RHFFormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger id="reason-select-trigger"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {getParams('reason').map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <RHFFormLabel>Descrição Detalhada</RHFFormLabel>
                    <FormControl>
                        <Textarea placeholder="Descreva o ocorrido em detalhes..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div>
                    <Label className="mb-2 block">Upload de Provas (Fotos, Vídeos, Documentos)</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG, PDF, MP4 (MAX. 10MB)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" multiple />
                        </label>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button type="button" onClick={() => handlePartialSave('Detalhes Iniciais')} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="mr-2 h-4 w-4" /> Salvar Detalhes Iniciais
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Card: AI Action Suggester */}
        <AiActionSuggester
            complaintDescription={form.watch('description')}
            onSuggestionSelect={handleAiSuggestionSelect}
        />
        
        {/* Card: Parecer do Atendente */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageCircle className="h-6 w-6 text-primary" /> Parecer do Atendente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="attendantTypedOpinion"
                    render={({ field }) => (
                        <FormItem>
                        <RHFFormLabel>Parecer Detalhado do Atendente</RHFFormLabel>
                        <FormControl>
                            <Textarea placeholder="Digite o parecer detalhado aqui..." {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="attendantOpinion"
                    render={({ field }) => (
                        <FormItem>
                        <RHFFormLabel>Parecer do Atendente (Seleção Única)</RHFFormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1"
                            >
                            {getParams('attendantOpinionOption').map((item) => (
                                <FormItem key={item.id} className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value={item.id} />
                                </FormControl>
                                <RHFFormLabel className="font-normal text-sm">{item.name}</RHFFormLabel>
                                </FormItem>
                            ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        {/* Card: Ações e Coleta */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Edit2 className="h-6 w-6 text-primary" /> Ações e Coleta
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="recommendedAction"
                    render={({ field }) => (
                        <FormItem>
                        <RHFFormLabel>Ação Recomendada</RHFFormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione a ação recomendada" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {getParams('recommendedAction').map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="collectionType"
                    render={({ field }) => (
                        <FormItem>
                        <RHFFormLabel>Tipo de Coleta</RHFFormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo de coleta" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {getParams('collectionType').map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-2">
                    <Button type="button" onClick={() => handlePartialSave('Ação e Tipo de Coleta')} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="mr-2 h-4 w-4" /> Salvar Ação e Tipo de Coleta
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Card: Emitir Nota Fiscal de devolução */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PackageSearch className="h-6 w-6 text-primary" /> Emitir Nota Fiscal de devolução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {returnProductFields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-muted/20 relative">
                 {returnProductFields.length > 0 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeReturnProduct(index)} className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10" aria-label="Remover Produto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <FormField control={form.control} name={`productsForReturn.${index}.orderNo`}
                    render={({ field: orderField }) => (
                      <FormItem className="lg:col-span-1">
                        <RHFFormLabel>Nº do Pedido</RHFFormLabel>
                        <Select onValueChange={(value) => { orderField.onChange(value); handleReturnOrderChange(value, index); }} value={orderField.value} >
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione o pedido" /></SelectTrigger></FormControl>
                          <SelectContent>{clientOrders.map(o => <SelectItem key={o.id} value={o.orderNo}>{o.orderNo}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name={`productsForReturn.${index}.productId`}
                    render={({ field: productField }) => (
                      <FormItem className="lg:col-span-1">
                        <RHFFormLabel>Código do Produto</RHFFormLabel>
                        <Select onValueChange={(value) => { productField.onChange(value); handleReturnProductChange(value, index);}} value={productField.value} disabled={!form.watch(`productsForReturn.${index}.orderNo`)} >
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {(availableProductsForReturnItem[index] || []).length > 0
                                ? (availableProductsForReturnItem[index] || []).map(item => (
                                    <SelectItem key={item.productId} value={item.productId}>
                                    {item.productId} - {item.description.substring(0,20)}...
                                    </SelectItem>
                                ))
                                : null
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={form.control} name={`productsForReturn.${index}.productName`}
                    render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                            <RHFFormLabel>Nome do Produto</RHFFormLabel>
                            <FormControl><Input {...field} readOnly placeholder="Automático" className="bg-muted border-muted" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-4 items-end mt-4">
                    <FormField control={form.control} name={`productsForReturn.${index}.quantityAcquired`}
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <RHFFormLabel>Qtd. Adq.</RHFFormLabel>
                                <FormControl><Input type="number" {...field} readOnly placeholder="0" className="bg-muted border-muted w-full" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name={`productsForReturn.${index}.quantityToReturn`}
                        render={({ field }) => (
                        <FormItem className="w-full">
                            <RHFFormLabel>Qtd. Devolv.</RHFFormLabel>
                            <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} className="w-full" /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField control={form.control} name={`productsForReturn.${index}.labelNo`}
                        render={({ field: labelField }) => (
                        <FormItem className="w-full">
                            <RHFFormLabel>Nº Etiqueta</RHFFormLabel>
                            <FormControl><Input placeholder="Automático" {...labelField} readOnly className="bg-muted border-muted w-full" /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField control={form.control} name={`productsForReturn.${index}.labelQuantity`}
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <RHFFormLabel>Qtd. Etiq.</RHFFormLabel>
                                <FormControl><Input type="number" {...field} readOnly placeholder="Auto" className="bg-muted border-muted w-full" /></FormControl>
                                {form.formState.errors.productsForReturn?.[index]?.quantityToReturn && (<p className="text-sm font-medium text-destructive pt-1">{form.formState.errors.productsForReturn?.[index]?.quantityToReturn?.message}</p>)}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              </Card>
            ))}
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => { appendReturnProduct({ id: `pfr-${Date.now()}-${Math.random().toString(36).substring(7)}`, orderNo: '', productId: '', productName: '', quantityAcquired:0, quantityToReturn: 1, labelNo: '', labelQuantity: 0 }); setAvailableProductsForReturnItem(prev => [...prev, []]); }} className="w-full sm:w-auto" >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto para Devolução
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card: Emitir pedido de coleta Motoboy (Conditional) */}
        {watchedCollectionType === motoboyCollectionTypeValue && (
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Bike className="h-6 w-6 text-primary" /> Emitir pedido de coleta Motoboy
                    </CardTitle>
                    <CardDescription>Verifique os produtos e emita o pedido de coleta para o motoboy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {returnProductFields.length > 0 ? (
                         <div className="rounded-md border bg-muted/30 p-3 space-y-2 max-h-60 overflow-y-auto">
                            {returnProductFields.map((field, index) => (
                                <div key={field.id} className="text-sm p-2 border-b last:border-b-0">
                                    <p><strong className="text-muted-foreground">Pedido:</strong> {form.watch(`productsForReturn.${index}.orderNo`)}</p>
                                    <p><strong className="text-muted-foreground">Produto:</strong> {form.watch(`productsForReturn.${index}.productName`)} (Cód: {form.watch(`productsForReturn.${index}.productId`)})</p>
                                    <p><strong className="text-muted-foreground">Qtd. Devolver:</strong> {form.watch(`productsForReturn.${index}.quantityToReturn`)} | <strong className="text-muted-foreground">Etiqueta:</strong> {form.watch(`productsForReturn.${index}.labelNo`)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhum produto adicionado para devolução na NF acima.</p>
                    )}
                    <Button type="button" onClick={handleOpenCollectionOrderModal} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" disabled={returnProductFields.length === 0}>
                        <Send className="mr-2 h-4 w-4" /> Emitir Pedido de Coleta (Motoboy)
                    </Button>
                </CardContent>
            </Card>
        )}

        {/* Card: Registro Agendamento de Coleta na Transportadora */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TruckIcon className="h-6 w-6 text-primary" /> Registro Agendamento de Coleta na Transportadora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="collectionScheduledCarrier"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Transportadora</RHFFormLabel>
                    <FormControl><Input placeholder="Nome da transportadora" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="collectionReturnInvoice"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>NF de Devolução</RHFFormLabel>
                    <FormControl><Input placeholder="Número da NF de devolução" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="collectionScheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <RHFFormLabel>Data Agendamento</RHFFormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {field.value && isValid(parseISO(field.value)) ? format(parseISO(field.value), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="collectionScheduledPeriod"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Período</RHFFormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o período" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Manhã</SelectItem>
                        <SelectItem value="afternoon">Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="collectionScheduledNotes"
              render={({ field }) => (
                <FormItem>
                  <RHFFormLabel>Observações do Agendamento</RHFFormLabel>
                  <FormControl><Textarea placeholder="Detalhes adicionais sobre a coleta..." {...field} rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => handlePartialSave('Agendamento Transportadora')} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="mr-2 h-4 w-4" /> Salvar Agendamento Transportadora
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card: Recibo de Coleta */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ClipboardCheck className="h-6 w-6 text-primary" /> Recibo de Coleta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <UIAlertTitle className="text-blue-700 dark:text-blue-300">Procedimento Importante!</UIAlertTitle>
              <UIAlertDescription>
                Assim que a mercadoria for coletada pela transportadora ou motoboy, é **obrigatório** solicitar ao cliente o envio do recibo de coleta assinado/carimbado.
                Anexe este recibo aqui. Ele é crucial para comprovação junto à auditoria e em caso de divergências com a transportadora.
              </UIAlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="collectionReceiptUrl"
              render={({ field }) => (
                <FormItem>
                  <RHFFormLabel>Anexar Recibo de Coleta</RHFFormLabel>
                  {form.watch('collectionReceiptUrl') ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-muted-foreground">Recibo atual:</p>
                      <Link href={form.watch('collectionReceiptUrl')!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" /> Ver Recibo Anexado
                      </Link>
                      <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('collectionReceiptUrl', '')}>
                        <Trash2 className="mr-2 h-3 w-3" /> Remover/Substituir
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full mt-1">
                      <label htmlFor="collection-receipt-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                              <p className="text-xs text-muted-foreground">PDF, JPG, PNG (MAX. 5MB)</p>
                          </div>
                          <Input
                            id="collection-receipt-file"
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                console.log("Simulating upload for:", file.name);
                                form.setValue('collectionReceiptUrl', `https://placehold.co/300x200.png?text=Recibo_${file.name.substring(0,10)}`);
                                toast({title: "Recibo Anexado (Simulado)", description: `O arquivo ${file.name} foi anexado.`});
                              }
                            }}
                          />
                      </label>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => handlePartialSave('Recibo de Coleta')} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="mr-2 h-4 w-4" /> Salvar Recibo
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card: Detalhamento do Crédito do Cliente */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCardIcon className="h-6 w-6 text-primary" /> Detalhamento do Crédito do Cliente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                        <h3 className="text-lg font-medium text-foreground">Área do Atendente</h3>
                        <FormField control={form.control} name="creditGranted"
                            render={({ field }) => (
                                <FormItem>
                                    <RHFFormLabel>Crédito Concedido?</RHFFormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-1" >
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><RHFFormLabel className="font-normal">Sim</RHFFormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><RHFFormLabel className="font-normal">Não</RHFFormLabel></FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="creditReasonAttendant"
                            render={({ field }) => (
                                <FormItem>
                                    <RHFFormLabel>Motivo do Crédito (Atendente)</RHFFormLabel>
                                    <FormControl><Textarea placeholder="Detalhe o motivo da concessão ou não do crédito..." {...field} rows={3} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <Label className="mb-2 block">Anexar Comprovante do Crédito (Atendente)</Label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="credit-proof-file" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                        <FilePlus2 className="w-7 h-7 mb-1 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG (MAX. 5MB)</p>
                                    </div>
                                    <Input id="credit-proof-file" type="file" className="hidden" />
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="button" onClick={() => handlePartialSave('Crédito Atendente')} className="bg-green-600 hover:bg-green-700 text-white">
                                <Save className="mr-2 h-4 w-4" /> Salvar Crédito (Atendente)
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                        <h3 className="text-lg font-medium text-foreground">Área do Financeiro</h3>
                         <FormField control={form.control} name="creditStatusFinance"
                            render={({ field }) => (
                                <FormItem>
                                    <RHFFormLabel>Status Aprovação Crédito (Financeiro)</RHFFormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="approved">Aprovado</SelectItem>
                                            <SelectItem value="rejected">Rejeitado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="creditReasonFinance"
                            render={({ field }) => (
                                <FormItem>
                                    <RHFFormLabel>Parecer Financeiro</RHFFormLabel>
                                    <FormControl><Textarea placeholder="Detalhe o parecer sobre o crédito..." {...field} rows={3} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-2">
                            <Button type="button" onClick={() => handlePartialSave('Crédito Financeiro')} className="bg-green-600 hover:bg-green-700 text-white">
                                <Save className="mr-2 h-4 w-4" /> Salvar Crédito (Financeiro)
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {/* Card: Operação (Controle de Estoque) */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <PackageCheckIcon className="h-6 w-6 text-primary" /> Operação (Controle de Estoque)
                </CardTitle>
                <CardDescription>Registro do recebimento de produtos devolvidos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {operationItemFields.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum produto listado para devolução ainda.</p>}
                {operationItemFields.map((opField, index) => (
                    <Card key={opField.id} className="p-4 bg-muted/20">
                        <div className="mb-2">
                            <p className="font-medium">{opField.productName} (Cód: {opField.productId})</p>
                            <p className="text-xs text-muted-foreground">Etiqueta SAC: {opField.labelNo} | Qtd. Etiqueta SAC: {opField.labelQuantitySac} | Qtd. Devolvida SAC: {opField.quantityReturnedSac}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <FormField control={form.control} name={`operationReceivedItems.${index}.receivedCorrectly`}
                                render={({ field }) => (
                                    <FormItem>
                                        <RHFFormLabel>Recebido Corretamente?</RHFFormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Status..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="yes">Sim</SelectItem>
                                                <SelectItem value="no">Não</SelectItem>
                                                <SelectItem value="partial">Parcialmente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control} name={`operationReceivedItems.${index}.quantityToStock`}
                                render={({ field }) => (
                                    <FormItem>
                                        <RHFFormLabel>Qtd. p/ Estoque</RHFFormLabel>
                                        <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control} name={`operationReceivedItems.${index}.quantityToDiscard`}
                                render={({ field }) => (
                                    <FormItem>
                                        <RHFFormLabel>Qtd. p/ Descarte</RHFFormLabel>
                                        <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField control={form.control} name={`operationReceivedItems.${index}.operationNotes`}
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2 md:col-span-1">
                                        <RHFFormLabel>Obs. Operação</RHFFormLabel>
                                        <FormControl><Input placeholder="Observações..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {form.formState.errors.operationReceivedItems?.[index]?.quantityToStock && (
                            <Alert variant="destructive" className="mt-2 text-xs py-2 px-3">
                                <AlertTriangle className="h-3 w-3" />
                                <UIAlertDescription>{form.formState.errors.operationReceivedItems?.[index]?.quantityToStock?.message}</UIAlertDescription>
                            </Alert>
                        )}
                         {form.formState.errors.operationReceivedItems?.[index]?.receivedCorrectly && (
                            <Alert variant="destructive" className="mt-2 text-xs py-2 px-3">
                                <AlertTriangle className="h-3 w-3" />
                                <UIAlertDescription>{form.formState.errors.operationReceivedItems?.[index]?.receivedCorrectly?.message}</UIAlertDescription>
                            </Alert>
                        )}
                    </Card>
                ))}
                <div>
                    <Label className="mb-2 block">Anexar Comprovações da Operação</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="operation-proof-file" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                <FilePlus2 className="w-7 h-7 mb-1 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                            </div>
                            <Input id="operation-proof-file" type="file" className="hidden" multiple />
                        </label>
                    </div>
                </div>
                <FormField control={form.control} name="operationOpinion"
                    render={({ field }) => (
                        <FormItem>
                            <RHFFormLabel>Parecer da Operação</RHFFormLabel>
                            <FormControl><Textarea placeholder="Detalhe o parecer da operação sobre o recebimento..." {...field} rows={3} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-2">
                    <Button type="button" onClick={() => handlePartialSave('Operação')} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="mr-2 h-4 w-4" /> Salvar Operação
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        {/* Card: Auditoria */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <ShieldCheck className="h-6 w-6 text-primary" /> Auditoria
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField control={form.control} name="auditComplianceLevel"
                    render={({ field }) => (
                        <FormItem>
                            <RHFFormLabel>Nível de Conformidade da Auditoria</RHFFormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'not_evaluated'}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o nível de conformidade" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="not_evaluated">Não Avaliado</SelectItem>
                                    <SelectItem value="none">Sem Ocorrências</SelectItem>
                                    <SelectItem value="low">Não Conformidade Leve</SelectItem>
                                    <SelectItem value="medium">Não Conformidade Média</SelectItem>
                                    <SelectItem value="high">Não Conformidade Grave</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField control={form.control} name="auditOpinion"
                    render={({ field }) => (
                        <FormItem>
                            <RHFFormLabel>Parecer da Auditoria</RHFFormLabel>
                            <FormControl><Textarea placeholder="Detalhe o parecer da auditoria sobre todo o processo..." {...field} rows={4} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div>
                    <Label className="mb-2 block">Anexar Comprovações da Auditoria</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="audit-proof-file" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                <FileArchive className="w-7 h-7 mb-1 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                            </div>
                            <Input id="audit-proof-file" type="file" className="hidden" multiple />
                        </label>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button type="button" onClick={() => handlePartialSave('Auditoria')} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="mr-2 h-4 w-4" /> Salvar Auditoria
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* CardFooter with main form actions */}
        <CardFooter className="flex flex-wrap justify-end gap-2 p-0 pt-8">
          <Button type="button" variant="outline" onClick={() => form.reset(manifestation ? {
             reason: manifestation.reason || '', description: manifestation.description || (manifestation.id.startsWith('NEW-PRE-') ? manifestation.preOpeningSummary : ''),
             attendantTypedOpinion: manifestation.attendantTypedOpinion || '', attendantOpinion: manifestation.attendantOpinion || '',
             recommendedAction: manifestation.recommendedAction || '', collectionType: manifestation.collectionType || '',
             collectionScheduledCarrier: manifestation.collectionScheduledCarrier || '',
             collectionReturnInvoice: manifestation.collectionReturnInvoice || '',
             collectionScheduledDate: manifestation.collectionScheduledDate || '',
             collectionScheduledPeriod: manifestation.collectionScheduledPeriod || '',
             collectionScheduledNotes: manifestation.collectionScheduledNotes || '',
             collectionReceiptUrl: manifestation.collectionReceiptUrl || '',
             productsForReturn: manifestation.productsForReturn?.map(p => ({...p, id: p.id || `pfr-${Date.now()}-${Math.random().toString(36).substring(7)}`, quantityAcquired: p.quantityAcquired || 0 })) || [],
             creditGranted: manifestation.creditGranted || undefined, creditReasonAttendant: manifestation.creditReasonAttendant || '',
             creditProofAttendantUrl: manifestation.creditProofAttendantUrl || '', creditStatusFinance: manifestation.creditStatusFinance,
             creditReasonFinance: manifestation.creditReasonFinance || '',
            operationReceivedItems: (
                manifestation?.operationReceivedItems && manifestation.operationReceivedItems.length > 0
                ? manifestation.operationReceivedItems.map(item => ({...item, id: item.id || `opitem-initial-${item.productId}-${Math.random().toString(36).substring(7)}`}))
                : manifestation?.productsForReturn?.map((pfr, index) => ({
                    id: `opitem-pfr-${index}-${pfr.productId}-${Math.random().toString(36).substring(7)}`,
                    productId: pfr.productId,
                    productName: pfr.productName,
                    labelNo: pfr.labelNo || '',
                    labelQuantitySac: pfr.labelQuantity || 0,
                    quantityReturnedSac: pfr.quantityToReturn || 0,
                    receivedCorrectly: '',
                    quantityToStock: 0,
                    quantityToDiscard: 0,
                    operationNotes: '',
                    }))
            ) || [],
             operationProofUrls: manifestation.operationProofUrls || [], operationOpinion: manifestation.operationOpinion || '',
             auditOpinion: manifestation.auditOpinion || '',
             auditAttachmentUrls: manifestation.auditAttachmentUrls || [],
             auditComplianceLevel: manifestation.auditComplianceLevel || 'not_evaluated',
          } : {})} disabled={isLoading}>
            Cancelar Alterações
          </Button>
          <Button type="button" variant="secondary" onClick={() => { /* TODO: Encaminhar */ }} disabled={isLoading}>
            <Send className="mr-2 h-4 w-4" /> Encaminhar
          </Button>
          <Button type="button" variant="destructive" onClick={() => { /* TODO: Encerrar */ }} disabled={isLoading}>
            <CloseIcon className="mr-2 h-4 w-4" /> Encerrar Manifestação
          </Button>
          <Button type="button" onClick={handleSaveAllToFirebase} disabled={isLoading}>
             {isLoading ? (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>) : <Save className="mr-2 h-4 w-4" /> }
            Gravar
          </Button>
        </CardFooter>
      </form>

      {/* Dialog: Order Items */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-primary" />Itens do Pedido: {selectedOrderForModal?.orderNo}</DialogTitle>
            <DialogDescription>Detalhes dos produtos incluídos no pedido.</DialogDescription>
          </DialogHeader>
          {selectedOrderForModal && client && (
            <div className="space-y-4 py-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-lg">Informações do Pedido</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm pt-2">
                        <div><strong className="text-muted-foreground">Nº Pedido:</strong> {selectedOrderForModal.orderNo}</div>
                        <div><strong className="text-muted-foreground">Nº NF:</strong> {selectedOrderForModal.invoiceNo || '--'}</div>
                        <div><strong className="text-muted-foreground">Data:</strong> {selectedOrderForModal.date && isValid(parseISO(selectedOrderForModal.date)) ? format(parseISO(selectedOrderForModal.date), 'dd/MM/yyyy', {locale: ptBR}) : '--'}</div>
                        <div><strong className="text-muted-foreground">Cliente:</strong> {client.fantasyName || client.name} ({client.code})</div>
                        <div><strong className="text-muted-foreground">Filial:</strong> {selectedOrderForModal.branchNo}</div>
                        <div><strong className="text-muted-foreground">Vendedor Emissor:</strong> {selectedOrderForModal.salespersonIssuer || '--'}</div>
                        <div><strong className="text-muted-foreground">Forma Pag.:</strong> {selectedOrderForModal.paymentMethod || '--'}</div>
                        <div><strong className="text-muted-foreground">Tipo Entrega:</strong> {selectedOrderForModal.deliveryType || '--'}</div>
                        <div><strong className="text-muted-foreground">Data Entrega:</strong> {selectedOrderForModal.deliveryDate && isValid(parseISO(selectedOrderForModal.deliveryDate)) ? format(parseISO(selectedOrderForModal.deliveryDate), 'dd/MM/yyyy', {locale: ptBR}) : '--'}</div>
                        <div><strong className="text-muted-foreground">Separador:</strong> {selectedOrderForModal.separatorName || '--'}</div>
                        <div><strong className="text-muted-foreground">Conferente:</strong> {selectedOrderForModal.checkerName || '--'}</div>
                        <div><strong className="text-muted-foreground">Entregador:</strong> {selectedOrderForModal.deliveryPersonName || '--'}</div>
                    </CardContent>
                </Card>
                <OrderItemsTable items={selectedOrderForModal.items} orderNo={selectedOrderForModal.orderNo} onAddItemToReturn={handleAddProductToReturnFromModal} />
            </div>
          )}
           <DialogUIFooter><Button onClick={() => setIsOrderModalOpen(false)}>Fechar</Button></DialogUIFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: History Log Details */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Detalhe do Histórico</DialogTitle>
                {selectedHistoryLog && (<DialogDescription>Ação realizada em {selectedHistoryLog.timestamp && isValid(parseISO(selectedHistoryLog.timestamp)) ? format(parseISO(selectedHistoryLog.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data inválida'} por {selectedHistoryLog.userName}.</DialogDescription>)}
            </DialogHeader>
            {selectedHistoryLog && manifestation && (
                <div className="py-4 space-y-3">
                    <p><strong className="text-muted-foreground">Ação:</strong> {selectedHistoryLog.action}</p>
                    <p><strong className="text-muted-foreground">Usuário:</strong> {selectedHistoryLog.userName} ({selectedHistoryLog.userId})</p>
                    {selectedHistoryLog.details && (<div><strong className="text-muted-foreground">Detalhes do Log:</strong><p className="text-sm p-2 bg-muted/50 rounded-md mt-1 whitespace-pre-wrap">{selectedHistoryLog.details}</p></div>)}
                    <Separator className="my-3" />
                    <p><strong className="text-muted-foreground">Motivo da Manifestação (no momento do log):</strong> {form.getValues('reason') || "Não informado"}</p>
                    <div><strong className="text-muted-foreground">Descrição da Manifestação (no momento do log):</strong><p className="text-sm p-2 bg-muted/50 rounded-md mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">{form.getValues('description') || "Não informada"}</p></div>
                </div>
            )}
            <DialogUIFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Fechar</Button>
                {manifestation &&
                    <Button type="button" onClick={() => { router.push(`/manifestations/${manifestation.id}`); setIsHistoryModalOpen(false); }}>
                        <EyeIcon className="mr-2 h-4 w-4" /> Ver Manifestação Atual
                    </Button>
                }
            </DialogUIFooter>
            </DialogContent>
        </Dialog>

      {/* Dialog: Collection Order Emission */}
        <Dialog open={isCollectionOrderModalOpen} onOpenChange={setIsCollectionOrderModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/>Emitir Pedido de Coleta</DialogTitle>
                    <DialogDescription>Confirme os itens para coleta e valide sua senha para prosseguir.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <h4 className="font-medium text-md">Itens para Coleta:</h4>
                    {form.getValues('productsForReturn')?.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filial</TableHead>
                                    <TableHead>Cód. Produto</TableHead>
                                    <TableHead>Produto (Nome)</TableHead>
                                    <TableHead className="text-right">Qtd.</TableHead>
                                    <TableHead>Etiqueta</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {form.watch('productsForReturn')?.map(item => {
                                    const order = clientOrders.find(o => o.orderNo === item.orderNo);
                                    return (
                                        <TableRow key={item.id || item.productId}>
                                            <TableCell>{order?.branchNo || 'N/A'}</TableCell>
                                            <TableCell>{item.productId}</TableCell>
                                            <TableCell>{item.productName || item.productId}</TableCell>
                                            <TableCell className="text-right">{item.quantityToReturn}</TableCell>
                                            <TableCell>{item.labelNo}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhum produto selecionado para devolução.</p>
                    )}
                    <div className="space-y-2 pt-4">
                        <Label htmlFor="collection-password">Senha do Usuário</Label>
                        <Input
                            id="collection-password"
                            type="password"
                            value={collectionPassword}
                            onChange={(e) => { setCollectionPassword(e.target.value); setCollectionPasswordError(''); }}
                            placeholder="Digite sua senha"
                        />
                        {collectionPasswordError && <p className="text-sm text-destructive">{collectionPasswordError}</p>}
                        <p className="text-xs text-muted-foreground">Para fins de simulação, use a senha: password123</p>
                    </div>
                </div>
                <DialogUIFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCollectionOrderModalOpen(false)}>Cancelar</Button>
                    <Button type="button" onClick={handleConfirmCollectionOrder} disabled={!form.getValues('productsForReturn')?.length || !collectionPassword.trim()}>Confirmar Emissão</Button>
                </DialogUIFooter>
            </DialogContent>
        </Dialog>
    </RHFForm>
  );
}

    
