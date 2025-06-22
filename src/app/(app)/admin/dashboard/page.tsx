
import { ManifestationsByStatusChart } from '@/components/admin/charts/manifestations-by-status-chart';
import { ComplaintsByBranchChart } from '@/components/admin/charts/complaints-by-branch-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, AlertCircle, Smile, Clock, Gift, ShieldAlert as ShieldAlertIcon, FileText, Activity } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

// Placeholder for other charts
const CommonErrorsChart = () => <Card><CardHeader><CardTitle>Erros Mais Comuns</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md"><p className="text-muted-foreground">Chart Placeholder</p></CardContent></Card>;
const RecommendedActionsChart = () => <Card><CardHeader><CardTitle>Ações Mais Recomendadas</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md"><p className="text-muted-foreground">Chart Placeholder</p></CardContent></Card>;
const CreditsByStatusChart = () => <Card><CardHeader><CardTitle>Créditos por Status Financeiro</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md"><p className="text-muted-foreground">Chart Placeholder</p></CardContent></Card>;
const AuditNonComplianceChart = () => <Card><CardHeader><CardTitle>Distribuição de Não Conformidades (Auditoria)</CardTitle></CardHeader><CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md"><p className="text-muted-foreground">Chart Placeholder</p></CardContent></Card>;


export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Gerencial</h1>
          <p className="text-muted-foreground">Visão geral do desempenho do atendimento ao cliente.</p>
        </div>
        <div className="flex items-center gap-2">
            <Select defaultValue="last30days">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="thismonth">Este Mês</SelectItem>
                    <SelectItem value="lastmonth">Mês Passado</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" /> Exportar Relatórios
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Manifestações</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+5.2% desde o mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Médio de Resolução</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 dias</div>
            <p className="text-xs text-muted-foreground">-0.5 dias desde o mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-muted-foreground">+1.8% desde o mês passado</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos com Devoluções</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 5,780.50</div>
            <p className="text-xs text-muted-foreground">-10% desde o mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Concedidos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">+12 este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Conformidades (Audit.)</CardTitle>
            <ShieldAlertIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 <span className="text-base text-destructive">(2 Graves)</span></div>
            <p className="text-xs text-muted-foreground">-1 desde o mês passado</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ManifestationsByStatusChart />
        <ComplaintsByBranchChart />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <CommonErrorsChart />
        <RecommendedActionsChart />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <CreditsByStatusChart />
        <AuditNonComplianceChart />
      </div>
    </div>
  );
}
