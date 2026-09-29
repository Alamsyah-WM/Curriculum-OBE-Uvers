"use client";

import React, { useEffect, useState, useMemo } from "react";
import CardNoTab from "@/component/CardNoTab";
import { Table, Button, Modal, Form, Input, message, Popconfirm, ConfigProvider } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { fetchProdi, postProdi, updateProdi, deleteProdi, ProdiItem } from "@/service/prodi";

type FormValues = {
  kode_prodi: string;
  nama_prodi: string;
};

export default function ProdiPage() {
  const [data, setData] = useState<ProdiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProdiItem | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [formLoading, setFormLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  const loadProdi = async () => {
    try {
      setLoading(true);
      const res = await fetchProdi();
      setData(res);
    } catch (err) {
      console.error(err);
      message.error("Gagal memuat data program studi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProdi();
  }, []);

  const handleOpenModal = (prodi?: ProdiItem) => {
    setEditingItem(prodi ?? null);
    setModalOpen(true);
    form.resetFields();

    if (prodi) {
      form.setFieldsValue({
        kode_prodi: prodi.kode_prodi,
        nama_prodi: prodi.nama_prodi,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const formValues = await form.validateFields();
      setFormLoading(true);

      const payload = {
        kode_prodi: formValues.kode_prodi,
        nama_prodi: formValues.nama_prodi,
      };

      if (editingItem) {
        await updateProdi(editingItem.prodi_id, payload);
        message.success("Program Studi berhasil diperbarui");
      } else {
        await postProdi(payload);
        message.success("Program Studi berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      await loadProdi();
    } catch (error) {
      console.error(error);
      message.error("Gagal menyimpan program studi");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (prodiId: string) => {
    try {
      await deleteProdi(prodiId);
      message.success("Program Studi berhasil dihapus");
      await loadProdi();
    } catch (err) {
      console.error(err);
      message.error("Gagal menghapus program studi");
    }
  };

  const columns = [
    { title: "Kode Prodi", dataIndex: "kode_prodi", key: "kode_prodi" },
    { title: "Nama Program Studi", dataIndex: "nama_prodi", key: "nama_prodi" },
    {
      title: "Aksi",
      key: "aksi",
      width: 220,
      render: (_: any, record: ProdiItem) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            size="small"
            style={{ backgroundColor: "#F59E0B", color: "white" }}
            onClick={() => handleOpenModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus Program Studi?"
            onConfirm={() => handleDelete(record.prodi_id)}
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
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    let result = data;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.nama_prodi.toLowerCase().includes(kw) ||
          p.kode_prodi.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [data, searchKeyword]);

  return (
    <div>
      <CardNoTab
        headerContent={
          <div className="flex flex-row gap-2 pb-2">
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Cari Kode / Nama Program Studi"
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Button
                type="primary"
                style={{ backgroundColor: "#59D4A2", color: "white" }}
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                Tambah Program Studi
              </Button>
            </div>
          </div>
        }
      >
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
        <Table<ProdiItem>
          rowKey="prodi_id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
        </ConfigProvider>
      </CardNoTab>

      <Modal
        open={modalOpen}
        title={editingItem ? "Edit Program Studi" : "Tambah Program Studi"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingItem ? "Simpan Perubahan" : "Tambah"}
        cancelText="Batal"
        confirmLoading={formLoading}
      >
        <Form form={form} layout="vertical" disabled={formLoading}>
          <Form.Item
            label="Kode Prodi"
            name="kode_prodi"
            rules={[{ required: true, message: "Kode prodi wajib diisi" }]}
          >
            <Input placeholder="Masukkan kode program studi (contoh: TIF)" />
          </Form.Item>

          <Form.Item
            label="Nama Program Studi"
            name="nama_prodi"
            rules={[
              { required: true, message: "Nama program studi wajib diisi" },
            ]}
          >
            <Input placeholder="Masukkan nama program studi (contoh: Teknik Informatika)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
