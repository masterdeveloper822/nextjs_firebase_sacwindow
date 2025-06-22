
"use client";

import type { DatabaseConnectionParams, DatabaseType, OracleSpecificParams, PostgresMySqlSpecificParams } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import standard Label
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel, // This is RHF-context aware Label
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Info, Save, Zap, AlertTriangle, Database, Table2, Brain, MessageSquarePlus, Bot, SearchCode, ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert"; // Renamed to avoid conflict
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription as DialogUIDescription, DialogFooter, DialogHeader, DialogTitle as DialogUITitle, DialogTrigger } from "@/components/ui/dialog"; // Renamed to avoid conflict
import { Textarea } from "@/components/ui/textarea";
import { analyzeDatabaseSchema, type AnalyzeDatabaseSchemaInput } from '@/ai/flows/analyze-database-schema-flow';
import { Skeleton } from "@/components/ui/skeleton";

const baseSchema = z.object({
  host: z.string().min(1, "Host é obrigatório."),
  port: z.coerce.number().min(1, "Porta é obrigatória.").max(65535, "Porta inválida."),
  username: z.string().min(1, "Usuário é obrigatório."),
  password: z.string().min(1, "Senha é obrigatória."),
});

const oracleFullSchema = baseSchema.extend({
  dbType: z.literal("oracle"),
  connectionType: z.enum(["sid", "serviceName"], {
    required_error: "Tipo de conexão Oracle é obrigatório.",
  }),
  identifier: z.string().min(1, "SID ou Nome do Serviço é obrigatório."),
  databaseName: z.string().optional(), 
});

const postgresFullSchema = baseSchema.extend({
  dbType: z.literal("postgres"),
  databaseName: z.string().min(1, "Nome do banco de dados é obrigatório."),
  connectionType: z.string().optional(),
  identifier: z.string().optional(),
});

const mysqlFullSchema = baseSchema.extend({
  dbType: z.literal("mysql"),
  databaseName: z.string().min(1, "Nome do banco de dados é obrigatório."),
  connectionType: z.string().optional(),
  identifier: z.string().optional(),
});

const databaseConnectionSchema = z.discriminatedUnion("dbType", [
  oracleFullSchema,
  postgresFullSchema,
  mysqlFullSchema,
]);

type DatabaseConnectionFormValues = z.infer<typeof databaseConnectionSchema>;

const mockAllTables = Array.from({ length: 25 }, (_, i) => `TBL_MOCK_DATA_${String(i + 1).padStart(3, '0')}`);

const SchemaInfoPopover = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" type="button" className="h-5 w-5 ml-1">
        <Info className="h-4 w-4 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-96 text-sm">
      <h4 className="font-medium mb-2">Esquema de Banco de Dados Esperado</h4>
      <p className="mb-1 text-xs text-muted-foreground">
        A aplicação espera encontrar tabelas com uma estrutura similar à seguinte no seu banco de dados (Oracle, PostgreSQL, ou MySQL) para operar corretamente após a integração:
      </p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li><strong>TBL_MANIFESTATIONS:</strong> (ID, CLIENT_ID, TYPE, OPENING_DATE, STATUS, DESCRIPTION, REASON_CODE, RECOMMENDED_ACTION_CODE, COLLECTION_TYPE_CODE, SLA_DUE_DATE, etc.)</li>
        <li><strong>TBL_CLIENTS:</strong> (ID, NAME, CLIENT_CODE, CNPJ_CPF, EMAIL, PHONE, etc.)</li>
        <li><strong>TBL_ORDERS:</strong> (ID, CLIENT_ID, BRANCH_NO, ORDER_NO, ORDER_DATE, TOTAL_VALUE, etc.)</li>
        <li><strong>TBL_ORDER_ITEMS:</strong> (ID, ORDER_ID, PRODUCT_ID, PRODUCT_DESCRIPTION, QUANTITY, UNIT_PRICE, LOT, etc.)</li>
        <li><strong>TBL_PARAMETERS:</strong> (ID, PARAM_NAME, PARAM_TYPE, IS_ACTIVE) - Para popular listas, a menos que totalmente substituído por Mapeamento de Campos.</li>
        <li><strong>TBL_USERS:</strong> (ID, USERNAME, ROLE, etc.) - Para autenticação e controle de acesso.</li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Os nomes exatos das tabelas e colunas podem ser diferentes e ajustados através do "Mapeamento de Campos Dinâmicos" (para listas) ou diretamente no código da aplicação para as entidades principais.
        Certifique-se de que as permissões adequadas (SELECT, INSERT, UPDATE, DELETE) estão concedidas ao usuário da conexão.
      </p>
    </PopoverContent>
  </Popover>
);


export function DatabaseConnectionForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [listedTables, setListedTables] = useState<string[]>([]);
  const [visibleTableCount, setVisibleTableCount] = useState(10);
  const [allTablesLoaded, setAllTablesLoaded] = useState(false);
  const [databaseMapGenerated, setDatabaseMapGenerated] = useState(false);
  const [isMappingDatabase, setIsMappingDatabase] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini');
  const [isAnalyzingWithAi, setIsAnalyzingWithAi] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [isSendingCustomPrompt, setIsSendingCustomPrompt] = useState(false);


  const [currentParams, setCurrentParams] = useState<Partial<DatabaseConnectionFormValues>>({
    dbType: "oracle",
    host: "db.example.com",
    port: 1521,
    username: "app_user",
    connectionType: "serviceName", 
    identifier: "ORCLPDB1", 
  });

  const form = useForm<DatabaseConnectionFormValues>({
    resolver: zodResolver(databaseConnectionSchema),
    defaultValues: {
      dbType: currentParams.dbType || "oracle",
      host: currentParams.host || "",
      port: currentParams.port || (currentParams.dbType === 'postgres' ? 5432 : currentParams.dbType === 'mysql' ? 3306 : 1521),
      username: currentParams.username || "",
      password: "", 
      connectionType: currentParams.connectionType || "serviceName",
      identifier: currentParams.identifier || "",
      databaseName: currentParams.databaseName || "",
    },
  });

  const selectedDbType = form.watch("dbType") as DatabaseType; 

  useEffect(() => {
    const newPort = selectedDbType === 'postgres' ? 5432 : selectedDbType === 'mysql' ? 3306 : 1521;
    form.setValue('port', newPort);
    if (selectedDbType === 'oracle') {
        form.setValue('databaseName', undefined);
        form.setValue('connectionType', currentParams.connectionType || 'serviceName');
        form.setValue('identifier', currentParams.identifier || '');
    } else {
        form.setValue('connectionType', undefined);
        form.setValue('identifier', undefined);
        form.setValue('databaseName', currentParams.databaseName || '');
    }
    
    setIsConnected(false);
    setListedTables([]);
    setVisibleTableCount(10);
    setAllTablesLoaded(false);
    setDatabaseMapGenerated(false); 
    setAiAnalysisResult(null);
    setAiAnalysisError(null);
  }, [selectedDbType, form, currentParams]);


  const handleTestConnection = async (data: DatabaseConnectionFormValues) => {
    setIsTesting(true);
    
    const isSuccess = Math.random() > 0.3; 
    toast({
      title: isSuccess ? "Conexão Bem-Sucedida!" : "Falha na Conexão",
      description: isSuccess
        ? `A conexão com o banco de dados ${data.dbType.toUpperCase()} foi estabelecida.`
        : `Não foi possível conectar ao ${data.dbType.toUpperCase()}. Verifique os parâmetros e a rede.`,
      variant: isSuccess ? "default" : "destructive",
    });
    if (isSuccess) {
        setIsConnected(true);
        setListedTables(mockAllTables);
        setVisibleTableCount(10);
        setAllTablesLoaded(mockAllTables.length <= 10);
        setDatabaseMapGenerated(false); 
        setAiAnalysisResult(null);
        setAiAnalysisError(null);
    } else {
        setIsConnected(false);
        setListedTables([]);
    }
    setIsTesting(false);
  };
  
  const handleSaveChanges = async (data: DatabaseConnectionFormValues) => {
    setIsLoading(true);
    console.log("Saving database connection params:", data);
    
    setCurrentParams(data); 
    toast({
      title: "Configurações Salvas!",
      description: `Os parâmetros de conexão com ${data.dbType.toUpperCase()} foram salvos.`,
    });
    if (!isConnected) {
        handleTestConnection(data);
    }
    setIsLoading(false);
  };

  const handleLoadMoreTables = () => {
    const newCount = Math.min(visibleTableCount + 10, listedTables.length);
    setVisibleTableCount(newCount);
    if (newCount === listedTables.length) {
      setAllTablesLoaded(true);
    }
  };

  const handleMapDatabase = async () => {
    setIsMappingDatabase(true);
    
    setDatabaseMapGenerated(true);
    toast({
        title: "Mapeamento do Banco Concluído",
        description: "O mapa do banco de dados foi gerado/analisado."
    });
    setIsMappingDatabase(false);
  };

  const handleAnalyzeWithAi = async () => {
    setIsAnalyzingWithAi(true);
    setAiAnalysisResult(null);
    setAiAnalysisError(null);

    const input: AnalyzeDatabaseSchemaInput = {
      dbType: selectedDbType,
      tableNames: listedTables, 
      databaseMap: "Simulated database map: ClientTable relates to OrdersTable via ClientID. OrdersTable relates to OrderItemsTable via OrderID."
    };

    try {
      const result = await analyzeDatabaseSchema(input);
      setAiAnalysisResult(result.analysisText);
      toast({
        title: "Análise com IA Concluída",
        description: `A IA (${selectedAiModel === 'gemini' ? 'Gemini' : 'ChatGPT'}) analisou o mapa do banco. Veja o resultado abaixo.`
      });
    } catch (error) {
      console.error("AI Analysis Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido durante a análise.";
      setAiAnalysisError(`Falha na análise com IA: ${errorMessage}`);
      toast({
        title: "Erro na Análise com IA",
        description: `Não foi possível obter a análise da IA. Detalhes: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingWithAi(false);
    }
  };
  
  const handleSendCustomPrompt = async () => {
    if (!customAiPrompt.trim()) {
      toast({ title: "Erro", description: "O prompt não pode estar vazio.", variant: "destructive" });
      return;
    }
    setIsSendingCustomPrompt(true);
    
    toast({
        title: "Resposta da IA para Prompt Customizado",
        description: `Prompt: "${customAiPrompt.substring(0, 50)}..." processado por ${selectedAiModel === 'gemini' ? 'Gemini' : 'ChatGPT'}.`
    });
    setIsSendingCustomPrompt(false);
    setIsCustomPromptOpen(false);
    setCustomAiPrompt("");
  };

  return (
    <>
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Parâmetros de Conexão</CardTitle>
        <CardDescription className="flex items-center">
          Configure os detalhes para conectar ao seu banco de dados.
          <SchemaInfoPopover />
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveChanges)}>
          <CardContent className="space-y-6">
            <Alert variant="default" className="bg-primary/10 border-primary/30">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Atenção!</AlertTitle>
              <UIAlertDescription>
                Modificar estas configurações pode impactar o funcionamento da aplicação.
                A aplicação tentará usar esta conexão para todas as operações de dados após salva e ativada.
              </UIAlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="dbType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Banco de Dados</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="oracle">Oracle</SelectItem>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">Host
                       <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="h-5 w-5 ml-1"><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="w-60 text-xs"><p>Hostname ou endereço IP do servidor de banco de dados.</p></PopoverContent></Popover>
                    </FormLabel>
                    <FormControl><Input placeholder="ex: db.empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">Porta
                      <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="h-5 w-5 ml-1"><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="w-72 text-xs"><p>Porta de conexão do banco. Padrões: Oracle (1521), PostgreSQL (5432), MySQL (3306).</p></PopoverContent></Popover>
                    </FormLabel>
                    <FormControl><Input type="number" placeholder={selectedDbType === 'postgres' ? "5432" : selectedDbType === 'mysql' ? "3306" : "1521"} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedDbType === 'oracle' && (
              <>
                <FormField
                  control={form.control}
                  name="connectionType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center">Tipo de Identificador Oracle
                        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" type="button" className="h-5 w-5 ml-1"><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="w-72 text-xs"><p>Escolha se irá conectar usando um SID (System ID) ou um Nome de Serviço (Service Name).</p></PopoverContent></Popover>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value || "serviceName"}
                          className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="serviceName" /></FormControl>
                            <FormLabel className="font-normal">Nome do Serviço</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="sid" /></FormControl>
                            <FormLabel className="font-normal">SID</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador Oracle (SID / Nome do Serviço)</FormLabel>
                      <FormControl><Input placeholder="ex: ORCL ou orcl.empresa.com" {...field} value={field.value || ''} /></FormControl>
                      <FormDescription>Insira o SID ou Nome do Serviço, conforme selecionado acima.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {(selectedDbType === 'postgres' || selectedDbType === 'mysql') && (
              <FormField
                control={form.control}
                name="databaseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Banco de Dados</FormLabel>
                    <FormControl><Input placeholder="ex: clientcare_db" {...field} value={field.value || ''} /></FormControl>
                    <FormDescription>Nome do banco de dados para {selectedDbType === 'postgres' ? 'PostgreSQL' : 'MySQL'}.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl><Input placeholder="ex: app_clientcare" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="********" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => form.handleSubmit(handleTestConnection)()} disabled={isTesting || isLoading}>
              {isTesting ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : <Zap className="mr-2 h-4 w-4" />}
              Testar Conexão
            </Button>
            <Button type="submit" disabled={isLoading || isTesting}>
              {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : <Save className="mr-2 h-4 w-4" />}
              Salvar Configurações
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>

    {isConnected && (
        <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Table2 className="h-5 w-5 text-primary"/>Tabelas do Banco de Dados</CardTitle>
                <CardDescription>Listagem de tabelas encontradas após a conexão.</CardDescription>
            </CardHeader>
            <CardContent>
                {listedTables.length > 0 ? (
                    <ul className="space-y-1 max-h-60 overflow-y-auto border rounded-md p-3 bg-muted/50">
                        {listedTables.slice(0, visibleTableCount).map(table => (
                            <li key={table} className="text-sm p-1 rounded hover:bg-muted">{table}</li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">Nenhuma tabela encontrada.</p>}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t pt-6">
                {!allTablesLoaded && listedTables.length > visibleTableCount ? (
                    <Button variant="outline" onClick={handleLoadMoreTables}>
                        <ChevronDown className="mr-2 h-4 w-4"/> Carregar Mais Tabelas ({Math.min(10, listedTables.length - visibleTableCount)} de {listedTables.length - visibleTableCount} restantes)
                    </Button>
                ) : <div />} 
                <Button onClick={handleMapDatabase} disabled={isMappingDatabase || databaseMapGenerated || !allTablesLoaded}>
                    {isMappingDatabase && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                    <SearchCode className="mr-2 h-4 w-4"/>
                    {databaseMapGenerated ? "Mapa do Banco Gerado" : "Mapear Banco de Dados"}
                </Button>
            </CardFooter>
        </Card>
    )}

    {isConnected && (
        <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Brain className="h-5 w-5 text-primary"/>Assistente de Banco de Dados com IA</CardTitle>
                <CardDescription>Utilize IA para analisar e interagir com o esquema do seu banco de dados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-model-select-trigger">Selecionar Modelo de IA</Label>
                    <Select value={selectedAiModel} onValueChange={setSelectedAiModel}>
                        <SelectTrigger id="ai-model-select-trigger">
                            <SelectValue placeholder="Selecione o modelo de IA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini">Gemini (Google AI)</SelectItem>
                            <SelectItem value="chatgpt" disabled>ChatGPT (OpenAI) - Indisponível</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground">
                        A funcionalidade de IA está configurada para usar o Genkit com Gemini.
                    </p>
                </div>
                <Separator />
                 <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                        onClick={handleAnalyzeWithAi} 
                        disabled={!allTablesLoaded || !databaseMapGenerated || isAnalyzingWithAi}
                        className="flex-1"
                    >
                        {isAnalyzingWithAi && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                        <Bot className="mr-2 h-4 w-4" /> Analisar Mapa do Banco & Sugerir Layouts
                    </Button>
                    <Dialog open={isCustomPromptOpen} onOpenChange={setIsCustomPromptOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1" disabled={!isConnected}>
                                <MessageSquarePlus className="mr-2 h-4 w-4"/> Prompt Customizado para IA
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogUITitle>Prompt Customizado para IA</DialogUITitle>
                                <DialogUIDescription>
                                    Faça uma pergunta ou solicite uma análise sobre o esquema do banco de dados para o modelo de IA selecionado ({selectedAiModel === 'gemini' ? 'Gemini' : 'ChatGPT'}).
                                </DialogUIDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Label htmlFor="custom-ai-prompt">Seu Prompt:</Label>
                                <Textarea 
                                    id="custom-ai-prompt"
                                    value={customAiPrompt}
                                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                                    placeholder="Ex: Liste todas as tabelas relacionadas a clientes e seus campos chave."
                                    rows={5}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCustomPromptOpen(false)}>Cancelar</Button>
                                <Button type="button" onClick={handleSendCustomPrompt} disabled={isSendingCustomPrompt || !customAiPrompt.trim()}>
                                     {isSendingCustomPrompt && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                                    Enviar para IA
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                 </div>
                 {(!allTablesLoaded || !databaseMapGenerated) && isConnected && (
                    <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700">
                        <AlertTriangle className="h-4 w-4 text-amber-600"/>
                        <AlertTitle>Ação Requerida</AlertTitle>
                        <UIAlertDescription>
                            Para habilitar a análise com IA, por favor, carregue todas as tabelas e mapeie o banco de dados.
                        </UIAlertDescription>
                    </Alert>
                 )}

                 {/* Display AI Analysis Result */}
                {isAnalyzingWithAi && !aiAnalysisResult && !aiAnalysisError && (
                    <Card className="mt-4">
                        <CardHeader><CardTitle>Resultado da Análise da IA</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                             <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                Analisando com Gemini... Por favor, aguarde.
                            </p>
                        </CardContent>
                    </Card>
                )}
                {aiAnalysisError && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erro na Análise</AlertTitle>
                        <UIAlertDescription>{aiAnalysisError}</UIAlertDescription>
                    </Alert>
                )}
                {aiAnalysisResult && (
                    <Card className="mt-4 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Brain className="h-5 w-5 text-primary" />
                                Resultado da Análise da IA (Gemini)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={aiAnalysisResult}
                                readOnly
                                rows={15}
                                className="bg-muted/30 text-sm font-mono whitespace-pre-wrap"
                                placeholder="A análise da IA será exibida aqui..."
                            />
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    )}
    </>
  );
}

