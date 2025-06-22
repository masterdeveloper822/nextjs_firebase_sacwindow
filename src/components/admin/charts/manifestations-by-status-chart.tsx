
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const data = [
  { status: "Pendente", count: 12, fill: "hsl(var(--chart-1))" },
  { status: "Em Análise", count: 19, fill: "hsl(var(--chart-2))"  },
  { status: "Resolvido", count: 30, fill: "hsl(var(--chart-3))"  },
  { status: "Atrasado", count: 5, fill: "hsl(var(--chart-4))"  },
]

const chartConfig = {
  count: {
    label: "Quantidade",
  },
  Pendente: { label: "Pendente", color: "hsl(var(--chart-1))" },
  "Em Análise": { label: "Em Análise", color: "hsl(var(--chart-2))" },
  Resolvido: { label: "Resolvido", color: "hsl(var(--chart-3))" },
  Atrasado: { label: "Atrasado", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;


export function ManifestationsByStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manifestações por Status</CardTitle>
        <CardDescription>Distribuição atual das manifestações.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
              <Legend />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

