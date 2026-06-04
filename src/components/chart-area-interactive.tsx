"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  tracker_count: number;
}

const chartConfig = {
  tracker_count: {
    label: "Trackers",
    color: "var(--primary)",
  },
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function buildChartData(
  data: DailyPoint[],
  timeRange: "7d" | "30d" | "90d" | string
) {
  const today = new Date();
  const days =
    {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    }[timeRange] || 90;

  // Lookup table { "YYYY-MM-DD": tracker_count }
  const lookup: Record<string, number> = {};
  for (const row of data) {
    lookup[row.date] = row.tracker_count;
  }

  // Build continuous daily timeline
  const result: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDate(d);
    result.push({
      date: key,
      tracker_count: lookup[key] ?? 0,
    });
  }

  return result;
}

export function ChartAreaInteractive({ data }: { data: DailyPoint[] }) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d");
  }, [isMobile]);

  const chartData = React.useMemo(
    () => buildChartData(data || [], timeRange),
    [data, timeRange]
  );

  return (
    <Card className="@container/card">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center justify-between w-full">
          {/* Left side: title + subtitle */}
          <div className="flex flex-col space-y-1">
            <CardTitle className="">
              Permission Activity
            </CardTitle>
            <CardDescription className="">
              <span className="hidden @[540px]/card:block">
                Number of trackers detected per day
              </span>
              <span className="@[540px]/card:hidden">Recent activity</span>
            </CardDescription>
          </div>

          {/* Right side: toggle buttons + select */}
          <CardAction className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              size="sm"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem
                value="90d"
                className=""
                variant="outline"
                size="sm"
              >
                Last 3 months
              </ToggleGroupItem>
              <ToggleGroupItem
                value="30d"
                className=""
                variant="outline"
                size="sm"
              >
                Last 30 days
              </ToggleGroupItem>
              <ToggleGroupItem
                value="7d"
                className=""
                variant="outline"
                size="sm"
              >
                Last 7 days
              </ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 @[767px]/card:hidden" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>


      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          id="trackers-chart"
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillTrackers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9929d6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#9929d6" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={(props: any) => (
                <ChartTooltipContent {...props} indicator="dot" />
              )}
            />
            <Area
              dataKey="tracker_count"
              type="natural"
              fill="url(#fillTrackers)"
              stroke="#572d91"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
