// app/(dashboard)/student/[mahasiswaId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import {
  fetchNilaiByMahasiswa,
  NilaiItem,
} from "@/service/penilaian";
import {
  fetchMahasiswa,
  Mahasiswa,
} from "@/service/student";
import StudentTabs from "@/component/dashboard/student/StudentTabs";

export default function StudentAssessmentPage() {
  const params = useParams<{ mahasiswaId: string }>();
  const searchParams = useSearchParams();

  const mahasiswaId = params.mahasiswaId;
  const namaMahasiswa = searchParams.get("nama") ?? "Mahasiswa";
  const queryProdiId = searchParams.get("prodiId") ?? "";

  const [data, setData] = useState<NilaiItem[] | null>(null);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole ?? "");
  }, []);

  useEffect(() => {
    if (!mahasiswaId) return;

    const stored = sessionStorage.getItem(
      `selectedMahasiswa:${mahasiswaId}`
    );

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Mahasiswa;
        setMahasiswa(parsed);
        return;
      } catch (error) {
        console.error("Gagal parse selectedMahasiswa:", error);
      }
    }

    fetchMahasiswa()
      .then((res) => {
        const found = res.find(
          (m) => m.mahasiswa_id === mahasiswaId
        );
        setMahasiswa(found ?? null);
      })
      .catch((err) => {
        console.error("Error fetch mahasiswa fallback:", err);
        setMahasiswa(null);
      });
  }, [mahasiswaId]);

  useEffect(() => {
    if (!mahasiswaId) return;

    setLoading(true);
    fetchNilaiByMahasiswa(mahasiswaId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Error fetch nilai:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [mahasiswaId, searchParams.get("tab")]);

  if (loading || !data || !role || !mahasiswa) {
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Spin />
      </div>
    );
  }

  const prodiId = mahasiswa.prodi_id || queryProdiId;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <StudentTabs
        role={role}
        nilaiItems={data}
        mahasiswaId={mahasiswaId}
        namaMahasiswa={namaMahasiswa}
        prodiId={prodiId}
        mkIds={mahasiswa.mk_ids ?? []}
      />
    </div>
  );
}