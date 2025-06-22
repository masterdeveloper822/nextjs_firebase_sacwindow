"use client";

import type { Manifestation, ManifestationStatus } from '@/lib/types';
import { ManifestationForm } from '@/components/manifestations/manifestation-form';
import { mockManifestations, mockClients, mockOrders } from '@/lib/types'; // Using mock data
import { useToast } from '@/hooks/use-toast';
import { useParams, useSearchParams, useRouter } from 'next/navigation'; // useRouter is already imported
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { fetchManifestations } from '@/lib/firebase';

export default function ManifestationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const { toast } = useToast();
  const { user: authUser } = useAuth(); // Get the authenticated user
  const [manifestation, setManifestation] = useState<Manifestation | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
  const id = typeof params.id === 'string' ? params.id : undefined;
  const clientIdFromQuery = searchParams.get('clientId'); 
  const statusFromQuery = searchParams.get('status') as ManifestationStatus | null;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (id) {
        const data = await fetchManifestations();
        let foundManifestation = data.find(m => m.id === id || m.manifestationNo === id);
        // If it's a new manifestation ID (e.g., "NEW-timestamp") and we have a client ID from query
        // This path is for "full-open" direct manifestations
        if (!foundManifestation && id.startsWith('NEW-') && !id.startsWith('NEW-PRE-') && clientIdFromQuery) {
          const client = mockClients.find(c => c.id === clientIdFromQuery);
          if (client) {
            const today = new Date();
            const slaDueDate = new Date(today);
            slaDueDate.setDate(today.getDate() + 3);

            foundManifestation = {
              id: id, // Use the ID from the URL (NEW-...)
              manifestationNo: `MAN-${id.substring(id.length - 6, id.length)}`, 
              clientId: client.id,
              clientName: client.fantasyName || client.name,
              branch: mockOrders.find(o => o.clientId === client.id)?.branchNo || 'N/A',
              type: 'Reclamação', 
              openingDate: today.toISOString(),
              status: statusFromQuery || 'not_analyzed', 
              description: '',
              attachments: [],
              history: [{ 
                id: 'hist-new', 
                timestamp: today.toISOString(), 
                action: 'Manifestação iniciada (direta)', 
                userId: authUser?.id || 'system', 
                userName: authUser?.displayName || 'Usuário do Sistema', 
                details: `Status inicial: ${statusFromQuery || 'Não analisada'}. Aberta diretamente.` 
              }],
              slaDueDate: slaDueDate.toISOString(),
              auditComplianceLevel: 'not_evaluated',
              // Ensure preOpening fields are undefined for direct full openings
              preOpeningSummary: undefined,
              preOpeningUserId: undefined,
              preOpeningUserName: undefined,
              preOpeningTimestamp: undefined,
              collectionScheduledCarrier: '',
              collectionReturnInvoice: '',
              collectionScheduledDate: '',
              collectionScheduledPeriod: '',
              collectionScheduledNotes: '',
              collectionReceiptUrl: '',
            };
          }
        }
        // If it's a pre-opened manifestation being loaded for the first time by SAC
        // (ID starts with NEW-PRE-), the preOpening fields would already be set from mockData or actual data source
        // No special handling needed here for NEW-PRE- as foundManifestation would pick it up.

        setManifestation(foundManifestation);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, clientIdFromQuery, statusFromQuery, authUser]); // Add authUser to dependencies

  const handleSubmitManifestation = async (data: any, manifestationId?: string) => {
    console.log('Submitting manifestation:', manifestationId, data);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    let wasNewManifestation = false;
    let isPreOpenedBeingFinalized = false;

    if (manifestationId && manifestation) {
        const isNewDirect = manifestationId.startsWith('NEW-') && !manifestationId.startsWith('NEW-PRE-');
        isPreOpenedBeingFinalized = manifestationId.startsWith('NEW-PRE-');

        const updatedManifestation: Manifestation = {
            ...manifestation, 
            ...data, 
            id: (isNewDirect || isPreOpenedBeingFinalized) ? `man-${Date.now()}` : manifestationId, 
            status: manifestation.status === 'not_analyzed' ? 'pending' : manifestation.status, 
            history: [
                ...manifestation.history,
                {
                    id: `hist-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    action: (isNewDirect || isPreOpenedBeingFinalized) ? 'Manifestação registrada (SAC)' : 'Manifestação atualizada',
                    userId: authUser?.id || 'system_update', 
                    userName: authUser?.displayName || 'Usuário do Sistema', 
                    details: (isPreOpenedBeingFinalized ? 'Finalização da pré-abertura pelo SAC. ' : '') + (isNewDirect ? 'Registro direto pelo SAC. ' : '')
                }
            ]
        };
        
        // If it was a pre-opened one, ensure description from form is now the main description
        if(isPreOpenedBeingFinalized){
            updatedManifestation.description = data.description; // Ensure the SAC's description is saved
        }

        setManifestation(updatedManifestation); 
        
        const index = mockManifestations.findIndex(m => m.id === manifestationId);
        if (index !== -1) {
            mockManifestations[index] = updatedManifestation;
        } else if (isNewDirect || isPreOpenedBeingFinalized) {
            mockManifestations.push(updatedManifestation);
            wasNewManifestation = true;
        }
    }
    
    toast({
      title: `Manifestação ${wasNewManifestation ? 'Criada' : 'Atualizada'}`,
      description: `Os dados da manifestação ${manifestation?.manifestationNo || ''} foram salvos com sucesso.`,
    });

    setIsLoading(false);

    if (wasNewManifestation) {
      router.push('/dashboard'); 
    }
  };
  
  if (isLoading && !manifestation) { 
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Handle cases where a "NEW-PRE-" ID doesn't find a match (should be rare if mock data is consistent)
  if (id?.startsWith('NEW-PRE-') && !manifestation) {
      return <p className="text-center text-destructive py-8">Dados da pré-abertura não encontrados. Verifique o ID.</p>;
  }

  if (!manifestation && !id?.startsWith('NEW-')) { 
    return <p className="text-center text-destructive py-8">Manifestação não encontrada.</p>;
  }
  
  // For direct new manifestations, clientIdFromQuery is essential
  if (id?.startsWith('NEW-') && !id.startsWith('NEW-PRE-') && !clientIdFromQuery && !manifestation) {
     return <p className="text-center text-destructive py-8">Dados do cliente não encontrados para nova manifestação.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {manifestation?.id.startsWith('NEW-') ? 
            (manifestation.id.startsWith('NEW-PRE-') ? 'Finalizar Pré-Abertura Manifestação' : 'Nova Manifestação (Direta)') 
            : `Detalhes da Manifestação ${manifestation?.manifestationNo || ''}`}
        </h1>
        <p className="text-muted-foreground">
          {manifestation?.id.startsWith('NEW-') ? 
            (manifestation.id.startsWith('NEW-PRE-') ? 'Complete os detalhes da pré-abertura.' : 'Preencha os detalhes abaixo.') 
            : 'Visualize e edite os detalhes da manifestação.'}
        </p>
      </div>
      <ManifestationForm
        manifestation={manifestation} 
        clientId={clientIdFromQuery || undefined}
        initialStatus={statusFromQuery || undefined}
        onSubmit={handleSubmitManifestation}
      />
    </div>
  );
}
