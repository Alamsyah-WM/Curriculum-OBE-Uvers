"use client";

import React from "react";
import { Column } from "@ant-design/charts";
import type { CplAchievement } from "@/service/cpl";

type CplBarChartProps = {
  data: CplAchievement[];
  onSelectCpl?: (cpl: CplAchievement) => void;
};

export default function CplBarChart({ data, onSelectCpl }: CplBarChartProps) {
  const chartData = data.map((item) => {
    const realScore = item.finalScore; // 0–100 dari backend

    const displayScore = realScore === 0 ? 0.0001 : realScore;

    let bandColor = "#12436D";
    let bandLabel = "High";

    if (realScore <= 33) {
      bandColor = "#6BACE6";
      bandLabel = "Low";
    } else if (realScore <= 66) {
      bandColor = "#2073BC";
      bandLabel = "Mid";
    }

    return {
      kode_cpl: item.kode_cpl,
      header: item.formattedHeaderScore,
      score: displayScore,
      realScore,
      bandColor,
      bandLabel,
      raw: item,
    };
  });

  chartData.sort((a, b) => a.kode_cpl.localeCompare(b.kode_cpl, undefined, { numeric: true }));

  console.log("CPL BAR CHART DATA:", chartData);

  const config = {
    data: chartData,
    xField: "kode_cpl",
    yField: "score",
    legend: false,
    scale: {
      score: {
        domain: [0, 100],
        nice: false,
        tickInterval: 20,
      },
    },
    label: {
      text: (d: any) => `${d.realScore.toFixed(2)}%`,
      position: "inside",
      style: {
        fill: "#ffffff",
        fontWeight: "bold",
      },
    },
    tooltip: {
      title: (d: any) => d.kode_cpl,
      items: [
        {
          channel: "y",
          field: "realScore",
          valueFormatter: (v: number) => `${v.toFixed(2)}%`,
        },
        {
          channel: "x",
          field: "header",
          valueFormatter: (v: string) => (v ? `Target: ${v}` : ""),
        },
        {
          channel: "color",
          field: "bandLabel",
        },
      ],
    },
    style: {
      fill: ({ bandColor }: any) => bandColor,
    },
    axis: {
      x: {
        title: "CPL",
        label: {
          autoRotate: false,
          rotate: 0,
          autoHide: true,
          autoEllipsis: true,
        },
      },
      y: {
        title: "Score (%)",
        labelFormatter: (v: number) => `${v}%`,
      },
    },
    padding: "auto" as const,
    interactions: [{ type: "element-active" }],
  };

  return (
    <div style={{ width: "100%", padding: "8px 0" }}>
      <Column
        {...config}
        onReady={({ chart }) => {
          chart.on("element:click", (e: any) => {
            const datum = e.data?.data;
            console.log("ELEMENT CLICK:", datum);

            if (datum?.raw && onSelectCpl) {
              onSelectCpl(datum.raw as CplAchievement);
            }
          });

          chart.on("interval:click", (e: any) => {
            const datum = e.data?.data;
            console.log("INTERVAL CLICK:", datum);

            if (datum?.raw && onSelectCpl) {
              onSelectCpl(datum.raw as CplAchievement);
            }
          });
        }}
      />
    </div>
  );
}