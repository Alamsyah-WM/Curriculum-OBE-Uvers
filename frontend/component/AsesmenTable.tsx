"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, message, ConfigProvider } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import type { MkItem } from "@/service/mk";
import { fetchMk } from "@/service/mk";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

type Props = {
  searchKeyword?: string;
  semesterList?: string[];
};

export default function AsesmenTable({ searchKeyword, semesterList }: Props) {
  const [data, setData] = useState<MkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dosenId, setDosenId] = useState<string>("");
  const router = useRouter();

  // 🔥 Auto-load dosen_id dari auth/me lalu fetch MK yang diampu
  useEffect(() => {
    fetchAuthMe()
      .then((user: AuthMeResponse) => {
        setDosenId(user.dosen_id);
      })
      .catch((err) => {
        console.error("Error fetch user:", err);
        message.error("Gagal memuat data user");
      });
  }, []);

  const loadData = async () => {
    if (!dosenId) return;
    try {
      setLoading(true);
      const res = await fetchMk({ dosenId });
      setData(res);
    } catch (err) {
      console.error("Error fetch mata kuliah:", err);
      message.error("Gagal memuat data mata kuliah");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dosenId]);

  const columns: ColumnsType<MkItem> = [
    { title: "Kode MK", dataIndex: "kode_mk", key: "kode_mk" },
    { title: "Nama Mata Kuliah", dataIndex: "nama_mk_id", key: "nama_mk_id" },
    { title: "Prodi", dataIndex: "nama_prodi", key: "prodi_id" },
    { title: "Semester", dataIndex: "semester", key: "semester" },
    { title: "CPL", dataIndex: "cpl_display", key: "cpl_display" },
    {
      title: "Aksi",
      key: "aksi",
      width: 120,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            style={{ backgroundColor: "#10B981", color: "white" }}
            onClick={() =>
              router.push(
                `/assessment/${record.mk_id}?nama_mk=${encodeURIComponent(
                  record.nama_mk_id
                )}`
              )
            }
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    let result = data;

    if (semesterList && semesterList.length > 0) {
      result = result.filter((m) =>
        semesterList.includes(String(m.semester))
      );
    }

    if (searchKeyword && searchKeyword.trim() !== "") {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        (m) =>
          m.kode_mk.toLowerCase().includes(keyword) ||
          m.nama_mk_id.toLowerCase().includes(keyword) ||
          m.nama_mk_en.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [data, semesterList, searchKeyword]);

  return (
    <div>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: "#003D73",
              headerColor: "#ffffff",
              headerSortActiveBg: "#002d55",
              headerSortHoverBg: "#00325f",
            },
          },
        }}
      >
        <Table<MkItem>
          rowKey="mk_id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </ConfigProvider>
    </div>
  );
}
