"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, message, Modal, Form, Select } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import DekanFirstCard from "@/component/CntCard";
import StudentTable from "@/component/StudentTable";
import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import { buildFilterGroups, FilterOption, SelectedFilters } from "@/config/filterpresets";
import { fetchProdi, ProdiItem } from "@/service/prodi";
import { fetchMahasiswaFiltered, Mahasiswa, postMahasiswa, updateMahasiswa } from "@/service/student";

const PRODI_CONFIG = {
  tif: { id: "iOsR1pcAsSDRusMYFRVY", name: "Teknik Informatika" },
  tpl: { id: "87hvhJDOZFf9dHffxfLY", name: "Teknik Perangkat Lunak" },
  si: { id: "O1ZyEABQkHRhPJrREyUS", name: "Sistem Informasi" },
} as const;

type ProdiTabKey = keyof typeof PRODI_CONFIG;

export default function AdminStudent() {
  const [activeTab, setActiveTab] = useState<ProdiTabKey>("tif");
  const [selectedPeriodeLabel, setSelectedPeriodeLabel] = useState("Pilih Periode");
  const [selectedPeriodeYear, setSelectedPeriodeYear] = useState<string | undefined>(undefined);
  const [periodeYearOptions, setPeriodeYearOptions] = useState<FilterOption[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [addTrigger, setAddTrigger] = useState(0);

  const [prodiOptions, setProdiOptions] = useState<FilterOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mahasiswa | null>(null);
  const [form] = Form.useForm<any>();
  const [formLoading, setFormLoading] = useState(false);

  const activeProdi = PRODI_CONFIG[activeTab];

  const filterGroups = useMemo(() => buildFilterGroups("filter1", { periodeYearOptions }), [periodeYearOptions]);

  // Load prodi options
  useEffect(() => {
    const loadProdiOptions = async () => {
      try {
        const prodiList: ProdiItem[] = await fetchProdi();
        setProdiOptions(prodiList.map(p => ({ label: p.nama_prodi, value: p.prodi_id })));
      } catch (error) {
        message.error("Gagal memuat data prodi");
        console.error(error);
      }
    };
    loadProdiOptions();
  }, []);

  const handleAddMahasiswa = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ prodi_id: activeProdi.id });
    setModalOpen(true);
  };

  const handleEditMahasiswa = (mahasiswa: Mahasiswa) => {
    setEditingItem(mahasiswa);
    form.setFieldsValue({
      nama: mahasiswa.nama,
      nim: mahasiswa.nim,
      angkatan: mahasiswa.angkatan,
      prodi_id: mahasiswa.prodi_id,
    });
    setModalOpen(true);
  };

  const handleApplyFilter = (filters: SelectedFilters) => {
    setSelectedFilters(filters);
    setFilterOpen(false);

    const tahunSelected = filters.tahun ?? [];
    if (tahunSelected.length > 0) {
      const min = Math.min(...tahunSelected.map(Number));
      const max = Math.max(...tahunSelected.map(Number));
      setSelectedPeriodeLabel(min === max ? `${min}` : `${min}-${max}`);
    } else {
      setSelectedPeriodeLabel("Pilih Periode");
    }
  };

  const handleRemoveFilterTag = (groupKey: string, value: string) => {
    setSelectedFilters(prev => {
      const remaining = (prev[groupKey] ?? []).filter(v => v !== value);
      const updated = { ...prev, [groupKey]: remaining };

      if (groupKey === "tahun") {
        if (remaining.length > 0) {
          const min = Math.min(...remaining.map(Number));
          const max = Math.max(...remaining.map(Number));
          setSelectedPeriodeLabel(min === max ? `${min}` : `${min}-${max}`);
        } else {
          setSelectedPeriodeLabel("Pilih Periode");
        }
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);

      if (editingItem) {
        await updateMahasiswa(editingItem.mahasiswa_id, values);
        message.success("Mahasiswa berhasil diperbarui");
      } else {
        await postMahasiswa(values);
        message.success("Mahasiswa berhasil ditambahkan");
      }

      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
    } catch (error) {
      console.error(error);
      message.error("Gagal menyimpan mahasiswa");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="w-full" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <DekanFirstCard
        activeTabKey={activeTab}
        onTabChange={key => setActiveTab(key as ProdiTabKey)}
        headerContent={
          <div>
            <div className="flex flex-row gap-2 pb-2">
              <div className="gap-2 flex w-full">
                <PeriodeList
                  value={selectedPeriodeYear}
                  onChange={(periode, label, yearOptions) => {
                    setSelectedPeriodeYear(periode.periode_id);
                    setSelectedPeriodeLabel(label); 
                    setPeriodeYearOptions(yearOptions);
                    setSelectedFilters(prev => ({ ...prev, tahun: yearOptions.map(o => o.value) }));
                  }}
                />
                <Button icon={<PlusOutlined />} onClick={() => setFilterOpen(true)}>
                  Filter
                </Button>
                <Input
                  style={{ width: "30%" }}
                  placeholder="Cari NIM / Nama"
                  prefix={<SearchOutlined />}
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>

            <SelectedFilterTags
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onRemove={handleRemoveFilterTag}
              maxVisible={5}
            />

            <FilterModal
              open={filterOpen}
              title="Filter Mahasiswa"
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onCancel={() => setFilterOpen(false)}
              onApply={handleApplyFilter}
            />
          </div>
        }
      >
        <StudentTable
          role="dekan"
          prodiId={activeProdi.id}
          angkatanList={selectedFilters.tahun ?? []}
          searchKeyword={searchKeyword}
        />
      </DekanFirstCard>

      <Modal
        open={modalOpen}
        title={editingItem ? "Edit Mahasiswa" : "Tambah Mahasiswa"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingItem ? "Simpan Perubahan" : "Tambah"}
        cancelText="Batal"
        confirmLoading={formLoading}
      >
        <Form form={form} layout="vertical" disabled={formLoading}>
          <Form.Item label="Nama Lengkap" name="nama" rules={[{ required: true, message: "Nama wajib diisi" }]}>
            <Input placeholder="Nama Lengkap" />
          </Form.Item>

          <Form.Item label="NIM" name="nim" rules={[{ required: true, message: "NIM wajib diisi" }]}>
            <Input placeholder="Contoh: 2023001" />
          </Form.Item>

          <Form.Item label="Angkatan" name="angkatan" rules={[{ required: true, message: "Angkatan wajib diisi" }]}>
            <Input placeholder="Contoh: 2025" />
          </Form.Item>

          <Form.Item label="Prodi" name="prodi_id" rules={[{ required: true, message: "Prodi wajib diisi" }]}>
            <Select options={prodiOptions} placeholder="Pilih prodi" showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}