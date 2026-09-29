// app/(dashboard)/assessment/[mkId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Spin, message } from "antd";
import { fetchMk, MkItem } from "@/service/mk";
import AsesmenTabs from "@/component/dashboard/asesmen/AsesmenTabs";

export default function AssessmentDetailPage() {
  const params = useParams<{ mkId: string }>();
  const searchParams = useSearchParams();

  const mkId = params.mkId;
  const queryNamaMk = searchParams.get("nama_mk") ?? "";

  const [mk, setMk] = useState<MkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole ?? "");
  }, []);

  useEffect(() => {
    if (!mkId) return;

    setLoading(true);
    fetchMk()
      .then((res) => {
        const found = res.find((m) => m.mk_id === mkId);
        setMk(found ?? null);
      })
      .catch((err) => {
        console.error("Error fetch mata kuliah:", err);
        message.error("Gagal memuat detail mata kuliah");
        setMk(null);
      })
      .finally(() => setLoading(false));
  }, [mkId]);

  if (loading || !role) {
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!mk) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "red" }}>
        Mata kuliah tidak ditemukan
      </div>
    );
  }

  const prodiId = mk.prodi_id;
  const namaMk = mk.nama_mk_id || queryNamaMk;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <AsesmenTabs
        role={role}
        mkId={mkId}
        namaMk={namaMk}
        prodiId={prodiId}
      />
    </div>
  );
}
