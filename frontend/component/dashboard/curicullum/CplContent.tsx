// component/dashboard/curicullum/CplContent.tsx
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
  CplItem,
  CplPayload,
  deleteCpl,
  fetchCpl,
  postCpl,
  updateCpl,
} from "@/service/cpl";

import {
  fetchProfileLulusan,
  ProfileLulusanItem,
} from "@/service/profile";

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

type FormValues = {
  kode_cpl: string;
  deskripsi: string;
  referensi: string;
  prodi_id: string;
  pl_id_1: string;
  pl_id_2?: string;
};

export default function CplContent({
  role,
  selectedFilters,
  addTrigger,
}: Props) {
  const [form] = Form.useForm<FormValues>();

  const [data, setData] = useState<CplItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CplItem | null>(null);

  const [profileList, setProfileList] = useState<ProfileLulusanItem[]>([]);
  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [selectedFormProdiId, setSelectedFormProdiId] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [kaprodiProdiId, setKaprodiProdiId] = useState("");

  const isKaprodi = role === "kaprodi";

  const selectedProdiIds = useMemo(() => {
    return selectedFilters.prodi ?? [];
  }, [selectedFilters]);

  const loadData = async () => {
    try {
      setLoading(true);

      const shouldUseQuery = selectedProdiIds.length === 1;
      const res = await fetchCpl(
        shouldUseQuery ? selectedProdiIds[0] : undefined
      );

      setData(res);
    } catch (error) {
      console.error("Error fetch CPL:", error);
      message.error("Gagal mengambil data CPL");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isKaprodi && selectedProdiIds.length === 0) return;

    loadData();
  }, [role, selectedProdiIds.join(",")]);

  const filteredData = useMemo(() => {
    if (selectedProdiIds.length <= 1) return data;

    return data.filter((item) => selectedProdiIds.includes(item.prodi_id));
  }, [data, selectedProdiIds]);

  const loadFormOptions = async () => {
    try {
      setFormLoading(true);

      const [profileRes, prodiRes] = await Promise.all([
        fetchProfileLulusan(),
        fetchProdi(),
      ]);

      setProfileList(profileRes);
      setProdiList(prodiRes);

      let lockedProdiId = kaprodiProdiId;

      if (isKaprodi && !lockedProdiId) {
        const user: AuthMeResponse = await fetchAuthMe();
        lockedProdiId = user.prodi_id;
        setKaprodiProdiId(user.prodi_id);
      }

      return lockedProdiId;
    } catch (error) {
      console.error("Error load CPL form options:", error);
      message.error("Gagal mengambil data form CPL");
      return "";
    } finally {
      setFormLoading(false);
    }
  };

  const filteredProfileList = useMemo(() => {
    if (!selectedFormProdiId) return profileList;

    return profileList.filter(
      (profile) => profile.prodi_id === selectedFormProdiId
    );
  }, [profileList, selectedFormProdiId]);

  const profileOptions = filteredProfileList.map((profile) => ({
    label: `${profile.kode_pl} - ${profile.profesi}`,
    value: profile.pl_id,
  }));

  const handleOpenCreate = async () => {
    setEditingItem(null);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    const initialProdiId = isKaprodi ? lockedProdiId : "";

    setSelectedFormProdiId(initialProdiId);

    form.setFieldsValue({
      kode_cpl: "",
      deskripsi: "",
      referensi: "",
      prodi_id: initialProdiId,
      pl_id_1: undefined as any,
      pl_id_2: undefined,
    });
  };

  const lastAddTriggerRef = useRef(addTrigger);

  useEffect(() => {
    if (addTrigger !== lastAddTriggerRef.current) {
      lastAddTriggerRef.current = addTrigger;
      handleOpenCreate();
    }
  }, [addTrigger]);

  const handleOpenEdit = async (record: CplItem) => {
    setEditingItem(record);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    const initialProdiId = isKaprodi
      ? lockedProdiId || record.prodi_id
      : record.prodi_id;

    setSelectedFormProdiId(initialProdiId);

    form.setFieldsValue({
      kode_cpl: record.kode_cpl,
      deskripsi: record.deskripsi,
      referensi: record.referensi,
      prodi_id: initialProdiId,
      pl_id_1: record.pl_ids?.[0],
      pl_id_2: record.pl_ids?.[1],
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (values.pl_id_2 && values.pl_id_1 === values.pl_id_2) {
        message.warning("Profile Lulusan 1 dan 2 tidak boleh sama");
        return;
      }

      const plIds = [values.pl_id_1, values.pl_id_2].filter(
        Boolean
      ) as string[];

      const payload: CplPayload = {
        pl_ids: plIds,
        kode_cpl: values.kode_cpl,
        deskripsi: values.deskripsi,
        referensi: values.referensi,
      };

      setSaving(true);

      if (editingItem) {
        await updateCpl(editingItem.cpl_id, payload);
        message.success("CPL berhasil diperbarui");
      } else {
        await postCpl(payload);
        message.success("CPL berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      await loadData();
    } catch (error: any) {
      if (error?.errorFields) return;

      console.error("Error submit CPL:", error);
      message.error("Gagal menyimpan CPL");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: CplItem) => {
    try {
      await deleteCpl(record.cpl_id);
      message.success("CPL berhasil dihapus");
      await loadData();
    } catch (error) {
      console.error("Error delete CPL:", error);
      message.error("Gagal menghapus CPL");
    }
  };

  const wrapTextStyle: React.CSSProperties = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.5,
  };

  const columns: ColumnsType<CplItem> = [
    {
      title: "Kode CPL",
      dataIndex: "kode_cpl",
      key: "kode_cpl",
      width: 105,
      render: (value: string) => <b>{value}</b>,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      render: (value: string) => (
        <div style={wrapTextStyle}>{value}</div>
      ),
    },
    {
      title: "Profile Lulusan 1",
      dataIndex: "profile_display",
      key: "profile_display",
      width: 200,
      render: (value: string | null) =>
        value ? <div style={wrapTextStyle}>{value}</div> : <Tag>-</Tag>,
    },
    {
      title: "Profile Lulusan 2",
      dataIndex: "profile_display_2",
      key: "profile_display_2",
      width: 200,
      render: (value: string | null) =>
        value ? <div style={wrapTextStyle}>{value}</div> : <Tag>-</Tag>,
    },
    {
      title: "Referensi",
      dataIndex: "referensi",
      key: "referensi",
      width: 160,
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
            title="Hapus CPL?"
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
      <Table<CplItem>
        rowKey="cpl_id"
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
        title={editingItem ? "Edit CPL" : "Tambah CPL"}
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
        <Form form={form} layout="vertical" disabled={formLoading}>
          <Form.Item
            label="Kode CPL"
            name="kode_cpl"
            rules={[{ required: true, message: "Kode CPL wajib diisi" }]}
          >
            <Input placeholder="Contoh: CPL-01" />
          </Form.Item>

          <Form.Item
            label="Deskripsi CPL"
            name="deskripsi"
            rules={[{ required: true, message: "Deskripsi CPL wajib diisi" }]}
          >
            <Input.TextArea rows={4} placeholder="Masukkan deskripsi CPL" />
          </Form.Item>

          <Form.Item
            label="Referensi"
            name="referensi"
            rules={[{ required: true, message: "Referensi wajib diisi" }]}
          >
            <Input placeholder="Contoh: Kekhasan UVERS" />
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
                  pl_id_1: undefined as any,
                  pl_id_2: undefined,
                });
              }}
            />
          </Form.Item>

          <Form.Item
            label="Profile Lulusan 1"
            name="pl_id_1"
            rules={[
              { required: true, message: "Profile Lulusan 1 wajib dipilih" },
            ]}
          >
            <Select
              placeholder="Pilih Profile Lulusan 1"
              options={profileOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Profile Lulusan 2"
            name="pl_id_2"
          >
            <Select
              placeholder="Pilih Profile Lulusan 2"
              options={profileOptions}
              showSearch
              optionFilterProp="label"
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}