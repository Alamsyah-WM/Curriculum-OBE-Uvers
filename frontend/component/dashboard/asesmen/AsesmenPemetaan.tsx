// component/dashboard/asesmen/AsesmenPemetaan.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Collapse, Table, Tag, Input, Spin, Empty, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CollapseProps } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import CardNoTab from "@/component/CardNoTab";
import { fetchCpl, CplItem } from "@/service/cpl";
import { fetchCpmk, CpmkItem } from "@/service/cpmk";
import { fetchSubcpmk, SubcpmkItem } from "@/service/subcpmk";
import { fetchAsesmen, AsesmenItem } from "@/service/asesmen";
import { fetchMk, MkItem } from "@/service/mk";

type Props = {
  role: string;
  mkId: string;
  namaMk: string;
  prodiId: string;
};

export default function AsesmenPemetaan({ role, mkId, namaMk, prodiId }: Props) {
  const [cplList, setCplList] = useState<CplItem[]>([]);
  const [cpmkList, setCpmkList] = useState<CpmkItem[]>([]);
  const [subcpmkList, setSubcpmkList] = useState<SubcpmkItem[]>([]);
  const [asesmenList, setAsesmenList] = useState<AsesmenItem[]>([]);
  const [mkDetails, setMkDetails] = useState<MkItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [cplRes, cpmkRes, subcpmkRes, asesmenRes, mkRes] = await Promise.all([
        fetchCpl(prodiId),
        fetchCpmk(),
        fetchSubcpmk(),
        fetchAsesmen(),
        fetchMk(),
      ]);

      setCplList(cplRes);
      setCpmkList(cpmkRes);
      setSubcpmkList(subcpmkRes);
      setAsesmenList(asesmenRes);

      const foundMk = mkRes.find((m) => m.mk_id === mkId);
      setMkDetails(foundMk ?? null);
    } catch (err) {
      console.error("Gagal load AsesmenPemetaan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mkId && prodiId) {
      loadData();
    }
  }, [mkId, prodiId]);

  // Filter CPMK milik mata kuliah ini
  const courseCpmks = useMemo(() => {
    return cpmkList.filter((c) => c.mk_id === mkId);
  }, [cpmkList, mkId]);

  // Filter Sub-CPMK milik mata kuliah ini
  const courseSubcpmks = useMemo(() => {
    return subcpmkList.filter((s) => s.mk_id === mkId);
  }, [subcpmkList, mkId]);

  // Ambil ID CPL yang berkaitan dengan mata kuliah ini
  const courseCplIds = useMemo(() => {
    const fromMk = mkDetails?.cpl_ids ?? [];
    const fromCpmk = courseCpmks.map((c) => c.cpl_id);
    return Array.from(new Set([...fromMk, ...fromCpmk]));
  }, [mkDetails, courseCpmks]);

  // Filter CPL yang berkaitan
  const relatedCpls = useMemo(() => {
    return cplList.filter((cpl) => courseCplIds.includes(cpl.cpl_id));
  }, [cplList, courseCplIds]);

  // Filter data berdasarkan search keyword
  const filteredCpls = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return relatedCpls;

    return relatedCpls.filter((cpl) => {
      const codeMatches = cpl.kode_cpl.toLowerCase().includes(keyword);
      const descMatches = cpl.deskripsi.toLowerCase().includes(keyword);

      // Cek apakah ada CPMK di bawah CPL ini yang cocok dengan keyword
      const hasMatchingCpmk = courseCpmks.some(
        (cpmk) =>
          cpmk.cpl_id === cpl.cpl_id &&
          (cpmk.kode_cpmk.toLowerCase().includes(keyword) ||
            cpmk.deskripsi.toLowerCase().includes(keyword))
      );

      // Cek apakah ada Sub-CPMK di bawah CPL ini yang cocok dengan keyword
      const hasMatchingSubcpmk = courseSubcpmks.some((sub) => {
        const parentCpmk = courseCpmks.find((c) => c.cpmk_id === sub.cpmk_id);
        return (
          parentCpmk &&
          parentCpmk.cpl_id === cpl.cpl_id &&
          (sub.kode_subcpmk.toLowerCase().includes(keyword) ||
            sub.deskripsi.toLowerCase().includes(keyword))
        );
      });

      return codeMatches || descMatches || hasMatchingCpmk || hasMatchingSubcpmk;
    });
  }, [relatedCpls, courseCpmks, courseSubcpmks, searchKeyword]);

  // Kolom untuk tabel asesmen paling dalam
  const asesmenColumns: ColumnsType<AsesmenItem> = [
    {
      title: "Nama Asesmen",
      dataIndex: "nama_asesmen",
      key: "nama_asesmen",
      width: 200,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: "Teknik Penilaian",
      dataIndex: "teknik_penilaian",
      key: "teknik_penilaian",
      width: 180,
      render: (teknik) => teknik,
      // render: (teknik) => (
      //   <Tag color="cyan" style={{ borderRadius: 12 }}>
      //     {teknik || "-"}
      //   </Tag>
      // ),
    },
    {
      title: "Bobot",
      dataIndex: "bobot",
      key: "bobot",
      width: 100,
      render: (bobot) => bobot + "%",
      // render: (bobot) => <Tag color="purple">{bobot}%</Tag>,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      render: (desc) => desc || <span style={{ opacity: 0.5 }}>Tidak ada deskripsi</span>,
    },
  ];

  // Helper render Sub-CPMK Collapse
  const renderSubcpmkCollapse = (cpmkId: string) => {
    const cpmkSubs = courseSubcpmks.filter((s) => s.cpmk_id === cpmkId);

    if (cpmkSubs.length === 0) {
      return (
        <div style={{ opacity: 0.5, padding: "8px 16px" }}>
          Belum ada Sub-CPMK untuk CPMK ini.
        </div>
      );
    }

    const items: CollapseProps["items"] = cpmkSubs.map((sub) => {
      const subAsesmens = asesmenList.filter((a) => a.subcpmk_id === sub.subcpmk_id);

      return {
        key: sub.subcpmk_id,
        label: (
          <span style={{ fontWeight: 500 }}>
            {sub.kode_subcpmk} - {sub.deskripsi} ({sub.bobot}%)
          </span>
        ),
        children:
          subAsesmens.length > 0 ? (
            <Table<AsesmenItem>
              dataSource={subAsesmens}
              columns={asesmenColumns}
              rowKey="asesmen_id"
              pagination={false}
              size="small"
              bordered
            />
          ) : (
            <div style={{ opacity: 0.5, padding: "8px 16px" }}>
              Belum ada asesmen untuk Sub-CPMK ini.
            </div>
          ),
      };
    });

    return <Collapse items={items} ghost size="small" />;
  };

  // Helper render CPMK Collapse
  const renderCpmkCollapse = (cplId: string) => {
    const cplCpmks = courseCpmks.filter((c) => c.cpl_id === cplId);

    if (cplCpmks.length === 0) {
      return (
        <div style={{ opacity: 0.5, padding: "8px 16px" }}>
          Belum ada CPMK untuk CPL ini yang dipetakan ke mata kuliah ini.
        </div>
      );
    }

    const items: CollapseProps["items"] = cplCpmks.map((cpmk) => ({
      key: cpmk.cpmk_id,
      label: (
        <span>
          <b>{cpmk.kode_cpmk}</b> - {cpmk.deskripsi}
        </span>
      ),
      children: renderSubcpmkCollapse(cpmk.cpmk_id),
    }));

    return <Collapse items={items} bordered={false} style={{ backgroundColor: "#F8FAFC" }} />;
  };

  // Membangun Collapse list level CPL
  const cplCollapseItems: CollapseProps["items"] = useMemo(() => {
    return filteredCpls.map((cpl) => ({
      key: cpl.cpl_id,
      label: (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontWeight: 600, color: "#1E293B" }}>
            {cpl.kode_cpl}
          </span>
          <span style={{ fontSize: 13, color: "#64748B" }}>
            {cpl.deskripsi}
          </span>
        </div>
      ),
      children: renderCpmkCollapse(cpl.cpl_id),
    }));
  }, [filteredCpls, courseCpmks, courseSubcpmks, asesmenList]);

  if (loading) {
    return (
      <Card style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px 0",
          }}
        >
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <CardNoTab
        headerContent={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Input
              style={{ width: "30%", minWidth: 240 }}
              placeholder="Cari CPL, CPMK, atau SCPMK"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
        }
      >
        {cplCollapseItems.length === 0 ? (
          <Empty description="Tidak ada pemetaan CPL/CPMK yang cocok." />
        ) : (
          <Collapse items={cplCollapseItems} style={{ backgroundColor: "#FFFFFF" }} />
        )}
      </CardNoTab>
    </div>
  );
}
