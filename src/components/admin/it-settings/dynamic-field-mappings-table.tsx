
"use client";

import type { DynamicFieldMapping } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, EyeOff, Eye, Link2 } from 'lucide-react';

interface DynamicFieldMappingsTableProps {
  mappings: DynamicFieldMapping[];
  onEdit: (mapping: DynamicFieldMapping) => void;
  onToggleActive: (mappingId: string, isActive: boolean) => void;
  onDelete: (mappingId: string) => void;
}

export function DynamicFieldMappingsTable({ mappings, onEdit, onToggleActive, onDelete }: DynamicFieldMappingsTableProps) {
  
  if (mappings.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum mapeamento de campo dinâmico cadastrado.</p>;
  }
  
  return (
    <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campo da Aplicação</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tabela Oracle</TableHead>
            <TableHead>Col. Valor</TableHead>
            <TableHead>Col. Exibição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((map) => (
            <TableRow key={map.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                {map.applicationField}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{map.description}</TableCell>
              <TableCell>{map.oracleTable}</TableCell>
              <TableCell>{map.oracleValueColumn}</TableCell>
              <TableCell>{map.oracleDisplayColumn}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`status-${map.id}`}
                    checked={map.isActive}
                    onCheckedChange={(checked) => onToggleActive(map.id, checked)}
                    aria-label={map.isActive ? "Desativar" : "Ativar"}
                  />
                   <Badge variant={map.isActive ? 'default' : 'outline'} className={map.isActive ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                    {map.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                       <span className="sr-only">Ações para {map.applicationField}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(map)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(map.id, !map.isActive)}>
                      {map.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {map.isActive ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => onDelete(map.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
