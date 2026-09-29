// src/component/dashboard/home/CplDetail.tsx

import React from "react";
import { Collapse, Progress, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CollapseProps } from "antd";

type CpmkItem = {
  cpmk_id: string;
  kode_cpmk: string;
  bobot: number;
  nilai: number;
  bobotPercentage: number;
  formatted_bobot: string;
  formatted_nilai: string;
};

type MataKuliahItem = {
  mk_id: string;
  nama_mk: string;
  bobot: number;
  nilai: number;
  cpmks: CpmkItem[];
  bobotPercentage: number;
  formatted_bobot: string;
  formatted_nilai: string;
};

export type CplAchievement = {
  cpl_id: string;
  kode_cpl: string;
  deskripsi: string;
  finalScore: number;
  formattedScore: string;
  status: string;
  statusColor: string;
  barColor: string;
  totalEarnedScore: number;
  totalTargetScore: number;
  formattedHeaderScore: string;
  isEvaluated: boolean;
  evaluatorCount: number;
  mata_kuliahs: MataKuliahItem[];
};

type CplDetailProps = {
  cpl: CplAchievement;
};

const CplDetail: React.FC<CplDetailProps> = ({ cpl }) => {
  const hasMataKuliah =
    Array.isArray(cpl.mata_kuliahs) && cpl.mata_kuliahs.length > 0;

  if (!hasMataKuliah) {
    return (
      <div
        style={{
          marginTop: 16,
          maxWidth: "100%",
          overflowX: "hidden",
          wordBreak: "break-word",
        }}
      >
        Tidak ada data mata kuliah (Belum ada asesmen prodi)
      </div>
    );
  }

  const cpmkColumns: ColumnsType<CpmkItem> = [
    {
      title: "Kode CPMK",
      dataIndex: "kode_cpmk",
      key: "kode_cpmk",
    },
    {
      title: "Bobot",
      dataIndex: "bobot",
      key: "bobot",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: "Nilai",
      dataIndex: "nilai",
      key: "nilai",
      render: (v: number) => v.toFixed(2),
    },
  ];

  const items: CollapseProps["items"] = cpl.mata_kuliahs.map((mk) => {
    const percent = Math.max(Math.min(mk.nilai, 100), 0);
    const progressColor = percent < 50 ? "#EF4444" : "#59D4A2";

    return {
      key: mk.mk_id,
      label: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              maxWidth: "100%",
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "60%",
              }}
            >
              {mk.nama_mk}
            </span>
            <span
              style={{
                fontSize: 12,
                opacity: 0.7,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "40%",
                textAlign: "right",
              }}
            >
              Nilai: {mk.nilai.toFixed(2)} | Bobot: {mk.bobot.toFixed(2)}
            </span>
          </div>
          <Progress
            percent={Number(percent.toFixed(2))}
            status="active"
            strokeColor={progressColor}
          />
        </div>
      ),
      children: (
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table<CpmkItem>
            size="small"
            columns={cpmkColumns}
            dataSource={mk.cpmks}
            rowKey="cpmk_id"
            pagination={false}
          />
        </div>
      ),
    };
  });

  return (
    <div
      style={{
        marginTop: 16,
        maxWidth: "100%",
        overflowX: "hidden", // cegah detail melar
        wordBreak: "break-word",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          {cpl.kode_cpl} - {cpl.deskripsi}
        </div>
        <div
          style={{
            fontSize: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              backgroundColor: cpl.statusColor,
              color: "white",
            }}
          >
            {cpl.status}
          </span>
          <span>Skor: {cpl.formattedScore}</span>
          <span>Target: {cpl.formattedHeaderScore}</span>
          <span>Jumlah Mahasiswa: {cpl.evaluatorCount}</span>
        </div>
      </div>

      <Collapse items={items} />
    </div>
  );
};

export default CplDetail;