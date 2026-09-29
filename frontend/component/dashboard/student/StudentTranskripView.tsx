// component/dashboard/student/StudentTranskripView.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, Spin, Select } from "antd";
import CplBarChart from "@/component/dashboard/home/CplBarChart";
import CplDetail from "@/component/dashboard/home/CplDetail";
import {
  MahasiswaCplAchievement,
  fetchMahasiswaCplAchievement,
} from "@/service/studentcpl";

type Props = {
  mahasiswaId: string;
  prodiId: string;
};

// helper supaya deskripsi tidak kepanjangan di combobox
const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + "..." : text;

const StudentTranskripView: React.FC<Props> = ({ mahasiswaId, prodiId }) => {
  const [cplData, setCplData] = useState<MahasiswaCplAchievement[]>([]);
  const [selectedCpl, setSelectedCpl] =
    useState<MahasiswaCplAchievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mahasiswaId || !prodiId) return;

    setLoading(true);
    setError(null);
    setSelectedCpl(null);

    fetchMahasiswaCplAchievement(mahasiswaId, prodiId)
      .then((data) => {
        const sortedData = [...data].sort((a, b) =>
          a.kode_cpl.localeCompare(b.kode_cpl, undefined, { numeric: true })
        );
        setCplData(sortedData);
      })
      .catch((err) => {
        console.error("Error fetch CPL mahasiswa:", err);
        setCplData([]);
        setError("Gagal mengambil data CPL mahasiswa");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [mahasiswaId, prodiId]);

  const handleSelectCplFromDropdown = (cplId: string) => {
    const found = cplData.find((c) => c.cpl_id === cplId);
    if (found) {
      setSelectedCpl(found);
    }
  };

  return (
    <Card
      style={{ width: "100%" }}
      styles={{
        body: { padding: 16 },
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px 0",
          }}
        >
          <Spin size="large" />
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            color: "red",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : cplData.length === 0 ? (
        <div
          style={{
            padding: 24,
            opacity: 0.5,
            textAlign: "center",
          }}
        >
          Tidak ada data CPL untuk mahasiswa ini.
        </div>
      ) : (
        <>
          {/* Dropdown CPL seperti di DekanHome */}
          <div style={{ margin: "8px 0 16px 0" }}>
            <Select
              style={{ minWidth: 260, maxWidth: 480 }}
              placeholder="Pilih CPL untuk lihat detail"
              value={selectedCpl?.cpl_id}
              onChange={handleSelectCplFromDropdown}
              options={cplData.map((cpl) => ({
                label: `${cpl.kode_cpl} - ${truncate(
                  cpl.deskripsi,
                  60
                )}`,
                value: cpl.cpl_id,
              }))}
              allowClear
              onClear={() => setSelectedCpl(null)}
            />
          </div>

          <CplBarChart
            data={cplData}
            onSelectCpl={(cpl) => {
              setSelectedCpl(cpl);
            }}
          />

          {selectedCpl && <CplDetail cpl={selectedCpl} />}
        </>
      )}
    </Card>
  );
};

export default StudentTranskripView;