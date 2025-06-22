"use client";

import { ManifestationList } from '@/components/manifestations/manifestation-list';
import { CollectionTrackingTable } from '@/components/admin/logistics/collection-tracking-table';
import { type Manifestation } from '@/lib/types';
import { Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchManifestations } from '@/lib/firebase';

export default function LogisticsPage() {
  const [logisticsManifestations, setLogisticsManifestations] = useState<Manifestation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const allManifestations = await fetchManifestations();
      const relevantCollectionTypes = ['Coleta Reversa Agendada', 'Postagem em Agência Correios'];
      const filtered = allManifestations.filter(m => 
        m.collectionType && relevantCollectionTypes.includes(m.collectionType)
      );
      setLogisticsManifestations(filtered);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Truck className="mr-2 h-8 w-8 text-primary" />
          Logística - Acompanhamento de Coletas e Entregas
        </h1>
        <p className="text-muted-foreground">
          Manifestações que envolvem coleta reversa ou outras operações logísticas.
        </p>
      </div>

      {isLoading ? (
         <div className="flex justify-center items-center py-10">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
           <p className="ml-2">Carregando manifestações...</p>
        </div>
      ) : (
        <>
          {logisticsManifestations.length > 0 ? (
            <ManifestationList manifestations={logisticsManifestations} />
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma manifestação com coleta logística ativa no momento.</p>
          )}

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Status Detalhado das Coletas (Logística)</CardTitle>
              <CardDescription>Acompanhamento dos pedidos de coleta e devoluções.</CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionTrackingTable manifestations={logisticsManifestations} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

    
