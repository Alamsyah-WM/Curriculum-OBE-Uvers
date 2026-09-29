"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Popconfirm, message, ConfigProvider } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import type { Mahasiswa } from "@/service/student";
import { fetchMahasiswaFiltered, deleteMahasiswa } from "@/service/student";

type Props = {
  prodiId?: string;
  angkatanList?: string[];
  searchKeyword?: string;
  role?: string;
  onEdit?: (mahasiswa: Mahasiswa) => void;
  onAdd?: () => void;
};

export default function StudentTable({ prodiId, angkatanList, searchKeyword, role, onEdit, onAdd }: Props) {
  const [data, setData] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isAdmin = role === "admin";

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchMahasiswaFiltered(prodiId);
      setData(res);
    } catch (err) {
      console.error("Error fetch mahasiswa:", err);
      message.error("Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [prodiId]);

  const handleDelete = async (mahasiswaId: string) => {
    try {
      await deleteMahasiswa(mahasiswaId);
      message.success("Mahasiswa berhasil dihapus");
      await loadData();
    } catch (err) {
      console.error(err);
      message.error("Gagal menghapus mahasiswa");
    }
  };

  const columns: ColumnsType<Mahasiswa> = [
    { title: "NIM", dataIndex: "nim", key: "nim" },
    { title: "Nama", dataIndex: "nama", key: "nama" },
    { title: "Prodi", dataIndex: "nama_prodi", key: "prodi_id" },
    { title: "Angkatan", dataIndex: "angkatan", key: "angkatan" },
  ];


  columns.push({
    title: "Aksi",
    key: "aksi",
    width: 200,
    render: (_, record) => (
      <div style={{ display: "flex", gap: 6 }}>
        {isAdmin && (
          <>
            <Button
              size="small"
              style={{ backgroundColor: "#F59E0B", color: "white" }}
              onClick={() => onEdit?.(record)}
            >
              Edit
            </Button>

            <Popconfirm
              title="Hapus Mahasiswa?"
              onConfirm={() => handleDelete(record.mahasiswa_id)}
              okText="Hapus"
              cancelText="Batal"
            >
              <Button
                size="small"
                style={{ backgroundColor: "#EF4444", color: "white" }}
              >
                Delete
              </Button>
            </Popconfirm>
          </>
        )}

        {/* View button selalu muncul */}
        <Button
          size="small"
          style={{ backgroundColor: "#10B981", color: "white" }}
          onClick={() =>
            router.push(
              `/student/${record.mahasiswa_id}?nama=${encodeURIComponent(
                record.nama
              )}&prodiId=${record.prodi_id}`
            )
          }
        >
          View
        </Button>
      </div>
    ),
  });

  const filteredData = useMemo(() => {
    let result = data;

    if (angkatanList && angkatanList.length > 0) {
      result = result.filter(m => angkatanList.includes(String(m.angkatan)));
    }

    if (searchKeyword && searchKeyword.trim() !== "") {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(m => m.nim.toLowerCase().includes(keyword) || m.nama.toLowerCase().includes(keyword));
    }

    return result;
  }, [data, angkatanList, searchKeyword]);

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
        <Table<Mahasiswa>
          rowKey="mahasiswa_id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </ConfigProvider>
    </div>
  );
}