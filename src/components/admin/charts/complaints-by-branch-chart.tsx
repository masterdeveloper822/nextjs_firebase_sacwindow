
"use client"

import { Pie, PieChart, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const data = [
  { branch: "Filial SP", complaints: 25, fill: "hsl(var(--chart-1))" },
  { branch: "Filial RJ", complaints: 15, fill: "hsl(var(--chart-2))" },
  { branch: "Filial MG", complaints: 10, fill: "hsl(var(--chart-3))" },
  { branch: "Filial Online", complaints: 35, fill: "hsl(var(--chart-4))" },
  { branch: "Outras", complaints: 5, fill: "hsl(var(--chart-5))" },
]

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const chartConfig = data.reduce((acc, item) => {
  acc[item.branch] = { label: item.branch, color: item.fill };
  return acc;
}, {
  complaints: { // A general key for the value itself, matching dataKey for Pie
    label: "Reclamações",
  }
} as ChartConfig);


export function ComplaintsByBranchChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reclamações por Filial</CardTitle>
        <CardDescription>Volume de reclamações em cada filial.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" nameKey="branch" />} />
              <Legend />
              <Pie
                data={data}
                dataKey="complaints"
                nameKey="branch"
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

