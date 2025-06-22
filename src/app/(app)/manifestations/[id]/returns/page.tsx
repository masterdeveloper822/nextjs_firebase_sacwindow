
"use client";

import { ProductReturnForm } from '@/components/returns/product-return-form';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';


export default function ProductReturnsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const manifestationId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (manifestationId) {
        setIsLoadingPage(false); // REMOVED DELAY
    } else {
        setIsLoadingPage(false); // Or redirect if no ID
    }
  }, [manifestationId]);


  const handleSubmitReturns = async (data: any) => {
    console.log('Submitting product returns for manifestation:', manifestationId, data);
    // Simulate API call
    // await new Promise(resolve => setTimeout(resolve, 1000)); // REMOVED DELAY
    toast({
      title: "Devolução Registrada",
      description: `Os produtos para devolução da manifestação ${manifestationId} foram registrados.`,
    });
    router.push(`/manifestations/${manifestationId}`); // Navigate back to manifestation details
  };
  
  if (isLoadingPage) {
     return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" /> {/* Back button */}
        <Skeleton className="h-12 w-2/3" /> {/* Title */}
        <Skeleton className="h-8 w-1/2" /> {/* Subtitle */}
        <Skeleton className="h-96 w-full" /> {/* Form Card */}
      </div>
    );
  }

  if (!manifestationId) {
    return <p className="text-center text-destructive py-8">ID da Manifestação não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/manifestations/${manifestationId}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Manifestação
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produtos para Devolução</h1>
        <p className="text-muted-foreground">
          Gerencie os produtos a serem devolvidos para a manifestação nº {manifestationId}.
        </p>
      </div>
      <ProductReturnForm manifestationId={manifestationId} onSubmit={handleSubmitReturns} />
    </div>
  );
}
