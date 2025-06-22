
"use client";

import type { User, UserRole, ParameterItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, EyeOff, Eye } from 'lucide-react'; // UserCircle removed
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onDelete: (userId: string) => void;
  userRolesParams: ParameterItem[];
}

export function UsersTable({ users, onEdit, onToggleActive, onDelete, userRolesParams }: UsersTableProps) {

  const getRoleDisplayName = (roleValue: UserRole) => {
    const roleParam = userRolesParams.find(p => p.name.toLowerCase() === roleValue);
    return roleParam ? roleParam.name : roleValue.charAt(0).toUpperCase() + roleValue.slice(1);
  };
  
  const getInitials = (name?: string | null) => {
    if (!name || name.trim() === "") return '?';
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Avatar className="h-9 w-9">
                  {/* Use user.photoURL if available, otherwise generate placeholder with initials */}
                  <AvatarImage 
                    src={user.photoURL || `https://placehold.co/40x40.png?text=${getInitials(user.displayName)}`} 
                    alt={user.displayName || 'User'} 
                    data-ai-hint="user avatar" 
                  />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{getRoleDisplayName(user.role)}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`status-${user.id}`}
                    checked={user.isActive ?? true} // Ensure isActive has a default for switch
                    onCheckedChange={(checked) => onToggleActive(user.id, checked)}
                    aria-label={user.isActive ? "Desativar" : "Ativar"}
                  />
                  <Badge variant={user.isActive ? 'default' : 'outline'} className={user.isActive ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Ações para {user.displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(user.id, !(user.isActive ?? true))}>
                      {user.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {user.isActive ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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

    