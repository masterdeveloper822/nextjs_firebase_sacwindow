"use client";

import type { User, UserRole, ParameterItem } from '@/lib/types';
import { UsersTable } from '@/components/admin/user-management/users-table';
import { Button } from '@/components/ui/button';
import { mockUsers as initialMockUsers, mockParameterItems } from '@/lib/types';
import { PlusCircle, Filter, Users as UsersIcon, RotateCcw } from 'lucide-react'; // Added RotateCcw
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createUser, updateUser, deleteUser } from '@/lib/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ALL_USERS_STORAGE_KEY = 'allMockUsersList';

const userFormSchema = z.object({
  displayName: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido.").min(1, "E-mail é obrigatório."),
  role: z.custom<UserRole>(val => typeof val === 'string' && val.length > 0, "Papel é obrigatório."),
  isActive: z.boolean().default(true),
  id: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function AdminUserManagementPage() {
  const { toast } = useToast();
  const { user: loggedInUser, forceContextRefresh, logout } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<ParameterItem[]>([]);
  const [isReloading, setIsReloading] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      role: 'attendant',
      isActive: true,
    },
  });

  const loadUsersFromStorage = useCallback(() => {
    setIsReloading(true);
    let loadedUsers: User[] = [];
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem(ALL_USERS_STORAGE_KEY);
      if (storedUsers) {
        try {
          loadedUsers = JSON.parse(storedUsers);
        } catch (e) {
          console.error("Failed to parse users from localStorage, seeding from initialMockUsers.", e);
          loadedUsers = [...initialMockUsers];
          localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(loadedUsers));
        }
      } else {
        console.log("No users in localStorage, seeding from initialMockUsers.");
        loadedUsers = [...initialMockUsers];
        localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(loadedUsers));
      }
    } else {
        loadedUsers = [...initialMockUsers]; // Fallback for SSR or environments without localStorage
    }
    setUsers(loadedUsers);
    setIsReloading(false);
    return loadedUsers;
  }, []);

  useEffect(() => {
    loadUsersFromStorage();
    setUserRoles(mockParameterItems.filter(p => p.type === 'userRole' && p.isActive));
  }, [loadUsersFromStorage]);


  const updateUsersAndStorage = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    }
  };

  const checkUserExistsInFirebase = async (userId: string): Promise<boolean> => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking if user exists in Firebase:', error);
      return false;
    }
  };

  const findUserByEmailInFirebase = async (email: string): Promise<string | null> => {
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error finding user by email in Firebase:', error);
      return null;
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    form.reset({
      id: user.id,
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role,
      isActive: user.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    let wasLoggedInUserModified = false;
    const userToUpdate = users.find(u => u.id === userId);
    
    if (!userToUpdate) {
      toast({ title: "Usuário não encontrado.", variant: 'destructive' });
      return;
    }

    try {
      // Find the user in Firebase by email to get the correct document ID
      const firebaseUserId = userToUpdate.email ? await findUserByEmailInFirebase(userToUpdate.email) : null;
      
      if (firebaseUserId) {
        // Update in Firebase
        await updateUser(firebaseUserId, { isActive });
      } else {
        // User doesn't exist in Firebase, create it
        const { id, ...userData } = userToUpdate;
        const newFirebaseId = await createUser({ ...userData, isActive } as Omit<User, "id">);
        
        // Update local user with Firebase ID
        const updatedUsers = users.map(u => {
          if (u.id === userId) {
            return { ...u, id: newFirebaseId, isActive };
          }
          return u;
        });
        updateUsersAndStorage(updatedUsers);
        
        if (loggedInUser && loggedInUser.id === userId) {
          wasLoggedInUserModified = true;
        }
        
        toast({ title: `Usuário ${isActive ? 'ativado' : 'desativado'}.` });
        return;
      }

      // Update local state
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          if (loggedInUser && loggedInUser.id === userId && loggedInUser.isActive !== isActive) {
            wasLoggedInUserModified = true;
          }
          return { ...u, isActive };
        }
        return u;
      });
      updateUsersAndStorage(updatedUsers);

      if (wasLoggedInUserModified) {
        const modifiedUser = updatedUsers.find(u => u.id === userId);
        if (modifiedUser && typeof window !== 'undefined') {
          if (modifiedUser.isActive === false && loggedInUser?.id === modifiedUser.id) {
              toast({ title: `Seu usuário foi desativado. Você será deslogado.` });
              logout();
              return;
          } else {
              localStorage.setItem('authUser', JSON.stringify(modifiedUser));
              localStorage.setItem('authRole', modifiedUser.role);
              forceContextRefresh();
          }
        }
      }
      toast({ title: `Usuário ${isActive ? 'ativado' : 'desativado'}.` });
    } catch (error) {
      console.error('Error toggling user active status:', error);
      toast({ 
        title: 'Erro ao alterar status do usuário', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      const userToDelete = users.find(u => u.id === userId);
      
      if (!userToDelete) {
        toast({ title: "Usuário não encontrado.", variant: 'destructive' });
        return;
      }

      try {
        // Find the user in Firebase by email to get the correct document ID
        const firebaseUserId = userToDelete.email ? await findUserByEmailInFirebase(userToDelete.email) : null;
        
        if (firebaseUserId) {
          // Delete from Firebase
          await deleteUser(firebaseUserId);
        }
        
        // Update local state
        const updatedUsers = users.filter(u => u.id !== userId);
        updateUsersAndStorage(updatedUsers);
        
        toast({ title: "Usuário excluído.", variant: 'destructive' });
        
        if (loggedInUser && loggedInUser.id === userId) {
          toast({ title: "Seu usuário foi excluído. Você será deslogado." });
          logout();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({ 
          title: 'Erro ao excluir usuário', 
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive' 
        });
      }
    }
  };

  const handleOpenNewDialog = () => {
    setEditingUserId(null);
    form.reset({
      displayName: '',
      email: '',
      role: 'attendant',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const processSaveUser = async (data: UserFormValues) => {
    let updatedUsers: User[];
    let userThatWasModified: User | undefined;
    let originalRoleOfModifiedUser: UserRole | undefined;
    const editingUser = editingUserId ? users.find(u => u.id === editingUserId) : null;

    try {
      if (editingUser) {
        originalRoleOfModifiedUser = editingUser.role;
        userThatWasModified = { ...editingUser, ...data } as User;
        
        // Find the user in Firebase by email to get the correct document ID
        const firebaseUserId = editingUser.email ? await findUserByEmailInFirebase(editingUser.email) : null;
        const userExistsInFirebase = !!firebaseUserId;
        
        if (userExistsInFirebase && firebaseUserId) {
          // Update existing user in Firebase using the correct document ID
          const { id, ...userData } = userThatWasModified;
          await updateUser(firebaseUserId, userData);
          
          // Update the local user with the Firebase document ID if it's different
          if (firebaseUserId !== editingUser.id) {
            userThatWasModified = { ...userThatWasModified, id: firebaseUserId };
          }
        } else {
          // Create new user in Firebase
          const { id, ...userData } = userThatWasModified;
          const newFirebaseId = await createUser(userData as Omit<User, "id">);
          userThatWasModified = { ...userThatWasModified, id: newFirebaseId };
        }
        
        // Update the local array
        updatedUsers = users.map(u => {
          if (u.id === editingUser.id) {
            return userThatWasModified!;
          }
          return u;
        });
        
        toast({ title: "Usuário atualizado!" });
      } else {
        const newUserId = `user-${Date.now()}`;
        userThatWasModified = {
          id: newUserId,
          displayName: data.displayName!,
          email: data.email!,
          photoURL: '',
          role: data.role as UserRole,
          isActive: data.isActive!,
        };
        
        // Create in Firebase
        const { id, ...userData } = userThatWasModified;
        const firebaseId = await createUser(userData as Omit<User, "id">);
        
        // Update the user with the Firebase-generated ID
        userThatWasModified = { ...userThatWasModified, id: firebaseId };
        updatedUsers = [...users, userThatWasModified];
        
        toast({ title: "Novo usuário adicionado!" });
      }
      
      updateUsersAndStorage(updatedUsers);

      if (userThatWasModified && loggedInUser && loggedInUser.id === userThatWasModified.id) {
          if (typeof window !== 'undefined') {
              if (originalRoleOfModifiedUser && userThatWasModified.role !== originalRoleOfModifiedUser) {
                  toast({ title: "Seu papel foi alterado.", description: "Você será deslogado para aplicar as novas permissões." });
                  logout();
                  setIsDialogOpen(false);
                  setEditingUserId(null);
                  return; 
              } else {
                  localStorage.setItem('authUser', JSON.stringify(userThatWasModified));
                  localStorage.setItem('authRole', userThatWasModified.role);
                  forceContextRefresh();
              }
          }
      }

      setIsDialogOpen(false);
      setEditingUserId(null);
    } catch (error) {
      console.error('Error in processSaveUser:', error);
      toast({ 
        title: 'Erro ao salvar usuário', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  const handleReloadList = () => {
    loadUsersFromStorage();
    toast({ title: "Lista de usuários recarregada." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-primary" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">Adicione, edite e gerencie os usuários do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleReloadList} variant="outline" disabled={isReloading}>
            {isReloading ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> : <RotateCcw className="mr-2 h-4 w-4" />}
            Recarregar Lista
          </Button>
          <Button onClick={handleOpenNewDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-4 border rounded-lg bg-card">
        <Input placeholder="Buscar por nome ou e-mail..." className="max-w-xs" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Papéis</SelectItem>
            {userRoles.map(roleParam => (
              <SelectItem key={roleParam.id} value={roleParam.name.toLowerCase() as string}>{roleParam.name}</SelectItem>
            ))}
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
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Aplicar</Button>
      </div>

      <UsersTable
        users={users}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        userRolesParams={userRoles}
      />

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
            setEditingUserId(null);
            form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUserId ? 'Modifique os dados do usuário.' : 'Preencha os dados para criar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processSaveUser)}>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nome</FormLabel>
                      <FormControl className="col-span-3">
                        <Input placeholder="Nome Completo" {...field} />
                      </FormControl>
                      <div className="col-start-2 col-span-3"><FormMessage /></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">E-mail</FormLabel>
                      <FormControl className="col-span-3">
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <div className="col-start-2 col-span-3"><FormMessage /></div>
                    </FormItem>
                  )}
                />
                {!editingUserId && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Senha</FormLabel>
                        <Input type="password" placeholder="Senha temporária será enviada" disabled className="col-span-3 bg-muted/50" />
                    </div>
                )}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Papel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl className="col-span-3">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o papel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map(roleParam => (
                            <SelectItem key={roleParam.id} value={roleParam.name.toLowerCase() as UserRole}>{roleParam.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="col-start-2 col-span-3"><FormMessage /></div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Status</FormLabel>
                      <FormControl>
                        <div className="col-span-3 flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span>{field.value ? "Ativo" : "Inativo"}</span>
                        </div>
                      </FormControl>
                      <div className="col-start-2 col-span-3"><FormMessage /></div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                    Salvar Usuário
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
