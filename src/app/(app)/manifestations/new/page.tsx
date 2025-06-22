
"use client";

import type { Client, Manifestation } from '@/lib/types';
import { ClientSearchForm } from '@/components/manifestations/client-search-form';
import { PreOpeningForm, type PreOpeningData } from '@/components/manifestations/pre-opening-form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { mockManifestations, mockOrders } from '@/lib/types'; // Import mockManifestations

export default function NewManifestationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPreOpeningForm, setShowPreOpeningForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClientSelected = (client: Client, action: 'pre-open' | 'full-open') => {
    setSelectedClient(client);
    if (action === 'full-open') {
      const newManifestationId = `NEW-${Date.now()}`;
      toast({
        title: "Iniciando Manifestação Completa",
        description: `Nova manifestação para ${client.fantasyName || client.name} com status "Não analisada".`,
      });
      router.push(`/manifestations/${newManifestationId}?clientId=${client.id}&status=not_analyzed`);
    } else { // action === 'pre-open'
      setShowPreOpeningForm(true);
    }
  };

  const handleSubmitPreOpening = async (data: PreOpeningData) => {
    if (!selectedClient || !user) {
      toast({ title: "Erro", description: "Cliente ou usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const today = new Date();
    const newManifestationId = `NEW-PRE-${Date.now()}`;
    // Ensure manifestationNo is unique, perhaps by incorporating more from timestamp or a counter if available
    const newManifestationNo = `PRE-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newManifestationEntry: Manifestation = {
      id: newManifestationId,
      manifestationNo: newManifestationNo,
      clientId: selectedClient.id,
      clientName: selectedClient.fantasyName || selectedClient.name,
      branch: mockOrders.find(o => o.clientId === selectedClient.id)?.branchNo || 'N/A', // Basic branch info
      type: 'Reclamação', // Default type for pre-opening
      openingDate: today.toISOString(),
      status: 'not_analyzed', // Or a new 'pending_sac_review' status
      description: '', // Full description will be filled by SAC based on pre-opening summary
      attachments: [], 
      history: [{
        id: `hist-${Date.now()}`,
        timestamp: today.toISOString(),
        action: 'Pré-abertura registrada',
        userId: user.id,
        userName: user.displayName || user.email || 'Usuário',
        details: `Pré-abertura criada por ${user.displayName || user.email}. Resumo: ${data.summary}`,
      }],
      slaDueDate: new Date(new Date(today).setDate(today.getDate() + 3)).toISOString(), // Default SLA
      auditComplianceLevel: 'not_evaluated',
      // Populate pre-opening fields
      preOpeningSummary: data.summary,
      preOpeningUserId: user.id,
      preOpeningUserName: user.displayName || user.email || 'Usuário',
      preOpeningTimestamp: today.toISOString(),
    };

    // Simulate saving to mock data
    mockManifestations.push(newManifestationEntry);
    console.log("Pre-opening submitted, new manifestation:", newManifestationEntry);

    // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call - REMOVED DELAY

    toast({
      title: "Pré-abertura Enviada!",
      description: `A solicitação para ${selectedClient.fantasyName || selectedClient.name} foi enviada ao SAC. Nº: ${newManifestationNo}`,
    });
    setIsSubmitting(false);
    setShowPreOpeningForm(false);
    setSelectedClient(null);
    router.push('/dashboard');
  };

  const handleCancelPreOpening = () => {
    setShowPreOpeningForm(false);
    setSelectedClient(null); // Allow searching for a new client
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showPreOpeningForm ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Abrir Nova Manifestação</h1>
            <p className="text-muted-foreground">
              Busque e selecione um cliente para registrar uma nova manifestação.
            </p>
          </div>
          <ClientSearchForm onClientSelect={handleClientSelected} />
        </>
      ) : selectedClient ? (
        <PreOpeningForm
          client={selectedClient}
          onSubmit={handleSubmitPreOpening}
          onCancel={handleCancelPreOpening}
          isLoading={isSubmitting}
        />
      ) : null}
    </div>
  );
}
