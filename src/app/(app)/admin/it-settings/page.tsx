
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseConnectionForm } from "@/components/admin/it-settings/database-connection-form";
import { DynamicFieldMappingsManager } from "@/components/admin/it-settings/dynamic-field-mappings-manager";
import { ApplicationSchemaAnalyzer } from "@/components/admin/it-settings/application-schema-analyzer";
import { DatabaseZap, Link2, Database, FileJson2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ItSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-8 w-8 text-primary" />
          Configurações de TI
        </h1>
        <p className="text-muted-foreground">
          Gerencie a conexão com o banco de dados, o mapeamento de campos e analise o esquema da aplicação.
        </p>
      </div>

      <Tabs defaultValue="database-connection" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 md:w-auto">
          <TabsTrigger value="database-connection">
            <DatabaseZap className="mr-2 h-4 w-4" />
            Conexão BD
          </TabsTrigger>
          <TabsTrigger value="field-mappings">
            <Link2 className="mr-2 h-4 w-4" />
            Mapeamento de Campos
          </TabsTrigger>
          <TabsTrigger value="app-schema-analysis">
            <FileJson2 className="mr-2 h-4 w-4" />
            Análise Esquema App
          </TabsTrigger>
        </TabsList>
        <TabsContent value="database-connection" className="mt-6">
          <DatabaseConnectionForm />
        </TabsContent>
        <TabsContent value="field-mappings" className="mt-6">
          <DynamicFieldMappingsManager />
        </TabsContent>
        <TabsContent value="app-schema-analysis" className="mt-6">
          <ApplicationSchemaAnalyzer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
