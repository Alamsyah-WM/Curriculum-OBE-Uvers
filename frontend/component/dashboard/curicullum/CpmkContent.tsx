// component/dashboard/curicullum/CpmkContent.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

import {
  CpmkItem,
  CpmkPayload,
  deleteCpmk,
  fetchCpmk,
  postCpmk,
  updateCpmk,
} from "@/service/cpmk";

import { useRouter } from "next/navigation";
import { fetchProdi, ProdiItem } from "@/service/prodi";
import { fetchMk, MkItem } from "@/service/mk";
import { fetchCpl, CplItem } from "@/service/cpl";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

import type { SelectedFilters } from "@/config/filterpresets";

type Props = {
  role: string;
  selectedPeriodeId: string;
  selectedFilters: SelectedFilters;
  addTrigger: number;
  searchKeyword: string;
};

type FormValues = {
  prodi_id: string;
  mk_id: string;
  cpl_id: string;
  kode_cpmk: string;
  deskripsi: string;
};

type GroupedCpmkItem = {
  groupKey: string;
  cpl_id: string;
  mk_id: string;
  nama_cpl: string;
  nama_mk: string;
  nama_prodi: string;
  totalBobot: number;
  items: CpmkItem[];
};

export default function CpmkContent({
  role,
  selectedFilters,
  addTrigger,
  searchKeyword,
}: Props) {
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<CpmkItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CpmkItem | null>(null);

  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [mkList, setMkList] = useState<MkItem[]>([]);
  const [cplList, setCplList] = useState<CplItem[]>([]);

  const [selectedFormProdiId, setSelectedFormProdiId] = useState("");
  const [selectedFormMkId, setSelectedFormMkId] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [kaprodiProdiId, setKaprodiProdiId] = useState("");

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const isKaprodi = role === "kaprodi";

  const lastAddTriggerRef = useRef(addTrigger);

  const selectedProdiIds = useMemo(() => {
    return selectedFilters.prodi ?? [];
  }, [selectedFilters]);

  const loadData = async () => {
    try {
      setLoading(true);

      const queryProdiId =
        selectedProdiIds.length === 1 ? selectedProdiIds[0] : undefined;

      const res = await fetchCpmk({
        prodiId: queryProdiId,
      });

      setData(res);
    } catch (error) {
      console.error("Error fetch CPMK:", error);
      messageApi.error("Gagal mengambil data CPMK");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (groupKey: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
        : [...prev, groupKey]
    );
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

      const [prodiRes, mkRes, cplRes] = await Promise.all([
        fetchProdi(),
        fetchMk(),
        fetchCpl(),
      ]);

      setProdiList(prodiRes);
      setMkList(mkRes);
      setCplList(cplRes);

      let lockedProdiId = kaprodiProdiId;

      if (isKaprodi && !lockedProdiId) {
        const user: AuthMeResponse = await fetchAuthMe();
        lockedProdiId = user.prodi_id;
        setKaprodiProdiId(user.prodi_id);
      }

      return lockedProdiId;
    } catch (error) {
      console.error("Error load CPMK form options:", error);
      messageApi.error("Gagal mengambil data form CPMK");
      return "";
    } finally {
      setFormLoading(false);
    }
  };

  const filteredMkList = useMemo(() => {
    if (!selectedFormProdiId) return [];

    return mkList.filter((mk) => mk.prodi_id === selectedFormProdiId);
  }, [mkList, selectedFormProdiId]);

  const selectedMk = useMemo(() => {
    return mkList.find((mk) => mk.mk_id === selectedFormMkId);
  }, [mkList, selectedFormMkId]);

  const filteredCplList = useMemo(() => {
    if (!selectedMk) return [];

    const allowedCplIds = selectedMk.cpl_ids ?? [];

    return cplList.filter((cpl) => allowedCplIds.includes(cpl.cpl_id));
  }, [cplList, selectedMk]);

  const groupedData = useMemo<GroupedCpmkItem[]>(() => {
    const map = new Map<string, GroupedCpmkItem>();

    filteredData.forEach((item) => {
      const groupKey = `${item.cpl_id}-${item.mk_id}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          cpl_id: item.cpl_id,
          mk_id: item.mk_id,
          nama_cpl: item.nama_cpl,
          nama_mk: item.nama_mk,
          nama_prodi: item.nama_prodi,
          totalBobot: 0,
          items: [],
        });
      }

      const group = map.get(groupKey)!;
      group.items.push(item);
      group.totalBobot += Number(item.bobot ?? 0);
    });

    return Array.from(map.values()).map((group) => ({
      ...group,
      items: group.items.sort((a, b) =>
        a.kode_cpmk.localeCompare(b.kode_cpmk)
      ),
    }));
  }, [filteredData]);

  const searchedData = useMemo<GroupedCpmkItem[]>(() => {
    if (!searchKeyword.trim()) return groupedData;

    const kw = searchKeyword.toLowerCase();

    return groupedData.filter((group) => {
      const matchesMk = group.nama_mk.toLowerCase().includes(kw);
      const matchesCpmk = group.items.some((item) =>
        item.kode_cpmk.toLowerCase().includes(kw)
      );
      return matchesMk || matchesCpmk;
    });
  }, [groupedData, searchKeyword]);

  const groupedColumns: ColumnsType<GroupedCpmkItem> = [
    {
      title: "Kode CPL",
      dataIndex: "nama_cpl",
      key: "nama_cpl",
      width: 120,
      render: (value: string) => (
        <Tag color="purple" style={{ margin: 0 }}>
          {value}
        </Tag>
      ),
    },
    {
      title: "Mata Kuliah",
      dataIndex: "nama_mk",
      key: "nama_mk",
      render: (value: string) => (
        <div style={wrapTextStyle}>{value}</div>
      ),
    },
    {
      title: "Jumlah CPMK",
      key: "jumlah_cpmk",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Tag color="blue">{record.items.length} CPMK</Tag>
      ),
    },
    {
      title: "Total Bobot",
      dataIndex: "totalBobot",
      key: "totalBobot",
      width: 120,
      align: "center",
      render: (value: number) => (
        <Tag color={value === 100 ? "green" : "orange"}>{value}</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 110,
      align: "center",
      render: (_, record) => {
        const expanded = expandedRowKeys.includes(record.groupKey);

        return (
          <Button
            size="small"
            onClick={() => handleToggleExpand(record.groupKey)}
            style={{
              width: 80,
              backgroundColor: expanded ? "#6B7280" : "#016FB9",
              color: "white",
            }}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        );
      },
    },
  ];

  const detailColumns: ColumnsType<CpmkItem> = [
    {
      title: "Kode CPMK",
      dataIndex: "kode_cpmk",
      key: "kode_cpmk",
      width: 120,
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
      title: "Bobot",
      dataIndex: "bobot",
      key: "bobot",
      width: 90,
      align: "center",
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 190,
      align: "center",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            size="small"
            onClick={() => handleOpenEdit(record)}
            style={{
              width: 60,
              backgroundColor: "#F59E0B",
              color: "white",
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Hapus CPMK?"
            description="Data yang dihapus tidak dapat dikembalikan."
            okText="Hapus"
            cancelText="Batal"
            onConfirm={() => handleDelete(record)}
          >
            <Button
              size="small"
              danger
              style={{
                width: 60,
                backgroundColor: "#EF4444",
                color: "white",
              }}
            >
              Delete
            </Button>
          </Popconfirm>

          <Button
            size="small"
            onClick={() => {
              sessionStorage.setItem(
                `selectedCpmk:${record.cpmk_id}`,
                JSON.stringify(record)
              );

              router.push(
                `/curicullum/cpmk/${record.cpmk_id}/subcpmk_asesmen`
              );
            }}
            style={{
              width: 60,
              backgroundColor: "#10B981",
              color: "white",
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const handleOpenCreate = async () => {
    setEditingItem(null);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    const initialProdiId = isKaprodi ? lockedProdiId : "";

    setSelectedFormProdiId(initialProdiId);
    setSelectedFormMkId("");

    form.setFieldsValue({
      prodi_id: initialProdiId,
      mk_id: undefined as any,
      cpl_id: undefined as any,
      kode_cpmk: "",
      deskripsi: "",
    });
  };

  const handleOpenEdit = async (record: CpmkItem) => {
    setEditingItem(record);
    setModalOpen(true);
    form.resetFields();

    const lockedProdiId = await loadFormOptions();

    const initialProdiId = isKaprodi
      ? lockedProdiId || record.prodi_id
      : record.prodi_id;

    setSelectedFormProdiId(initialProdiId);
    setSelectedFormMkId(record.mk_id);

    form.setFieldsValue({
      prodi_id: initialProdiId,
      mk_id: record.mk_id,
      cpl_id: record.cpl_id,
      kode_cpmk: record.kode_cpmk,
      deskripsi: record.deskripsi,
    });
  };

  useEffect(() => {
    if (addTrigger !== lastAddTriggerRef.current) {
      lastAddTriggerRef.current = addTrigger;
      handleOpenCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTrigger]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: CpmkPayload = {
        mk_id: values.mk_id,
        cpl_id: values.cpl_id,
        kode_cpmk: values.kode_cpmk,
        deskripsi: values.deskripsi,
      };

      setSaving(true);

      if (editingItem) {
        await updateCpmk(editingItem.cpmk_id, payload);
        messageApi.success("CPMK berhasil diperbarui");
      } else {
        await postCpmk(payload);
        messageApi.success("CPMK berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      await loadData();
    } catch (error: any) {
      if (error?.errorFields) return;

      console.error("Error submit CPMK:", error);
      messageApi.error("Gagal menyimpan CPMK");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: CpmkItem) => {
    try {
      await deleteCpmk(record.cpmk_id);
      messageApi.success("CPMK berhasil dihapus");
      await loadData();
    } catch (error) {
      console.error("Error delete CPMK:", error);
      messageApi.error("Gagal menghapus CPMK");
    }
  };

  const wrapTextStyle: React.CSSProperties = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.5,
  };

  const columns: ColumnsType<CpmkItem> = [
    {
      title: "Prodi",
      dataIndex: "nama_prodi",
      key: "nama_prodi",
      width: 170,
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Mata Kuliah",
      dataIndex: "nama_mk",
      key: "nama_mk",
      width: 210,
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "CPL Terkait",
      dataIndex: "nama_cpl",
      key: "nama_cpl",
      width: 120,
      render: (value: string) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: "Kode CPMK",
      dataIndex: "kode_cpmk",
      key: "kode_cpmk",
      width: 120,
      render: (value: string) => <b>{value}</b>,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Bobot",
      dataIndex: "bobot",
      key: "bobot",
      width: 90,
      align: "center",
      render: (value: number) => <Tag color="blue">{value}</Tag>,
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
            title="Hapus CPMK?"
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
      {contextHolder}
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
      <Table<GroupedCpmkItem>
        rowKey="groupKey"
        columns={groupedColumns}
        dataSource={searchedData}
        loading={loading}
        pagination={{ pageSize: 10 }}
        tableLayout="fixed"
        size="small"
        expandable={{
          expandedRowKeys,
          showExpandColumn: false,
          expandedRowRender: (record) => (
            <ConfigProvider theme={{ inherit: false, components: { Table: {} } }}>
              <Table<CpmkItem>
                rowKey="cpmk_id"
                columns={detailColumns}
                dataSource={record.items}
                pagination={false}
                tableLayout="fixed"
                size="small"
              />
            </ConfigProvider>
          ),
        }}
      />
      </ConfigProvider>
      <Modal
        open={modalOpen}
        forceRender
        title={editingItem ? "Edit CPMK" : "Tambah CPMK"}
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
                setSelectedFormMkId("");

                form.setFieldsValue({
                  mk_id: undefined as any,
                  cpl_id: undefined as any,
                });
              }}
            />
          </Form.Item>

          <Form.Item
            label="Mata Kuliah"
            name="mk_id"
            rules={[{ required: true, message: "Mata kuliah wajib dipilih" }]}
          >
            <Select
              placeholder={
                selectedFormProdiId
                  ? "Pilih mata kuliah"
                  : "Pilih prodi terlebih dahulu"
              }
              disabled={!selectedFormProdiId}
              options={filteredMkList.map((mk) => ({
                label: `${mk.kode_mk} - ${mk.nama_mk_id}`,
                value: mk.mk_id,
              }))}
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                setSelectedFormMkId(value);
                form.setFieldsValue({
                  cpl_id: undefined as any,
                });
              }}
            />
          </Form.Item>

          <Form.Item
            label="CPL"
            name="cpl_id"
            rules={[{ required: true, message: "CPL wajib dipilih" }]}
          >
            <Select
              placeholder={
                selectedFormMkId
                  ? "Pilih CPL"
                  : "Pilih mata kuliah terlebih dahulu"
              }
              disabled={!selectedFormMkId}
              options={filteredCplList.map((cpl) => ({
                label: `${cpl.kode_cpl} - ${cpl.deskripsi}`,
                value: cpl.cpl_id,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Kode CPMK"
            name="kode_cpmk"
            rules={[{ required: true, message: "Kode CPMK wajib diisi" }]}
          >
            <Input placeholder="Contoh: CPMK-01" />
          </Form.Item>

          <Form.Item
            label="Deskripsi CPMK"
            name="deskripsi"
            rules={[{ required: true, message: "Deskripsi CPMK wajib diisi" }]}
          >
            <Input.TextArea rows={4} placeholder="Masukkan deskripsi CPMK" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}