"use client";

import type { ParameterItem } from '@/lib/types';
import { ParametersTable } from '@/components/admin/parameters-table';
import { Button } from '@/components/ui/button';
import { mockParameterItems } from '@/lib/types'; // Using mock data
import { PlusCircle, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { fetchParameterItems, createParameterItem, updateParameterItem, deleteParameterItem } from '@/lib/firebase';


export default function AdminParametersPage() {

  const [parameters, setParameters] = useState<ParameterItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<ParameterItem | null>(null);
  const [newParameter, setNewParameter] = useState<{name: string, type: ParameterItem['type'], isActive: boolean}>({name: '', type: 'reason', isActive: true});
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const allParameterItems = await fetchParameterItems();
      setParameters(allParameterItems);
    } catch (error) {
      console.error('Error loading parameters:', error);
      // Fallback to mock data if Firebase fails
      setParameters(mockParameterItems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParameters();
  }, []);

  const handleEdit = (parameter: ParameterItem) => {
    setEditingParameter(parameter);
    setNewParameter({ name: parameter.name, type: parameter.type, isActive: parameter.isActive });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (parameterId: string, isActive: boolean) => {
    try {
      // Update in Firebase
      await updateParameterItem(parameterId, { isActive });
      
      // Update local state
      setParameters(prev => 
        prev.map(p => p.id === parameterId ? { ...p, isActive } : p)
      );
      toast({ title: `Parâmetro ${isActive ? 'ativado' : 'desativado'}.` });
    } catch (error) {
      console.error('Error toggling parameter active status:', error);
      toast({ 
        title: 'Erro ao alterar status do parâmetro', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (parameterId: string) => {
    // Confirm deletion
    if (confirm("Tem certeza que deseja excluir este parâmetro? Esta ação não pode ser desfeita.")) {
      try {
        // Delete from Firebase
        await deleteParameterItem(parameterId);
        
        // Update local state
        setParameters(prev => prev.filter(p => p.id !== parameterId));
        toast({ title: "Parâmetro excluído.", variant: 'destructive' });
      } catch (error) {
        console.error('Error deleting parameter:', error);
        toast({ 
          title: 'Erro ao excluir parâmetro', 
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive' 
        });
      }
    }
  };
  
  const handleOpenNewDialog = () => {
    setEditingParameter(null);
    setNewParameter({ name: '', type: 'reason', isActive: true });
    setIsDialogOpen(true);
  };

  const handleSaveParameter = async () => {
    if (!newParameter.name.trim() || !newParameter.type) {
        toast({title: "Erro", description: "Nome e tipo são obrigatórios.", variant: "destructive"});
        return;
    }

    try {
      if (editingParameter) {
        // Update existing parameter in Firebase
        await updateParameterItem(editingParameter.id, newParameter);
        toast({ title: "Parâmetro atualizado!" });
      } else {
        // Create new parameter in Firebase
        await createParameterItem(newParameter);
        toast({ title: "Novo parâmetro adicionado!" });
      }
      
      // Reload data from Firebase to ensure consistency
      await loadParameters();
      
      setIsDialogOpen(false);
      setEditingParameter(null);
      // Reset form
      setNewParameter({ name: '', type: 'reason', isActive: true });
    } catch (error) {
      console.error('Error saving parameter:', error);
      toast({ 
        title: 'Erro ao salvar parâmetro', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Cadastro de Parâmetros</h1>
            <p className="text-muted-foreground">Gerencie os motivos, ações, tipos de coleta e papéis de usuário.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenNewDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Parâmetro
          </Button>
        </div>
      </div>
      
      {/* Filters Placeholder - can be implemented similarly to ManifestationFilters */}
      <div className="flex gap-2 p-4 border rounded-lg bg-card">
        <Input placeholder="Buscar por nome..." className="max-w-xs"/>
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="reason">Motivo</SelectItem>
                <SelectItem value="recommendedAction">Ação Recomendada</SelectItem>
                <SelectItem value="collectionType">Tipo de Coleta</SelectItem>
                <SelectItem value="attendantOpinionOption">Opção Parecer Atendente</SelectItem>
                <SelectItem value="userRole">Tipo de Usuário</SelectItem>
            </SelectContent>
        </Select>
         <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem> 
            </SelectContent>
        </Select>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4"/> Aplicar</Button>
      </div>

      <ParametersTable 
        parameters={parameters} 
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingParameter ? 'Editar Parâmetro' : 'Novo Parâmetro'}</DialogTitle>
            <DialogDescription>
              {editingParameter ? 'Modifique os dados do parâmetro.' : 'Preencha os dados para criar um novo parâmetro.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={newParameter.name} onChange={(e) => setNewParameter(p => ({...p, name: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Tipo</Label>
              <Select 
                value={newParameter.type} 
                onValueChange={(value: ParameterItem['type']) => setNewParameter(p => ({...p, type: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reason">Motivo</SelectItem>
                  <SelectItem value="recommendedAction">Ação Recomendada</SelectItem>
                  <SelectItem value="collectionType">Tipo de Coleta</SelectItem>
                  <SelectItem value="attendantOpinionOption">Opção Parecer Atendente</SelectItem>
                  <SelectItem value="userRole">Tipo de Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">Status</Label>
                <div className="col-span-3 flex items-center space-x-2">
                    <Switch 
                        id="isActive" 
                        checked={newParameter.isActive} 
                        onCheckedChange={(checked) => setNewParameter(p => ({...p, isActive: checked}))}
                    />
                    <span>{newParameter.isActive ? "Ativo" : "Inativo"}</span>
                </div>
             </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSaveParameter}>Salvar Parâmetro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
