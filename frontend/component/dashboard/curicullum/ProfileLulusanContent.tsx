// component/dashboard/curicullum/ProfileLulusanContent.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  ConfigProvider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";

import {
  deleteProfileLulusan,
  fetchProfileLulusan,
  postProfileLulusan,
  ProfileLulusanItem,
  ProfileLulusanPayload,
  updateProfileLulusan,
} from "@/service/profile";

import {
  fetchPeriode,
  formatPeriode,
  PeriodeItem,
} from "@/service/periode";

import {
  fetchProdi,
  ProdiItem,
} from "@/service/prodi";

import {
  fetchAuthMe,
  AuthMeResponse,
} from "@/service/me";

import type { SelectedFilters } from "@/config/filterpresets";

type Props = {
  role: string;
  selectedPeriodeId: string;
  selectedFilters: SelectedFilters;
  addTrigger: number;
};

export default function ProfileLulusanContent({
  role,
  selectedPeriodeId,
  selectedFilters,
  addTrigger,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ProfileLulusanPayload>();

  const [data, setData] = useState<ProfileLulusanItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProfileLulusanItem | null>(
    null
  );

  const [periodeList, setPeriodeList] = useState<PeriodeItem[]>([]);
  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [kaprodiProdiId, setKaprodiProdiId] = useState("");

  const isKaprodi = role === "kaprodi";

  const loadData = async () => {
    if (!selectedPeriodeId) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchProfileLulusan(selectedPeriodeId);
      setData(res);
    } catch (error) {
      console.error("Error fetch profile lulusan:", error);
      message.error("Gagal mengambil data Profile Lulusan");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriodeId]);

  const filteredData = useMemo(() => {
    const selectedProdiIds = selectedFilters.prodi ?? [];

    if (selectedProdiIds.length === 0) return data;

    return data.filter((item) => selectedProdiIds.includes(item.prodi_id));
  }, [data, selectedFilters]);

  const loadFormOptions = async () => {
    try {
      setFormLoading(true);

      const [periodeRes, prodiRes] = await Promise.all([
        fetchPeriode(),
        fetchProdi(),
      ]);

      setPeriodeList(periodeRes);
      setProdiList(prodiRes);

      let lockedProdiId = kaprodiProdiId;

      if (isKaprodi && !lockedProdiId) {
        const user: AuthMeResponse = await fetchAuthMe();
        lockedProdiId = user.prodi_id;
        setKaprodiProdiId(user.prodi_id);
      }

      return lockedProdiId;
    } catch (error) {
      console.error("Error load form options:", error);
      message.error("Gagal mengambil data periode/prodi");
      return "";
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    setEditingItem(null);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    form.setFieldsValue({
      kode_pl: "",
      profesi: "",
      referensi: "",
      deskripsi: "",
      periode_id: selectedPeriodeId,
      prodi_id: isKaprodi ? lockedProdiId : undefined,
    });
  };

  const lastAddTriggerRef = useRef(addTrigger);

  useEffect(() => {
    if (addTrigger !== lastAddTriggerRef.current) {
      lastAddTriggerRef.current = addTrigger;
      handleOpenCreate();
    }
  }, [addTrigger]);

  const handleOpenEdit = async (record: ProfileLulusanItem) => {
    setEditingItem(record);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    form.setFieldsValue({
      kode_pl: record.kode_pl,
      profesi: record.profesi,
      referensi: record.referensi,
      deskripsi: record.deskripsi || "",
      periode_id: record.periode_id,
      prodi_id: isKaprodi ? lockedProdiId || record.prodi_id : record.prodi_id,
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: ProfileLulusanPayload = {
        kode_pl: values.kode_pl,
        profesi: values.profesi,
        referensi: values.referensi,
        deskripsi: values.deskripsi,
        periode_id: values.periode_id,
        prodi_id: isKaprodi && kaprodiProdiId ? kaprodiProdiId : values.prodi_id,
      };

      setSaving(true);

      if (editingItem) {
        await updateProfileLulusan(editingItem.pl_id, payload);
        message.success("Profile Lulusan berhasil diperbarui");
      } else {
        await postProfileLulusan(payload);
        message.success("Profile Lulusan berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      await loadData();
    } catch (error: any) {
      if (error?.errorFields) return;

      console.error("Error submit profile lulusan:", error);
      message.error("Gagal menyimpan Profile Lulusan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: ProfileLulusanItem) => {
    try {
      await deleteProfileLulusan(record.pl_id);
      message.success("Profile Lulusan berhasil dihapus");
      await loadData();
    } catch (error) {
      console.error("Error delete profile lulusan:", error);
      message.error("Gagal menghapus Profile Lulusan");
    }
  };

  const wrapTextStyle: React.CSSProperties = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.5,
  };

  const columns: ColumnsType<ProfileLulusanItem> = [
    {
      title: "Kode PL",
      dataIndex: "kode_pl",
      key: "kode_pl",
      width: 90,
      render: (value: string) => <b>{value}</b>,
    },
    {
      title: "Profil Lulusan",
      dataIndex: "deskripsi",
      key: "deskripsi",
      render: (value: string) => (
        <div style={wrapTextStyle}>{value}</div>
      ),
    },
    {
      title: "Profesi",
      dataIndex: "profesi",
      key: "profesi",
      render: (value: string) => (
        <div style={wrapTextStyle}>{value}</div>
      ),
    },
    {
      title: "Periode",
      dataIndex: "periode_display",
      key: "periode_display",
      width: 125,
      render: (value: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {value}
        </Tag>
      ),
    },
    {
      title: "Prodi",
      dataIndex: "prodi_display",
      key: "prodi_display",
      width: 170,
      render: (value: string) => (
        <div style={wrapTextStyle}>{value}</div>
      ),
    },
    {
      title: "Referensi",
      dataIndex: "referensi",
      key: "referensi",
      width: 180,
      render: (value: string) => (
        <div style={wrapTextStyle}>{value}</div>
      ),
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
            title="Hapus Profile Lulusan?"
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
        <Table<ProfileLulusanItem>
          rowKey="pl_id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
          tableLayout="fixed"
          size="small"
        />
      </ConfigProvider>

      <Modal
        open={modalOpen}
        forceRender
        title={editingItem ? "Edit Profile Lulusan" : "Tambah Profile Lulusan"}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingItem ? "Simpan Perubahan" : "Tambah"}
        cancelText="Batal"
        confirmLoading={saving}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={formLoading}
        >
          <Form.Item
            label="Kode PL"
            name="kode_pl"
            rules={[{ required: true, message: "Kode PL wajib diisi" }]}
          >
            <Input placeholder="Contoh: PL01" />
          </Form.Item>

          <Form.Item
            label="Profil Lulusan (Deskripsi)"
            name="deskripsi"
            rules={[{ required: true, message: "Profil Lulusan wajib diisi" }]}
          >
            <Input.TextArea placeholder="Masukkan deskripsi profil lulusan..." rows={4} />
          </Form.Item>

          <Form.Item
            label="Profesi"
            name="profesi"
            rules={[{ required: true, message: "Profesi wajib diisi" }]}
          >
            <Input placeholder="Contoh: Software Engineer" />
          </Form.Item>

          <Form.Item
            label="Referensi"
            name="referensi"
            rules={[{ required: true, message: "Referensi wajib diisi" }]}
          >
            <Input placeholder="Contoh: IABEE 1.3.a" />
          </Form.Item>

          <Form.Item
            label="Periode"
            name="periode_id"
            rules={[{ required: true, message: "Periode wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih periode"
              options={periodeList.map((periode) => ({
                label: formatPeriode(periode),
                value: periode.periode_id,
              }))}
              showSearch
              optionFilterProp="label"
            />
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
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}