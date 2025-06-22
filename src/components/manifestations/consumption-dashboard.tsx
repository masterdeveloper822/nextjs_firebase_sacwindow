
"use client"

import type { Client } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartHorizontalBig } from "lucide-react";
import EChartsGauge from '@/components/echarts/EChartsGauge'; 
import { cn } from "@/lib/utils";

interface ConsumptionDashboardProps {
  client: Client;
}

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') return 'N/A';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function ConsumptionDashboard({ client }: ConsumptionDashboardProps) {
  const consumption = client.consumptionData;

  if (!consumption) {
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChartHorizontalBig className="h-6 w-6 text-primary" /> Dados para Análise Perfil de Cliente
                </CardTitle>
                <CardDescription>Visão geral do consumo trimestral do cliente.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-4">Dados de consumo não disponíveis para este cliente.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChartHorizontalBig className="h-6 w-6 text-primary" /> Dados para Análise Perfil de Cliente
        </CardTitle>
        <CardDescription>Visão geral do consumo trimestral do cliente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground uppercase">TRIMESTRE ANTERIOR ({consumption.previousQuarterDates || 'N/A'})</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(consumption.previousQuarterBilling)}</p>
          </Card>
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground uppercase">TRIMESTRE ATUAL ({consumption.currentQuarterDates || 'N/A'})</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(consumption.currentQuarterBilling)}</p>
          </Card>
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-2 text-center text-foreground/80">Linha Window Blue</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="flex flex-col items-center justify-center p-2 min-h-[320px]">
              <p className="text-sm text-center text-muted-foreground mb-1 h-10">Window Blue - Trim. Anterior</p>
              <EChartsGauge 
                value={consumption.windowBlue.previousTrimester.meters}
                max={consumption.windowBlue.previousTrimester.total} // Conceptual max for context
                className="w-full h-full"
              />
            </Card>
             <Card className="flex flex-col items-center justify-center p-2 min-h-[320px]">
              <p className="text-sm text-center text-muted-foreground mb-1 h-10">Window Blue - Trim. Atual</p>
              <EChartsGauge 
                value={consumption.windowBlue.currentTrimester.meters}
                max={consumption.windowBlue.currentTrimester.total} // Conceptual max for context
                className="w-full h-full"
              />
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-2 text-center text-foreground/80">Linha PPF</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="flex flex-col items-center justify-center p-2 min-h-[320px]">
                <p className="text-sm text-center text-muted-foreground mb-1 h-10">PPF - Trim. Anterior</p>
                <EChartsGauge 
                    value={consumption.ppf.previousTrimester.meters}
                    max={consumption.ppf.previousTrimester.total} // Conceptual max for context
                    className="w-full h-full"
                />
             </Card>
             <Card className="flex flex-col items-center justify-center p-2 min-h-[320px]">
                <p className="text-sm text-center text-muted-foreground mb-1 h-10">PPF - Trim. Atual</p>
                <EChartsGauge 
                    value={consumption.ppf.currentTrimester.meters}
                    max={consumption.ppf.currentTrimester.total} // Conceptual max for context
                    className="w-full h-full"
                />
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
