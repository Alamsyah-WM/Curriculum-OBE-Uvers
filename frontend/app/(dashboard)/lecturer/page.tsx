"use client";

import React, { useEffect, useState, useMemo } from "react";
import CardNoTab from "@/component/CardNoTab";
import { Table, Button, Modal, Form, Input, Select, Checkbox, message, Popconfirm, ConfigProvider } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { fetchDosen, DosenItem, deleteDosen, postDosen, updateDosen } from "@/service/dosen";
import { fetchProdi, ProdiItem } from "@/service/prodi";
import { fetchPeriode, PeriodeItem, formatPeriode } from "@/service/periode";

type FormValues = {
  nama_dosen: string;
  nidn: string;
  email: string;
  password?: string;
  prodi_id: string;
  periode_id?: string;
  angkatan?: number;
  roles: string[];
};

export default function Lecturer() {
  const [data, setData] = useState<DosenItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DosenItem | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [formLoading, setFormLoading] = useState(false);

  const [prodiOptions, setProdiOptions] = useState<ProdiItem[]>([]);
  const [periodeOptions, setPeriodeOptions] = useState<PeriodeItem[]>([]);
  const [angkatanOptions, setAngkatanOptions] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Load data Dosen
  const loadDosen = async () => {
    try {
      setLoading(true);
      const res = await fetchDosen();
      setData(res);
    } catch (err) {
      console.error(err);
      message.error("Gagal memuat data dosen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDosen();
    fetchProdi().then(setProdiOptions);
    fetchPeriode().then(setPeriodeOptions);
  }, []);

  // Handle open modal
  const handleOpenModal = (dosen?: DosenItem) => {
    setEditingItem(dosen ?? null);
    setModalOpen(true);
    form.resetFields();

    if (dosen) {
      form.setFieldsValue({
        nama_dosen: dosen.nama_dosen,
        nidn: dosen.nidn,
        email: dosen.email,
        password: "",
        prodi_id: dosen.prodi_id,
        periode_id: dosen.periode_id || undefined,
        angkatan: dosen.angkatan || undefined,
        roles: dosen.roles ?? [],
      });

      if (dosen.periode_id) {
        const periode = periodeOptions.find(p => p.periode_id === dosen.periode_id);
        if (periode) {
          setAngkatanOptions(generateAngkatanList(periode));
        }
      } else {
        setAngkatanOptions([]);
      }
    } else {
      setAngkatanOptions([]);
    }
  };

  const generateAngkatanList = (periode: PeriodeItem) => {
    const list: number[] = [];
    for (let y = periode.tahun_mulai; y <= periode.tahun_selesai; y++) {
      list.push(y);
    }
    return list;
  };

  // Handle periode change in form
  const handlePeriodeChange = (periode_id: string) => {
    form.setFieldsValue({ angkatan: undefined });
    const periode = periodeOptions.find(p => p.periode_id === periode_id);
    if (periode) {
      setAngkatanOptions(generateAngkatanList(periode));
    } else {
      setAngkatanOptions([]);
    }
  };

    const handleSubmit = async () => {
        try {
            const formValues = await form.validateFields();
            setFormLoading(true);

            // map ke tipe Dosen payload
            const payload = {
            nama_dosen: formValues.nama_dosen,
            nidn: formValues.nidn,
            email: formValues.email,
            password: formValues.password ?? "", // wajib ada field password
            prodi_id: formValues.prodi_id,
            periode_id: formValues.periode_id || null,
            angkatan: formValues.angkatan ? Number(formValues.angkatan) : null,
            roles: formValues.roles ?? [],
            };

            if (editingItem) {
            await updateDosen(editingItem.dosen_id, payload);
            message.success("Dosen berhasil diperbarui");
            } else {
            await postDosen(payload);
            message.success("Dosen berhasil ditambahkan");
            }

            setModalOpen(false);
            setEditingItem(null);
            form.resetFields();
        } catch (error) {
            console.error(error);
            message.error("Gagal menyimpan dosen");
        } finally {
            setFormLoading(false);
        }
    };

  const handleDelete = async (dosen_id: string) => {
    try {
      await deleteDosen(dosen_id);
      message.success("Dosen berhasil dihapus");
      await loadDosen();
    } catch (err) {
      console.error(err);
      message.error("Gagal menghapus dosen");
    }
  };

  const columns = [
    { title: "Nama Dosen", dataIndex: "nama_dosen", key: "nama_dosen" },
    { title: "NIDN", dataIndex: "nidn", key: "nidn" },
    { title: "Prodi", dataIndex: "nama_prodi", key: "nama_prodi" },
    { title: "Role", dataIndex: "roles", key: "roles", render: (roles: string[]) => roles.join(", ") },
    { title: "Status Wali", dataIndex: "dosenWali", key: "dosenWali", render: (val: boolean) => val ? "Ya" : "Tidak" },
    {
      title: "Aksi",
      key: "aksi",
      width: 220,
      render: (_: any, record: DosenItem) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="small" style={{ backgroundColor: "#F59E0B", color: "white" }} onClick={() => handleOpenModal(record)}>Edit</Button>
          <Popconfirm title="Hapus Dosen?" onConfirm={() => handleDelete(record.dosen_id)} okText="Hapus" cancelText="Batal">
            <Button size="small" style={{ backgroundColor: "#EF4444", color: "white" }}>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Filter data by search
  const filteredData = useMemo(() => {
    let result = data;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(d => d.nama_dosen.toLowerCase().includes(kw) || d.nidn.toLowerCase().includes(kw));
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
                placeholder="Cari Nama / NIDN"
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
              />
              <Button type="primary" style={{ backgroundColor: "#59D4A2", color: "white" }} icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                Tambah Dosen
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
            ><Table<DosenItem>
          rowKey="dosen_id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </ConfigProvider></CardNoTab>

      {/* Modal Form Dosen */}
      <Modal
        open={modalOpen}
        title={editingItem ? "Edit Dosen" : "Tambah Dosen"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingItem ? "Simpan Perubahan" : "Tambah"}
        cancelText="Batal"
        confirmLoading={formLoading}
      >
        <Form form={form} layout="vertical" disabled={formLoading}>
          <Form.Item label="Nama Dosen" name="nama_dosen" rules={[{ required: true, message: "Nama dosen wajib diisi" }]}>
            <Input placeholder="Masukkan nama dosen" />
          </Form.Item>

          <Form.Item label="NIDN" name="nidn" rules={[{ required: true, message: "NIDN wajib diisi" }]}>
            <Input placeholder="Masukkan NIDN" />
          </Form.Item>

          <Form.Item label="Email Login" name="email" rules={[{ required: true, message: "Email wajib diisi" }, { type: "email", message: "Email tidak valid" }]}>
            <Input placeholder="Masukkan email dosen" />
          </Form.Item>

          <Form.Item label="Password" name="password" rules={editingItem ? [] : [{ required: true, message: "Password wajib diisi" }]}>
            <Input.Password placeholder="Masukkan password" />
          </Form.Item>

          <Form.Item label="Prodi" name="prodi_id" rules={[{ required: true, message: "Prodi wajib dipilih" }]}>
            <Select placeholder="Pilih prodi" options={prodiOptions.map(p => ({ label: p.nama_prodi, value: p.prodi_id }))} />
          </Form.Item>

          <Form.Item label="Periode" name="periode_id">
            <Select placeholder="Pilih periode" options={periodeOptions.map(p => ({ label: formatPeriode(p), value: p.periode_id }))} onChange={handlePeriodeChange} allowClear />
          </Form.Item>

          <Form.Item label="Angkatan" name="angkatan">
            <Select placeholder="Pilih angkatan" options={angkatanOptions.map(y => ({ label: y, value: y }))} disabled={angkatanOptions.length === 0} allowClear />
          </Form.Item>

          <Form.Item label="Roles" name="roles">
            <Checkbox.Group options={["dekan", "kaprodi", "dosen"]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}