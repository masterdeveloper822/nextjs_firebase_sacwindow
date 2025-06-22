
"use client";

import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, Building, Mail, Phone, FileText as IdCardIcon, MapPin, Briefcase, CalendarDays, TrendingUp, MessageSquareWarning, Send, FileEdit } from 'lucide-react';
import React, { useState } from 'react';
import { mockClients, mockOrders } from '@/lib/types'; // Using mock data
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientSearchFormProps {
  onClientSelect: (client: Client, action: 'pre-open' | 'full-open') => void;
}

export function ClientSearchForm({ onClientSelect }: ClientSearchFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    // Simulate API call - REMOVED DELAY
    // await new Promise(resolve => setTimeout(resolve, 500));

    const lowerSearchTerm = searchTerm.toLowerCase();
    const numericSearchTerm = searchTerm.replace(/[^\d]/g, "");

    const clientsFoundByLabel = new Set<string>();
    if (searchTerm.trim()) {
        mockOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.labelNo && item.labelNo.toLowerCase().includes(lowerSearchTerm)) {
                    clientsFoundByLabel.add(order.clientId);
                }
            });
        });
    }

    const filteredClients = mockClients.filter(
      client =>
        client.name.toLowerCase().includes(lowerSearchTerm) ||
        client.code.toLowerCase().includes(lowerSearchTerm) ||
        (client.fantasyName && client.fantasyName.toLowerCase().includes(lowerSearchTerm)) ||
        client.cnpjCpf.replace(/[^\d]/g, "").includes(numericSearchTerm) ||
        clientsFoundByLabel.has(client.id)
    );
    setSearchResults(filteredClients);
    setIsLoading(false);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm(''); // Clear search term after selection
    setSearchResults([]); // Clear search results after selection
  };

  const handleAction = (action: 'pre-open' | 'full-open') => {
    if (selectedClient) {
      onClientSelect(selectedClient, action);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Buscar Cliente
          </CardTitle>
          <CardDescription>Procure por Razão Social, Nome Fantasia, Código, CNPJ/CPF ou Nº Etiqueta para iniciar uma nova manifestação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o nome, código, CNPJ/CPF do cliente ou Nº Etiqueta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {searchResults.map(client => (
                <div
                  key={client.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectClient(client)}
                >
                  <p className="font-medium">{client.name} ({client.code})</p>
                  <p className="text-sm text-muted-foreground">{client.fantasyName ? `${client.fantasyName} - ` : ''}{client.cnpjCpf}</p>
                </div>
              ))}
            </div>
          )}
           {searchResults.length === 0 && searchTerm && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhum cliente encontrado.</p>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Cliente Selecionado: {selectedClient.fantasyName || selectedClient.name}
            </CardTitle>
            <CardDescription>Confirme os dados do cliente e escolha a ação desejada para prosseguir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm p-4 border rounded-md bg-muted/30">
              <div className="flex items-start gap-2">
                <UserPlus className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{selectedClient.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                  <p className="font-medium">{selectedClient.fantasyName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IdCardIcon className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Código</p>
                  <p className="font-medium">{selectedClient.code}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <IdCardIcon className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">CNPJ/CPF</p>
                  <p className="font-medium">{selectedClient.cnpjCpf}</p>
                </div>
              </div>
               <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-medium">{selectedClient.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedClient.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="font-medium">{`${selectedClient.address || 'N/A'}, ${selectedClient.city || 'N/A'} - ${selectedClient.state || 'N/A'}, CEP: ${selectedClient.zipCode || 'N/A'}`}</p>
                </div>
              </div>
               <div className="flex items-start gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Vendedor Interno</p>
                  <p className="font-medium">{selectedClient.internalSalesperson?.name || 'N/A'} ({selectedClient.internalSalesperson?.code || 'N/A'})</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Vendedor Externo</p>
                  <p className="font-medium">{selectedClient.externalSalesperson?.name || 'N/A'} ({selectedClient.externalSalesperson?.code || 'N/A'})</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Data Cadastro</p>
                  <p className="font-medium">{selectedClient.registrationDate ? format(new Date(selectedClient.registrationDate), 'dd/MM/yyyy', {locale: ptBR}) : 'N/A'}</p>
                </div>
              </div>
               <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Meses Ativo</p>
                  <p className="font-medium">{selectedClient.activeMonths ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquareWarning className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Qtd. Manifestações</p>
                  <p className="font-medium">{selectedClient.manifestationCount ?? 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button onClick={() => handleAction('pre-open')} variant="outline" className="w-full sm:w-auto">
              <Send className="mr-2 h-4 w-4" /> Enviar Pré-Abertura (SAC Ativo)
            </Button>
            <Button onClick={() => handleAction('full-open')} className="w-full sm:w-auto">
              <FileEdit className="mr-2 h-4 w-4" /> Iniciar Manifestação Completa
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

