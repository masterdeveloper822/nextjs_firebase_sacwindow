"use client";

import { ManifestationList } from '@/components/manifestations/manifestation-list';
import { ManifestationFilters } from '@/components/manifestations/manifestation-filters';
import { Button } from '@/components/ui/button';
import { fetchManifestations } from '@/lib/firebase';
import { Manifestation } from '@/lib/types';
import Link from 'next/link';
import { PlusCircle, FileDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      const data = await fetchManifestations();
      setManifestations(data);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return <p> Carregando manifestações… </p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manifestações dos Clientes</h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as manifestações abertas.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Link href="/manifestations/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Manifestação
            </Button>
          </Link>
        </div>
      </div>
      
      <ManifestationFilters />
      <ManifestationList manifestations={manifestations} />
    </div>
  );
}
