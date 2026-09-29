// component/dashboard/curicullum/MataKuliahContent.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  message,
  ConfigProvider
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";

import {
  deleteMk,
  fetchMk,
  MkItem,
  MkPayload,
  postMk,
  updateMk,
} from "@/service/mk";

import { fetchProdi, ProdiItem } from "@/service/prodi";
import { fetchDosen, DosenItem } from "@/service/dosen";
import { fetchCpl, CplItem } from "@/service/cpl";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

import type { SelectedFilters } from "@/config/filterpresets";

type Props = {
  role: string;
  selectedPeriodeId: string;
  selectedFilters: SelectedFilters;
  addTrigger: number;
};

type FormValues = {
  kode_mk: string;
  nama_mk_id: string;
  nama_mk_en: string;
  prodi_id: string;
  dosen_id: string;
  semester: string;
  cpl_ids: string[];
};

const semesterOptions = Array.from({ length: 8 }, (_, index) => {
  const semester = String(index + 1);

  return {
    label: `Semester ${semester}`,
    value: semester,
  };
});

export default function MataKuliahContent({
  role,
  selectedFilters,
  addTrigger
}: Props) {
  const [form] = Form.useForm<FormValues>();

  const [data, setData] = useState<MkItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MkItem | null>(null);

  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [dosenList, setDosenList] = useState<DosenItem[]>([]);
  const [cplList, setCplList] = useState<CplItem[]>([]);

  const [selectedFormProdiId, setSelectedFormProdiId] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [kaprodiProdiId, setKaprodiProdiId] = useState("");

  const isKaprodi = role === "kaprodi";

  const selectedProdiIds = useMemo(() => {
    return selectedFilters.prodi ?? [];
  }, [selectedFilters]);

  const selectedSemesters = useMemo(() => {
    return selectedFilters.semester ?? [];
  }, [selectedFilters]);

  const loadData = async () => {
    try {
      setLoading(true);

      const queryProdiId =
        selectedProdiIds.length === 1 ? selectedProdiIds[0] : undefined;

      const querySemester =
        selectedSemesters.length === 1 ? selectedSemesters[0] : undefined;

      const res = await fetchMk({
        prodiId: queryProdiId,
        semester: querySemester,
      });

      setData(res);
    } catch (error) {
      console.error("Error fetch MK:", error);
      message.error("Gagal mengambil data mata kuliah");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isKaprodi && selectedProdiIds.length === 0) return;

    loadData();
  }, [role, selectedProdiIds.join(","), selectedSemesters.join(",")]);

  const filteredData = useMemo(() => {
    let result = data;

    if (selectedProdiIds.length > 1) {
      result = result.filter((item) =>
        selectedProdiIds.includes(item.prodi_id)
      );
    }

    if (selectedSemesters.length > 1) {
      result = result.filter((item) =>
        selectedSemesters.includes(String(item.semester))
      );
    }

    return result;
  }, [data, selectedProdiIds, selectedSemesters]);

  const loadFormOptions = async () => {
    try {
      setFormLoading(true);

      const [prodiRes, dosenRes, cplRes] = await Promise.all([
        fetchProdi(),
        fetchDosen(),
        fetchCpl(),
      ]);

      setProdiList(prodiRes);
      setDosenList(dosenRes);
      setCplList(cplRes);

      let lockedProdiId = kaprodiProdiId;

      if (isKaprodi && !lockedProdiId) {
        const user: AuthMeResponse = await fetchAuthMe();
        lockedProdiId = user.prodi_id;
        setKaprodiProdiId(user.prodi_id);
      }

      return lockedProdiId;
    } catch (error) {
      console.error("Error load MK form options:", error);
      message.error("Gagal mengambil data form mata kuliah");
      return "";
    } finally {
      setFormLoading(false);
    }
  };

  const filteredDosenList = useMemo(() => {
    if (!selectedFormProdiId) return [];

    return dosenList.filter(
      (dosen) => dosen.prodi_id === selectedFormProdiId
    );
  }, [dosenList, selectedFormProdiId]);

  const filteredCplList = useMemo(() => {
    if (!selectedFormProdiId) return [];

    return cplList.filter((cpl) => cpl.prodi_id === selectedFormProdiId);
  }, [cplList, selectedFormProdiId]);

  const cplMap = useMemo(() => {
    const map = new Map<string, CplItem>();

    filteredCplList.forEach((cpl) => {
      map.set(cpl.cpl_id, cpl);
    });

    return map;
  }, [filteredCplList]);

  const truncate = (text: string, max: number) => text.length > max ? `${text.slice(0, max)}...` : text;

  const cplOptions = useMemo(() => {
    return filteredCplList.map((cpl) => ({
      label: cpl.kode_cpl,
      value: cpl.cpl_id,
    }));
  }, [filteredCplList]);

  const handleOpenCreate = async () => {
    setEditingItem(null);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    const initialProdiId = isKaprodi ? lockedProdiId : "";

    setSelectedFormProdiId(initialProdiId);

    form.setFieldsValue({
      kode_mk: "",
      nama_mk_id: "",
      nama_mk_en: "",
      prodi_id: initialProdiId,
      dosen_id: undefined as any,
      semester: undefined as any,
      cpl_ids: [],
    });
  };

  const lastAddTriggerRef = useRef(addTrigger);

  useEffect(() => {
    if (addTrigger !== lastAddTriggerRef.current) {
      lastAddTriggerRef.current = addTrigger;
      handleOpenCreate();
    }
  }, [addTrigger]);

  const handleOpenEdit = async (record: MkItem) => {
    setEditingItem(record);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    const initialProdiId = isKaprodi
      ? lockedProdiId || record.prodi_id
      : record.prodi_id;

    setSelectedFormProdiId(initialProdiId);

    form.setFieldsValue({
      kode_mk: record.kode_mk,
      nama_mk_id: record.nama_mk_id,
      nama_mk_en: record.nama_mk_en,
      prodi_id: initialProdiId,
      dosen_id: record.dosen_id,
      semester: String(record.semester),
      cpl_ids: record.cpl_ids ?? [],
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: MkPayload = {
        kode_mk: values.kode_mk,
        nama_mk_id: values.nama_mk_id,
        nama_mk_en: values.nama_mk_en,
        prodi_id: isKaprodi && kaprodiProdiId ? kaprodiProdiId : values.prodi_id,
        dosen_id: values.dosen_id,
        semester: values.semester,
        cpl_ids: values.cpl_ids,
      };

      setSaving(true);

      if (editingItem) {
        await updateMk(editingItem.mk_id, payload);
        message.success("Mata kuliah berhasil diperbarui");
      } else {
        await postMk(payload);
        message.success("Mata kuliah berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      await loadData();
    } catch (error: any) {
      if (error?.errorFields) return;

      console.error("Error submit MK:", error);
      message.error("Gagal menyimpan mata kuliah");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: MkItem) => {
    try {
      await deleteMk(record.mk_id);
      message.success("Mata kuliah berhasil dihapus");
      await loadData();
    } catch (error) {
      console.error("Error delete MK:", error);
      message.error("Gagal menghapus mata kuliah");
    }
  };

  const wrapTextStyle: React.CSSProperties = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.5,
  };

  const columns: ColumnsType<MkItem> = [
    {
      title: "Kode MK",
      dataIndex: "kode_mk",
      key: "kode_mk",
      width: 95,
      render: (value: string) => <b>{value}</b>,
    },
    {
      title: "Nama MK (ID)",
      dataIndex: "nama_mk_id",
      key: "nama_mk_id",
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Nama MK (EN)",
      dataIndex: "nama_mk_en",
      key: "nama_mk_en",
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Prodi",
      dataIndex: "nama_prodi",
      key: "nama_prodi",
      width: 170,
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Dosen",
      dataIndex: "nama_dosen",
      key: "nama_dosen",
      width: 140,
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Semester",
      dataIndex: "semester",
      key: "semester",
      width: 90,
      align: "center",
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "CPL",
      dataIndex: "cpl_display",
      key: "cpl_display",
      width: 150,
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 105,
      align: "center",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "center",
          }}
        >
          <Button
            size="small"
            onClick={() => handleOpenEdit(record)}
            style={{
              width: 70,
              backgroundColor: "#F59E0B",
              color: "white",
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Hapus Mata Kuliah?"
            description="Data yang dihapus tidak dapat dikembalikan."
            okText="Hapus"
            cancelText="Batal"
            onConfirm={() => handleDelete(record)}
          >
            <Button
              size="small"
              danger
              style={{
                width: 70,
                backgroundColor: "#EF4444",
                color: "white",
              }}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
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
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        tableLayout="fixed"
        size="small"
      />
      </ConfigProvider>
      <Modal
        open={modalOpen}
        forceRender
        title={editingItem ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingItem ? "Simpan Perubahan" : "Tambah"}
        cancelText="Batal"
        confirmLoading={saving}
        width={760}
      >
        <Form form={form} layout="vertical" disabled={formLoading}>
          <Form.Item
            label="Kode MK"
            name="kode_mk"
            rules={[{ required: true, message: "Kode MK wajib diisi" }]}
          >
            <Input placeholder="Contoh: IF1110" />
          </Form.Item>

          <Form.Item
            label="Nama Mata Kuliah (Bahasa Indonesia)"
            name="nama_mk_id"
            rules={[{ required: true, message: "Nama MK ID wajib diisi" }]}
          >
            <Input placeholder="Contoh: Sistem Basis Data" />
          </Form.Item>

          <Form.Item
            label="Nama Mata Kuliah (Bahasa Inggris)"
            name="nama_mk_en"
            rules={[{ required: true, message: "Nama MK EN wajib diisi" }]}
          >
            <Input placeholder="Contoh: Database System" />
          </Form.Item>

          <Form.Item
            label="Prodi"
            name="prodi_id"
            rules={[{ required: true, message: "Prodi wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih prodi"
              disabled={isKaprodi}
              options={prodiList.map((prodi) => ({
                label: prodi.nama_prodi,
                value: prodi.prodi_id,
              }))}
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                setSelectedFormProdiId(value);

                form.setFieldsValue({
                  dosen_id: undefined as any,
                  cpl_ids: [],
                });
              }}
            />
          </Form.Item>

          <Form.Item
            label="Dosen"
            name="dosen_id"
            rules={[{ required: true, message: "Dosen wajib dipilih" }]}
          >
            <Select
              placeholder={
                selectedFormProdiId
                  ? "Pilih dosen"
                  : "Pilih prodi terlebih dahulu"
              }
              disabled={!selectedFormProdiId}
              options={filteredDosenList.map((dosen) => ({
                label: `${dosen.nama_dosen} - ${dosen.nidn}`,
                value: dosen.dosen_id,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Semester"
            name="semester"
            rules={[{ required: true, message: "Semester wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih semester"
              options={semesterOptions}
            />
          </Form.Item>

          <Form.Item
            label="CPL"
            name="cpl_ids"
            rules={[
              {
                required: true,
                message: "Minimal pilih satu CPL",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={
                selectedFormProdiId
                  ? "Pilih CPL"
                  : "Pilih prodi terlebih dahulu"
              }
              disabled={!selectedFormProdiId}
              options={cplOptions}
              showSearch
              optionFilterProp="label"
              optionLabelProp="label"
              maxTagCount="responsive"
              optionRender={(option) => {
                const optionData = option.data as {
                  value?: string;
                  label?: React.ReactNode;
                };

                const cpl = cplMap.get(String(optionData.value ?? ""));

                if (!cpl) {
                  return <span>{optionData.label}</span>;
                }

                return (
                  <div
                    style={{
                      whiteSpace: "normal",
                      lineHeight: 1.4,
                      padding: "4px 0",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {cpl.kode_cpl}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.75,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {cpl.deskripsi}
                    </div>
                  </div>
                );
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}