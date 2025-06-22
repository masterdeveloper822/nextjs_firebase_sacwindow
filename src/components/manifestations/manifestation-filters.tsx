
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, FileDown, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import React, { useState } from 'react';

export function ManifestationFilters() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filtros de Manifestações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Input placeholder="Cliente (Nome ou Código)" />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="analyzing">Em Análise</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Filial" />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complaint">Reclamação</SelectItem>
              <SelectItem value="suggestion">Sugestão</SelectItem>
              <SelectItem value="query">Dúvida</SelectItem>
              <SelectItem value="praise">Elogio</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'dd/MM/yyyy') : <span>Data de Abertura</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
        <Button>
          <Filter className="mr-2 h-4 w-4" />
          Aplicar Filtros
        </Button>
      </CardFooter>
    </Card>
  );
}

// Need to import Card components if not already available globally in this component
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
