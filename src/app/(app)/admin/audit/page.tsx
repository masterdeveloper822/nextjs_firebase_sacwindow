"use client";

import { ManifestationList } from '@/components/manifestations/manifestation-list';
import { fetchManifestations } from '@/lib/firebase';
import { type Manifestation } from '@/lib/types';
import { ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AuditPage() {
  const [pendingAuditManifestations, setPendingAuditManifestations] = useState<Manifestation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const allManifestations = await fetchManifestations();
      const filtered = allManifestations.filter(m => 
          !m.auditOpinion || m.auditOpinion.trim() === '' || 
          !m.auditComplianceLevel || m.auditComplianceLevel.trim() === ''
      );
      setPendingAuditManifestations(filtered);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <ShieldCheck className="mr-2 h-8 w-8 text-primary" />
          Auditoria - Manifestações para Análise
        </h1>
        <p className="text-muted-foreground">
          Manifestações que requerem parecer ou definição do nível de conformidade pela auditoria.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
           <p className="ml-2">Carregando manifestações...</p>
        </div>
      ) : pendingAuditManifestations.length > 0 ? (
        <ManifestationList manifestations={pendingAuditManifestations} />
      ) : (
        <p className="text-center text-muted-foreground py-8">Nenhuma manifestação pendente para auditoria no momento.</p>
      )}
    </div>
  );
}

    
