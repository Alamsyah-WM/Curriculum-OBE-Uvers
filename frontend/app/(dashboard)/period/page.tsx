"use client";

import React, { useEffect, useState } from "react";
import CardNoTab from "@/component/CardNoTab";
import { Button, Table, Modal, Form, Input, message, ConfigProvider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { fetchPeriode, PeriodeItem, postPeriode, updatePeriode, deletePeriode } from "@/service/periode";

export default function Period() {
  const [data, setData] = useState<PeriodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeriodeItem | null>(null);
  const [form] = Form.useForm<any>();
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchPeriode();
      setData(res);
    } catch (err) {
      console.error(err);
      message.error("Gagal memuat periode");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item: PeriodeItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      tahun_mulai: item.tahun_mulai,
      tahun_selesai: item.tahun_selesai,
    });
    setModalOpen(true);
  };

  const handleDelete = async (periodeId: string) => {
    try {
      await deletePeriode(periodeId);
      message.success("Periode berhasil dihapus");
      await loadData();
    } catch (err) {
      console.error(err);
      message.error("Gagal menghapus periode");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);

      if (editingItem) {
        await updatePeriode(editingItem.periode_id, values);
        message.success("Periode berhasil diperbarui");
      } else {
        await postPeriode(values);
        message.success("Periode berhasil ditambahkan");
      }

      setModalOpen(false);
      form.resetFields();
      await loadData();
    } catch (err) {
      console.error(err);
      message.error("Gagal menyimpan periode");
    } finally {
      setFormLoading(false);
    }
  };

  const columns: ColumnsType<PeriodeItem> = [
    { title: "Tahun Mulai", dataIndex: "tahun_mulai", key: "tahun_mulai" },
    { title: "Tahun Selesai", dataIndex: "tahun_selesai", key: "tahun_selesai" },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" onClick={() => handleEdit(record)} style={{ backgroundColor: "#F59E0B", color: "white" }}>
            Edit
          </Button>
          <Button style={{ backgroundColor: "#EF4444", color: "white" }}  size="small"  onClick={() => handleDelete(record.periode_id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <CardNoTab
        headerContent={
          <div className="flex justify-between items-center gap-2 pb-2">
            <div>

            </div>

            <div>
              <Button type="primary" style={{ backgroundColor: "#59D4A2", color: "white" }} icon={<PlusOutlined />} onClick={handleAdd}>
                Tambah Periode
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
            <Table<PeriodeItem>
          rowKey="periode_id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
            </ConfigProvider>
      </CardNoTab>

      <Modal
        open={modalOpen}
        title={editingItem ? "Edit Periode" : "Tambah Periode"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={formLoading}
      >
        <Form form={form} layout="vertical" disabled={formLoading}>
          <Form.Item label="Tahun Mulai" name="tahun_mulai" rules={[{ required: true, message: "Tahun Mulai wajib diisi" }]}>
            <Input type="number" placeholder="Contoh: 2025" />
          </Form.Item>
          <Form.Item label="Tahun Selesai" name="tahun_selesai" rules={[{ required: true, message: "Tahun Selesai wajib diisi" }]}>
            <Input type="number" placeholder="Contoh: 2030" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}