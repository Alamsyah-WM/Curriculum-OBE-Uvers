// component/dashboard/student/StudentKrsView.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Modal, Button, message, Spin, Form, Checkbox, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { fetchMk, MkItem } from "@/service/mk";
import { updateMahasiswaKRS } from "@/service/student";

type Props = {
  mahasiswaId: string;
  prodiId: string;
  mkIds?: string[]; // MK yang sudah diambil mahasiswa
};

export default function StudentKrsView({ mahasiswaId, prodiId, mkIds = [] }: Props) {
  const [mkList, setMkList] = useState<MkItem[]>([]);
  const [selectedMkIds, setSelectedMkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ mk_ids: string[] }>();

  // Synchronize mkIds prop to local state
  useEffect(() => {
    setSelectedMkIds(mkIds);
    form.setFieldsValue({ mk_ids: mkIds });
  }, [mkIds]);

  const loadMk = async () => {
    try {
      setLoading(true);
      const res = await fetchMk({ prodiId });
      setMkList(res);
    } catch (err) {
      console.error("Gagal load MK:", err);
      message.error("Gagal memuat mata kuliah");
      setMkList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMk();
  }, [prodiId]);

  const columns: ColumnsType<MkItem> = [
    { title: "Kode MK", dataIndex: "kode_mk", key: "kode_mk", width: 120 },
    { title: "Nama MK (ID)", dataIndex: "nama_mk_id", key: "nama_mk_id" },
    { title: "Nama MK (EN)", dataIndex: "nama_mk_en", key: "nama_mk_en" },
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateMahasiswaKRS(mahasiswaId, values.mk_ids);
      message.success("KRS berhasil diperbarui");
      setModalOpen(false);
      
      // Update local state and reload page to synchronize other tabs
      setSelectedMkIds(values.mk_ids);
      window.location.reload();
    } catch (err) {
      console.error(err);
      message.error("Gagal menyimpan KRS");
    } finally {
      setSaving(false);
    }
  };

  // Group and sort mata kuliah helper
  const getGroupedAndSortedMks = (items: MkItem[]) => {
    const groups: Record<number, MkItem[]> = {};
    items.forEach((item) => {
      const sem = item.semester || 0;
      if (!groups[sem]) groups[sem] = [];
      groups[sem].push(item);
    });

    Object.keys(groups).forEach((sem) => {
      groups[Number(sem)].sort((a, b) => a.kode_mk.localeCompare(b.kode_mk));
    });

    return groups;
  };

  const takenMks = mkList.filter((mk) => selectedMkIds.includes(mk.mk_id));
  const groupedTakenMks = getGroupedAndSortedMks(takenMks);
  const sortedSemesters = Object.keys(groupedTakenMks)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card
      title="Kartu Rencana Studi (KRS)"
      extra={
        <Button
          type="primary"
          style={{backgroundColor: "#F59E0B"}}
          onClick={() => {
            form.setFieldsValue({ mk_ids: selectedMkIds });
            setModalOpen(true);
          }}
        >
          Edit KRS
        </Button>
      }
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Spin size="large" />
        </div>
      ) : sortedSemesters.length === 0 ? (
        <Empty description="Belum ada mata kuliah yang diambil dalam KRS." />
      ) : (
        sortedSemesters.map((sem) => (
          <div key={sem} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "16px",
                borderBottom: "2px solid #003D73",
                paddingBottom: 4,
                marginBottom: 12,
                color: "#003D73",
              }}
            >
              Semester {sem}
            </div>
            <Table<MkItem>
              rowKey="mk_id"
              columns={columns}
              dataSource={groupedTakenMks[sem]}
              pagination={false}
              size="small"
              bordered
            />
          </div>
        ))
      )}

      <Modal
        title="Edit KRS"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        width={800}
        forceRender
      >
        <Form form={form} layout="vertical">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <Spin size="large" />
            </div>
          ) : mkList.length === 0 ? (
            <Empty description="Tidak ada mata kuliah untuk program studi ini." />
          ) : (
            <Form.Item
              label="Pilih Mata Kuliah"
              name="mk_ids"
              rules={[{ required: true, message: "Minimal pilih satu MK" }]}
            >
              <Checkbox.Group style={{ width: "100%" }}>
                {Object.keys(getGroupedAndSortedMks(mkList))
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((sem) => {
                    const allGroupedMks = getGroupedAndSortedMks(mkList);
                    const mksInSem = allGroupedMks[sem] || [];

                    return (
                      <div key={sem} style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            borderBottom: "1.5px solid #003D73",
                            paddingBottom: 4,
                            marginBottom: 10,
                            color: "#003D73",
                          }}
                        >
                          Semester {sem}
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "10px 16px",
                            paddingLeft: 8,
                          }}
                        >
                          {mksInSem.map((mk) => (
                            <Checkbox key={mk.mk_id} value={mk.mk_id} style={{ marginLeft: 0 }}>
                              <span style={{ fontSize: "13px" }}>
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{mk.kode_mk}</span>
                                {" - "}
                                <span style={{ color: "#334155" }}>{mk.nama_mk_id}</span>
                              </span>
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </Checkbox.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}