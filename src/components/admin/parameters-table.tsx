
"use client";

import type { ParameterItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, EyeOff, Eye } from 'lucide-react';

interface ParametersTableProps {
  parameters: ParameterItem[];
  onEdit: (parameter: ParameterItem) => void;
  onToggleActive: (parameterId: string, isActive: boolean) => void;
  onDelete: (parameterId: string) => void;
}

const parameterTypeLabels: Record<ParameterItem['type'], string> = {
  reason: 'Motivo',
  recommendedAction: 'Ação Recomendada',
  collectionType: 'Tipo de Coleta',
  actionButton: 'Botão de Ação',
  attendantOpinionOption: 'Opção Parecer Atendente',
  userRole: 'Tipo de Usuário',
};

export function ParametersTable({ parameters, onEdit, onToggleActive, onDelete }: ParametersTableProps) {
  
  if (parameters.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum parâmetro cadastrado.</p>;
  }
  
  return (
    <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((param) => (
            <TableRow key={param.id}>
              <TableCell className="font-medium">{param.name}</TableCell>
              <TableCell>{parameterTypeLabels[param.type] || param.type}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`status-${param.id}`}
                    checked={param.isActive}
                    onCheckedChange={(checked) => onToggleActive(param.id, checked)}
                    aria-label={param.isActive ? "Desativar" : "Ativar"}
                  />
                   <Badge variant={param.isActive ? 'default' : 'outline'} className={param.isActive ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                    {param.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                       <span className="sr-only">Ações para {param.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(param)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(param.id, !param.isActive)}>
                      {param.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {param.isActive ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => onDelete(param.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
