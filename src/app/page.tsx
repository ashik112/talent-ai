"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { BarChart, LineChart, PieChartIcon, Users, Briefcase, CheckCircle2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Line, Pie, PieChart as RechartsPieChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from "recharts";

const timeToFillData = [
  { month: "Jan", days: 30 }, { month: "Feb", days: 25 }, { month: "Mar", days: 28 },
  { month: "Apr", days: 35 }, { month: "May", days: 32 }, { month: "Jun", days: 22 },
];

const sourceROIData = [
  { source: "LinkedIn", hires: 15, roi: 2.5 }, { source: "BDJobs", hires: 25, roi: 3.1 },
  { source: "StackOverflow", hires: 10, roi: 1.8 }, { source: "Referrals", hires: 30, roi: 4.5 },
];

const dropOffData = [
  { name: "Applied", value: 200 }, { name: "Screened", value: 150 },
  { name: "Interviewed", value: 80 }, { name: "Offered", value: 30 },
  { name: "Hired", value: 25 },
];
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


const chartConfigTimeToFill = {
  days: { label: "Days", color: "hsl(var(--chart-1))" },
};

const chartConfigSourceROI = {
  hires: { label: "Hires", color: "hsl(var(--chart-1))" },
  roi: { label: "ROI (x)", color: "hsl(var(--chart-2))" },
};

const chartConfigDropOff = {
  value: { label: "Candidates" },
   Applied: { label: "Applied", color: "hsl(var(--chart-1))" },
  Screened: { label: "Screened", color: "hsl(var(--chart-2))" },
  Interviewed: { label: "Interviewed", color: "hsl(var(--chart-3))" },
  Offered: { label: "Offered", color: "hsl(var(--chart-4))" },
  Hired: { label: "Hired", color: "hsl(var(--chart-5))" },
};


export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Analytics Dashboard"
        description="Key pipeline metrics, time-to-fill, source ROI, and candidate drop-off rates."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        <StatsCard title="Active Job Openings" value="12" icon={Briefcase} description="+2 since last month" />
        <StatsCard title="Total Candidates" value="1,250" icon={Users} description="In pipeline across all roles" />
        <StatsCard title="Avg. Time to Fill" value="28 days" icon={BarChart} description="-5 days vs. last quarter" />
        <StatsCard title="Hires This Month" value="5" icon={CheckCircle2} description="On track for quarterly goal" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <ChartCard title="Time to Fill (Last 6 Months)" description="Average number of days to fill a position.">
          <ChartContainer config={chartConfigTimeToFill} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeToFillData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="days" stroke="var(--color-days)" strokeWidth={2} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Source ROI & Hires" description="Return on investment and number of hires by source.">
           <ChartContainer config={chartConfigSourceROI} className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceROIData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="source" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis yAxisId="left" orientation="left" stroke="var(--color-hires)" tickLine={false} axisLine={false} tickMargin={8}/>
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-roi)" tickLine={false} axisLine={false} tickMargin={8}/>
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsLegend content={<ChartLegendContent />} />
                <Bar yAxisId="left" dataKey="hires" fill="var(--color-hires)" radius={4} />
                <Bar yAxisId="right" dataKey="roi" fill="var(--color-roi)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Candidate Drop-off Funnel" description="Candidate progression through the hiring stages." className="lg:col-span-2 xl:col-span-1">
           <ChartContainer config={chartConfigDropOff} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                <Pie
                    data={dropOffData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                     label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180
                        const radius = 25 + innerRadius + (outerRadius - innerRadius)
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        return (
                          <text
                            x={x}
                            y={y}
                            className="fill-muted-foreground text-xs"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                          >
                            {dropOffData[index].name} ({value})
                          </text>
                        )
                      }}
                >
                   {dropOffData.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                 <RechartsLegend content={<ChartLegendContent nameKey="name"/>} />
            </RechartsPieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>
      </div>
    </>
  );
}
