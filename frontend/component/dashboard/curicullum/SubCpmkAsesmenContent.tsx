"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  message,
  ConfigProvider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import CardNoTab from "@/component/CardNoTab";

import type { CpmkItem } from "@/service/cpmk";
import { fetchProdi, ProdiItem } from "@/service/prodi";
import { fetchMk, MkItem } from "@/service/mk";
import { fetchCpmk, CpmkItem as CpmkOptionItem } from "@/service/cpmk";

import {
  fetchSubcpmk,
  postSubcpmk,
  updateSubcpmk,
  deleteSubcpmk,
  SubcpmkItem,
  SubcpmkPayload,
} from "@/service/subcpmk";

import {
  fetchAsesmen,
  postAsesmen,
  updateAsesmen,
  deleteAsesmen,
  AsesmenItem,
  AsesmenPayload,
} from "@/service/asesmen";

type Props = {
  cpmkId: string;
};

type TableRow = {
  key: string;
  subcpmk_id: string;
  asesmen_id?: string;
  cpmk_id: string;
  mk_id?: string;
  prodi_id?: string;
  kode_subcpmk: string;
  deskripsi_subcpmk: string;
  nama_asesmen?: string;
  teknik_penilaian?: string;
  deskripsi_tugas?: string;
  bobot?: number;
};

type FormValues = {
  prodi_id: string;
  mk_id: string;
  cpmk_id: string;
  kode_subcpmk: string;
  deskripsi_subcpmk: string;
  nama_asesmen: string;
  teknik_penilaian: string;
  deskripsi_tugas: string;
  bobot: number;
};

const teknikPenilaianOptions = [
  "Partisipasi (Quiz)",
  "Observasi (Praktik/Tugas)",
  "Tes Tulisan (UTS)",
  "Tes Tulisan (UAS)",
  "Unjuk Kerja (Presentasi Proyek)",
  "Analisis Partisipatif",
  "Tes Lisan (Tugas Kelompok)",
].map((item) => ({
  label: item,
  value: item,
}));

export default function SubCpmkAsesmenContent({ cpmkId }: Props) {
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedCpmk, setSelectedCpmk] = useState<CpmkItem | null>(null);

  const [subcpmkList, setSubcpmkList] = useState<SubcpmkItem[]>([]);
  const [asesmenList, setAsesmenList] = useState<AsesmenItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [mkList, setMkList] = useState<MkItem[]>([]);
  const [cpmkList, setCpmkList] = useState<CpmkOptionItem[]>([]);

  const [selectedFormProdiId, setSelectedFormProdiId] = useState("");
  const [selectedFormMkId, setSelectedFormMkId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`selectedCpmk:${cpmkId}`);

    if (stored) {
      try {
        setSelectedCpmk(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse selected CPMK:", error);
      }
    }
  }, [cpmkId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [subcpmkRes, asesmenRes] = await Promise.all([
        fetchSubcpmk(),
        fetchAsesmen(),
      ]);

      setSubcpmkList(subcpmkRes.filter((item) => item.cpmk_id === cpmkId));
      setAsesmenList(asesmenRes);
    } catch (error) {
      console.error("Error load SubCPMK & Asesmen:", error);
      messageApi.error("Gagal mengambil data SubCPMK & Asesmen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cpmkId]);

  const tableData = useMemo<TableRow[]>(() => {
    const rows = subcpmkList.reduce<TableRow[]>((acc, sub) => {
      const asesmens = asesmenList.filter(
        (item) => item.subcpmk_id === sub.subcpmk_id
      );

      if (asesmens.length === 0) {
        acc.push({
          key: `${sub.subcpmk_id}-no-asesmen`,
          subcpmk_id: sub.subcpmk_id,
          cpmk_id: sub.cpmk_id,
          mk_id: sub.mk_id,
          prodi_id: sub.prodi_id,
          kode_subcpmk: sub.kode_subcpmk,
          deskripsi_subcpmk: sub.deskripsi,
          nama_asesmen: undefined,
          teknik_penilaian: undefined,
          deskripsi_tugas: undefined,
          bobot: sub.bobot,
        });

        return acc;
      }

      asesmens.forEach((asesmen) => {
        acc.push({
          key: `${sub.subcpmk_id}-${asesmen.asesmen_id}`,
          subcpmk_id: sub.subcpmk_id,
          asesmen_id: asesmen.asesmen_id,
          cpmk_id: sub.cpmk_id,
          mk_id: sub.mk_id,
          prodi_id: sub.prodi_id,
          kode_subcpmk: sub.kode_subcpmk,
          deskripsi_subcpmk: sub.deskripsi,
          nama_asesmen: asesmen.nama_asesmen,
          teknik_penilaian: asesmen.teknik_penilaian,
          deskripsi_tugas: asesmen.deskripsi,
          bobot: asesmen.bobot,
        });
      });

      return acc;
    }, []);

    return rows.sort((a, b) =>
      a.kode_subcpmk.localeCompare(b.kode_subcpmk, undefined, { numeric: true })
    );
  }, [subcpmkList, asesmenList]);

  const loadFormOptions = async () => {
    try {
      setFormLoading(true);

      const [prodiRes, mkRes, cpmkRes] = await Promise.all([
        fetchProdi(),
        fetchMk(),
        fetchCpmk(),
      ]);

      setProdiList(prodiRes);
      setMkList(mkRes);
      setCpmkList(cpmkRes);
    } catch (error) {
      console.error("Error load form options:", error);
      messageApi.error("Gagal mengambil data form");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredMkList = useMemo(() => {
    if (!selectedFormProdiId) return [];

    return mkList.filter((mk) => mk.prodi_id === selectedFormProdiId);
  }, [mkList, selectedFormProdiId]);

  const filteredCpmkList = useMemo(() => {
    if (!selectedFormMkId) return [];

    return cpmkList.filter((cpmk) => cpmk.mk_id === selectedFormMkId);
  }, [cpmkList, selectedFormMkId]);



  const handleOpenCreate = async () => {
    setEditingItem(null);
    setModalOpen(true);
    form.resetFields();

    await loadFormOptions();

    const initialProdiId = selectedCpmk?.prodi_id ?? "";
    const initialMkId = selectedCpmk?.mk_id ?? "";
    const initialCpmkId = selectedCpmk?.cpmk_id ?? cpmkId;

    setSelectedFormProdiId(initialProdiId);
    setSelectedFormMkId(initialMkId);

    form.setFieldsValue({
      prodi_id: initialProdiId,
      mk_id: initialMkId,
      cpmk_id: initialCpmkId,
      kode_subcpmk: "",
      deskripsi_subcpmk: "",
      nama_asesmen: "",
      teknik_penilaian: undefined as any,
      deskripsi_tugas: "",
      bobot: 0,
    });
  };

  const handleOpenEdit = async (record: TableRow) => {
    setEditingItem(record);
    setModalOpen(true);
    form.resetFields();

    await loadFormOptions();

    const initialProdiId =
      record.prodi_id ?? selectedCpmk?.prodi_id ?? "";
    const initialMkId = record.mk_id ?? selectedCpmk?.mk_id ?? "";

    setSelectedFormProdiId(initialProdiId);
    setSelectedFormMkId(initialMkId);

    form.setFieldsValue({
      prodi_id: initialProdiId,
      mk_id: initialMkId,
      cpmk_id: record.cpmk_id,
      kode_subcpmk: record.kode_subcpmk,
      deskripsi_subcpmk: record.deskripsi_subcpmk,
      nama_asesmen: record.nama_asesmen ?? "",
      teknik_penilaian: record.teknik_penilaian ?? undefined,
      deskripsi_tugas: record.deskripsi_tugas ?? "",
      bobot: Number(record.bobot ?? 0),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const subcpmkPayload: SubcpmkPayload = {
        cpmk_id: values.cpmk_id,
        kode_subcpmk: values.kode_subcpmk,
        deskripsi: values.deskripsi_subcpmk,
      };

      const asesmenPayloadBase = {
        nama_asesmen: values.nama_asesmen,
        deskripsi: values.deskripsi_tugas,
        bobot: Number(values.bobot),
        teknik_penilaian: values.teknik_penilaian,
      };

      setSaving(true);

      if (editingItem) {
        await updateSubcpmk(editingItem.subcpmk_id, subcpmkPayload);

        const asesmenPayload: AsesmenPayload = {
          subcpmk_id: editingItem.subcpmk_id,
          ...asesmenPayloadBase,
        };

        if (editingItem.asesmen_id) {
          await updateAsesmen(editingItem.asesmen_id, asesmenPayload);
        } else {
          await postAsesmen(asesmenPayload);
        }

        messageApi.success("SubCPMK & Asesmen berhasil diperbarui");
      } else {
        const newSubcpmk = await postSubcpmk(subcpmkPayload);

        if (!newSubcpmk || !newSubcpmk.subcpmk_id) {
          messageApi.warning(
            "SubCPMK berhasil dibuat, tetapi ID SubCPMK belum ditemukan untuk membuat asesmen."
          );
          await loadData();
          return;
        }

        await postAsesmen({
          subcpmk_id: newSubcpmk.subcpmk_id,
          ...asesmenPayloadBase,
        });

        messageApi.success("SubCPMK & Asesmen berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
      await loadData();
    } catch (error: any) {
      if (error?.errorFields) return;

      console.error("Error submit SubCPMK & Asesmen:", error);
      messageApi.error("Gagal menyimpan SubCPMK & Asesmen");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: TableRow) => {
    try {
      if (record.asesmen_id) {
        await deleteAsesmen(record.asesmen_id);
      }

      await deleteSubcpmk(record.subcpmk_id);

      messageApi.success("SubCPMK & Asesmen berhasil dihapus");
      await loadData();
    } catch (error) {
      console.error("Error delete SubCPMK & Asesmen:", error);
      messageApi.error("Gagal menghapus SubCPMK & Asesmen");
    }
  };

  const wrapTextStyle: React.CSSProperties = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.5,
  };

  const columns: ColumnsType<TableRow> = [
    {
      title: "Kode SubCPMK",
      dataIndex: "kode_subcpmk",
      key: "kode_subcpmk",
      width: 130,
      sorter: (a, b) => a.kode_subcpmk.localeCompare(b.kode_subcpmk, undefined, { numeric: true }),
      render: (value: string) => <b>{value}</b>,
    },
    {
      title: "Deskripsi SubCPMK",
      dataIndex: "deskripsi_subcpmk",
      key: "deskripsi_subcpmk",
      render: (value: string) => <div style={wrapTextStyle}>{value}</div>,
    },
    {
      title: "Nama Asesmen",
      dataIndex: "nama_asesmen",
      key: "nama_asesmen",
      width: 160,
      render: (value?: string) => value || "-",
    },
    {
      title: "Teknik Penilaian",
      dataIndex: "teknik_penilaian",
      key: "teknik_penilaian",
      width: 190,
      render: (value?: string) => value || "-",
    },
    {
      title: "Deskripsi Tugas",
      dataIndex: "deskripsi_tugas",
      key: "deskripsi_tugas",
      render: (value?: string) =>
        value ? <div style={wrapTextStyle}>{value}</div> : "-",
    },
    {
      title: "Bobot",
      dataIndex: "bobot",
      key: "bobot",
      width: 90,
      align: "center",
      render: (value?: number) => <Tag color="blue">{value ?? 0}</Tag>,
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Button
            size="small"
            onClick={() => handleOpenEdit(record)}
            style={{ backgroundColor: "#F59E0B", color: "white" }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Hapus SubCPMK & Asesmen?"
            description="Data yang dihapus tidak dapat dikembalikan."
            okText="Hapus"
            cancelText="Batal"
            onConfirm={() => handleDelete(record)}
          >
            <Button
              size="small"
              danger
              style={{ backgroundColor: "#EF4444", color: "white" }}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      {contextHolder}
      <CardNoTab
        headerContent={
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  Detail SubCPMK & Asesmen
                </div>

                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  {selectedCpmk?.kode_cpmk && (
                    <Tag
                      style={{
                        backgroundColor: "#F0F7FC",
                        border: "1px solid #B1D4EC",
                        color: "#015E9D",
                      }}
                    >
                      {selectedCpmk.kode_cpmk}
                    </Tag>
                  )}
                  {selectedCpmk?.nama_cpl && (
                    <Tag
                      style={{
                        backgroundColor: "#F0F7FC",
                        border: "1px solid #B1D4EC",
                        color: "#015E9D",
                      }}
                    >
                      {selectedCpmk.nama_cpl}
                    </Tag>
                  )}
                  {selectedCpmk?.nama_mk && (
                    <Tag
                      style={{
                        backgroundColor: "#F0F7FC",
                        border: "1px solid #B1D4EC",
                        color: "#015E9D",
                      }}
                    >
                      {selectedCpmk.nama_mk}
                    </Tag>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreate}
                  style={{ backgroundColor: "#59D4A2" }}
                >
                  Tambah Data
                </Button>

                <Button onClick={() => router.push("/curicullum?tab=cpmk")}>Kembali</Button>
              </div>
            </div>
          </div>
        }
      >
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
            <Table<TableRow>
              rowKey="key"
              columns={columns}
              dataSource={tableData}
              loading={loading}
              pagination={false}
              tableLayout="fixed"
              size="small"
            />
          </ConfigProvider>
        </div>

        <Modal
          open={modalOpen}
          forceRender
          title={
            editingItem
              ? "Edit SubCPMK & Asesmen"
              : "Tambah SubCPMK & Asesmen"
          }
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
                    cpmk_id: undefined as any,
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
                    cpmk_id: undefined as any,
                  });
                }}
              />
            </Form.Item>

            <Form.Item
              label="CPMK"
              name="cpmk_id"
              rules={[{ required: true, message: "CPMK wajib dipilih" }]}
            >
              <Select
                placeholder={
                  selectedFormMkId
                    ? "Pilih CPMK"
                    : "Pilih mata kuliah terlebih dahulu"
                }
                disabled={!selectedFormMkId}
                options={filteredCpmkList.map((cpmk) => ({
                  label: `${cpmk.kode_cpmk} - ${cpmk.deskripsi}`,
                  value: cpmk.cpmk_id,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              label="Kode SubCPMK"
              name="kode_subcpmk"
              rules={[{ required: true, message: "Kode SubCPMK wajib diisi" }]}
            >
              <Input placeholder="Contoh: SCPMK01" />
            </Form.Item>

            <Form.Item
              label="Deskripsi SubCPMK"
              name="deskripsi_subcpmk"
              rules={[
                { required: true, message: "Deskripsi SubCPMK wajib diisi" },
              ]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              label="Nama Asesmen"
              name="nama_asesmen"
              rules={[{ required: true, message: "Nama asesmen wajib diisi" }]}
            >
              <Input placeholder="Contoh: UAS" />
            </Form.Item>

            <Form.Item
              label="Teknik Penilaian"
              name="teknik_penilaian"
              rules={[
                { required: true, message: "Teknik penilaian wajib dipilih" },
              ]}
            >
              <Select
                placeholder="Pilih teknik penilaian"
                options={teknikPenilaianOptions}
              />
            </Form.Item>

            <Form.Item
              label="Deskripsi Tugas"
              name="deskripsi_tugas"
              rules={[
                { required: true, message: "Deskripsi tugas wajib diisi" },
              ]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              label="Bobot"
              name="bobot"
              rules={[{ required: true, message: "Bobot wajib diisi" }]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>
      </CardNoTab>
    </div>
  );
}