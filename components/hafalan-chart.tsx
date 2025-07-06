"use client";

import { Bar } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface SantriData {
  name: string;
  hafalan: number;
  target: number;
  colorCategory: string;
}

interface HafalanChartProps {
  kelas: string;
  santriList: SantriData[];
  targetJuz: number;
}

export function HafalanChart({
  kelas,
  santriList,
  targetJuz,
}: HafalanChartProps) {
  const chartData = santriList.slice(0, 25).map((santri) => ({
    name:
      santri.name.length > 10
        ? santri.name.substring(0, 10) + "..."
        : santri.name,
    fullName: santri.name,
    hafalan: santri.hafalan,
    target: targetJuz,
    fill: getBarColor(santri.colorCategory),
  }));

  const chartConfig = {
    hafalan: {
      label: "Hafalan",
      color: "#4caf50",
    },
    target: {
      label: "Target",
      color: "#ff9800",
    },
  };

  return (
    <div className="w-full bg-green-50 p-6 rounded-lg" data-chart-container>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          CAPAIAN HAFALAN AL-QUR'AN SANTRI
        </h2>
        <h3 className="text-xl text-gray-700 mb-1">HUBBUL KHOOIR</h3>
        <h3 className="text-2xl font-bold text-red-600">
          {kelas.toUpperCase()}
        </h3>
      </div>

      <ChartContainer config={chartConfig} className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={10}
              stroke="#333"
            />
            <YAxis
              label={{
                value: "HAFALAN JUZ",
                angle: -90,
                position: "insideLeft",
              }}
              domain={[0, 6]}
              stroke="#333"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value, name, props) => [
                `${value} Juz`,
                name === "hafalan" ? "Hafalan" : "Target",
              ]}
              labelFormatter={(label, payload) => {
                const data = payload?.[0]?.payload;
                return data?.fullName || label;
              }}
            />
            <ReferenceLine
              y={targetJuz}
              stroke="#ff9800"
              strokeWidth={3}
              strokeDasharray="0"
            />
            <Bar
              dataKey="hafalan"
              fill={(entry) => entry.fill}
              stroke="#333"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500"></div>
          <span className="font-semibold">Hafalan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-orange-500"></div>
          <span className="font-semibold">Target</span>
        </div>
      </div>
    </div>
  );
}

const getBarColor = (colorCategory: string): string => {
  switch (colorCategory) {
    case "red":
      return "#f44336";
    case "yellow":
      return "#ffeb3b";
    case "green":
      return "#4caf50";
    case "blue":
      return "#2196f3";
    case "pink":
      return "#e91e63";
    default:
      return "#9e9e9e";
  }
};
