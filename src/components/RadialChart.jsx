"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

export default function RadialChart({ value = 75 }) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const data = [
    {
      name: "Safety Score",
      value: clampedValue,
      fill: "#3B82F6", // Tailwind blue-500
    },
  ];

  return (
    <div className="relative w-[200px] h-[200px]">
      <RadialBarChart
        width={200}
        height={200}
        innerRadius="80%"
        outerRadius="100%"
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background
          clockWise
          dataKey="value"
          cornerRadius={10}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{clampedValue}%</span>
      </div>
    </div>
  );
}
