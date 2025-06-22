"use client";

import type { DynamicFieldMapping } from '@/lib/types';
import { DynamicFieldMappingsTable } from './dynamic-field-mappings-table';
import { Button } from '@/components/ui/button';
import { mockDynamicFieldMappings } from '@/lib/types'; // Using mock data
import { PlusCircle, Filter, Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchDynamicFieldMappings, createDynamicFieldMapping, updateDynamicFieldMapping, deleteDynamicFieldMapping } from '@/lib/firebase';

// Application fields that can be mapped dynamically
const availableApplicationFields = [
  { value: "ManifestationReason", label: "Motivo da Manifestação" },
  { value: "RecommendedAction", label: "Ação Recomendada da Manifestação" },
  { value: "CollectionType", label: "Tipo de Coleta da Manifestação" },
  { value: "ProductCategory", label: "Categoria de Produto" },
  { value: "ClientSegment", label: "Segmento de Cliente" },
  // Add other mappable fields here
];

const mappingSchema = z.object({
  applicationField: z.string().min(1, "Campo da Aplicação é obrigatório."),
  description: z.string().min(1, "Descrição é obrigatória."),
  oracleTable: z.string().min(1, "Tabela Oracle é obrigatória."),
  oracleValueColumn: z.string().min(1, "Coluna Valor Oracle é obrigatória."),
  oracleDisplayColumn: z.string().min(1, "Coluna Exibição Oracle é obrigatória."),
  isActive: z.boolean().default(true),
});

type MappingFormValues = z.infer<typeof mappingSchema>;

export function DynamicFieldMappingsManager() {

  const [mappings, setMappings] = useState<DynamicFieldMapping[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      applicationField: '',
      description: '',
      oracleTable: '',
      oracleValueColumn: '',
      oracleDisplayColumn: '',
      isActive: true,
    },
  });

  useEffect(() => {
    const loadMappings = async () => {
      try {
        const allDynamicFieldMappings = await fetchDynamicFieldMappings();
        setMappings(allDynamicFieldMappings);
      } catch (error) {
        console.error('Error loading dynamic field mappings:', error);
        // Fallback to mock data if Firebase fails
        setMappings(mockDynamicFieldMappings);
      }
    };
    
    loadMappings();
  }, []);

  const handleEdit = (mapping: DynamicFieldMapping) => {
    setEditingMappingId(mapping.id);
    form.reset({
      applicationField: mapping.applicationField,
      description: mapping.description,
      oracleTable: mapping.oracleTable,
      oracleValueColumn: mapping.oracleValueColumn,
      oracleDisplayColumn: mapping.oracleDisplayColumn,
      isActive: mapping.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (mappingId: string, isActive: boolean) => {
    try {
      // Update in Firebase
      await updateDynamicFieldMapping(mappingId, { isActive });
      
      // Update local state
      setMappings(prev => 
        prev.map(m => m.id === mappingId ? { ...m, isActive } : m)
      );
      toast({ title: `Mapeamento ${isActive ? 'ativado' : 'desativado'}.` });
    } catch (error) {
      console.error('Error toggling mapping active status:', error);
      toast({ 
        title: 'Erro ao alterar status do mapeamento', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (mappingId: string) => {
    if (confirm("Tem certeza que deseja excluir este mapeamento? Esta ação não pode ser desfeita.")) {
      try {
        // Delete from Firebase
        await deleteDynamicFieldMapping(mappingId);
        
        // Update local state
        setMappings(prev => prev.filter(m => m.id !== mappingId));
        toast({ title: "Mapeamento excluído.", variant: 'destructive' });
      } catch (error) {
        console.error('Error deleting mapping:', error);
        toast({ 
          title: 'Erro ao excluir mapeamento', 
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive' 
        });
      }
    }
  };
  
  const handleOpenNewDialog = () => {
    setEditingMappingId(null);
    form.reset({ // Reset to default values for a new mapping
      applicationField: '',
      description: '',
      oracleTable: '',
      oracleValueColumn: '',
      oracleDisplayColumn: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const processSaveMapping = async (data: MappingFormValues) => {
    try {
      if (editingMappingId) {
        // Update existing mapping in Firebase
        await updateDynamicFieldMapping(editingMappingId, data);
        
        // Update local state
        setMappings(prev => prev.map(m => m.id === editingMappingId ? { ...m, ...data, id: editingMappingId } : m));
        toast({ title: "Mapeamento atualizado!" });
      } else {
        // Create new mapping in Firebase
        const firebaseId = await createDynamicFieldMapping(data);
        
        // Add new mapping to local state with Firebase ID
        const newMapItem: DynamicFieldMapping = { id: firebaseId, ...data };
        setMappings(prev => [...prev, newMapItem]);
        toast({ title: "Novo mapeamento adicionado!" });
      }
      
      setIsDialogOpen(false);
      setEditingMappingId(null);
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast({ 
        title: 'Erro ao salvar mapeamento', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6">
       <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="text-xl">Mapeamento de Campos Dinâmicos</CardTitle>
            <CardDescription className="flex items-center">
                Configure como os campos selecionáveis da aplicação (ex: Motivos, Tipos de Coleta) são populados a partir do seu banco de dados.
                <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="h-5 w-5 ml-1"><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger>
                    <PopoverContent className="w-80 text-xs">
                        <p className="font-medium mb-1">Como funciona?</p>
                        <p>Para cada "Campo da Aplicação" (ex: Motivo da Manifestação), você especifica qual Tabela (Oracle, PostgreSQL ou MySQL) e quais Colunas (uma para o valor interno, outra para exibição ao usuário) devem ser usadas para buscar as opções.</p>
                        <p className="mt-2">Isso permite que as listas de seleção no sistema sejam dinamicamente preenchidas com dados do seu próprio ambiente.</p>
                    </PopoverContent>
                </Popover>
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Alert variant="default" className="bg-accent/10 border-accent/30 mb-6">
                <Info className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent">Nota de Implementação</AlertTitle>
                <AlertDescription>
                    Após configurar e ativar estes mapeamentos, a aplicação tentará buscar os dados para os campos correspondentes diretamente das tabelas especificadas, substituindo os "Parâmetros do App" para aqueles campos.
                </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex gap-2 flex-wrap">
                <Input placeholder="Buscar por nome do campo ou tabela..." className="max-w-xs"/>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4"/> Aplicar Filtros</Button>
                </div>
                <Button onClick={handleOpenNewDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Mapeamento
                </Button>
            </div>
            
            <DynamicFieldMappingsTable 
                mappings={mappings} 
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
            />
        </CardContent>
       </Card>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
              setEditingMappingId(null);
              form.reset(); // Reset form when dialog closes
          }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMappingId ? 'Editar Mapeamento' : 'Novo Mapeamento de Campo'}</DialogTitle>
            <DialogDescription>
              {editingMappingId ? 'Modifique os dados do mapeamento.' : 'Preencha os dados para criar um novo mapeamento de campo dinâmico.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processSaveMapping)}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <FormField
                  control={form.control}
                  name="applicationField"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <RHFFormLabel className="text-right">Campo Aplicação</RHFFormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o campo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableApplicationFields.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="col-start-2 col-span-3"><FormMessage/></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <RHFFormLabel htmlFor="description" className="text-right">Descrição</RHFFormLabel>
                      <FormControl>
                        <Textarea id="description" {...field} className="col-span-3" placeholder="Descrição amigável do campo (Ex: Motivos para abertura de SAC)" rows={2}/>
                      </FormControl>
                      <div className="col-start-2 col-span-3"><FormMessage/></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oracleTable"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <RHFFormLabel htmlFor="oracleTable" className="text-right">Tabela BD</RHFFormLabel>
                      <FormControl>
                        <Input id="oracleTable" {...field} className="col-span-3" placeholder="Ex: TBL_MOTIVOS_SAC" />
                      </FormControl>
                       <div className="col-start-2 col-span-3"><FormMessage/></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oracleValueColumn"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <RHFFormLabel htmlFor="oracleValueColumn" className="text-right">Coluna Valor BD</RHFFormLabel>
                      <FormControl>
                        <Input id="oracleValueColumn" {...field} className="col-span-3" placeholder="Ex: COD_MOTIVO" />
                      </FormControl>
                       <div className="col-start-2 col-span-3"><FormMessage/></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oracleDisplayColumn"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <RHFFormLabel htmlFor="oracleDisplayColumn" className="text-right">Coluna Exibição BD</RHFFormLabel>
                      <FormControl>
                        <Input id="oracleDisplayColumn" {...field} className="col-span-3" placeholder="Ex: DESC_MOTIVO_COMPLETA" />
                      </FormControl>
                      <div className="col-start-2 col-span-3"><FormMessage/></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <RHFFormLabel htmlFor="isActive" className="text-right">Status</RHFFormLabel>
                      <FormControl>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Switch 
                                id="isActive" 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                            />
                            <span>{field.value ? "Ativo" : "Inativo"}</span>
                        </div>
                      </FormControl>
                      <div className="col-start-2 col-span-3"><FormMessage/></div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Mapeamento</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
