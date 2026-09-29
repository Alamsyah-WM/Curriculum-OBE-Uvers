// component/dashboard/asesmen/AsesmenTranskripView.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Select, Spin, Empty, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { fetchMahasiswa, Mahasiswa } from "@/service/student";
import StudentTranskripView from "../student/StudentTranskripView";
import CardNoTab from "@/component/CardNoTab";
import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import {
  buildFilterGroups,
  FilterOption,
  SelectedFilters,
} from "@/config/filterpresets";

type Props = {
  mkId: string;
  prodiId: string;
};

export default function AsesmenTranskripView({ mkId, prodiId }: Props) {
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>();
  const [selectedPeriodeLabel, setSelectedPeriodeLabel] = useState<string>("Pilih Periode");
  const [periodeYearOptions, setPeriodeYearOptions] = useState<FilterOption[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  const filterGroups = useMemo(() => {
    // Gunakan filter1 yang hanya berisi periodeGroup (tahun)
    return buildFilterGroups("filter1", { periodeYearOptions });
  }, [periodeYearOptions]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const allStudents = await fetchMahasiswa();
        // Filter mahasiswa yang mengambil matakuliah ini
        const enrolled = allStudents.filter(
          (m) => m.mk_ids && m.mk_ids.includes(mkId)
        );
        // Urutkan berdasarkan NIM
        enrolled.sort((a, b) => a.nim.localeCompare(b.nim));
        setStudents(enrolled);
      } catch (error) {
        console.error("Gagal memuat mahasiswa untuk transkrip:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mkId) {
      loadStudents();
    }
  }, [mkId]);

  // Filter list mahasiswa berdasarkan periode/angkatan yang terpilih
  const filteredStudents = useMemo(() => {
    let result = [...students];
    const angkatanList = selectedFilters.tahun ?? [];

    if (angkatanList.length > 0) {
      result = result.filter((m) => angkatanList.includes(String(m.angkatan)));
    }

    return result;
  }, [students, selectedFilters]);

  // Sync selectedStudentId jika list terfilter berubah
  useEffect(() => {
    if (filteredStudents.length > 0) {
      // Jika mahasiswa yang terpilih saat ini tidak ada di list terfilter, set ke yang pertama
      if (!filteredStudents.some((s) => s.mahasiswa_id === selectedStudentId)) {
        setSelectedStudentId(filteredStudents[0].mahasiswa_id);
      }
    } else {
      setSelectedStudentId(null);
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.mahasiswa_id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Handler saat filter tag dihapus
  const handleRemoveFilterTag = (groupKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const remaining = (prev[groupKey] ?? []).filter((v) => v !== value);
      const updated = { ...prev, [groupKey]: remaining };

      if (groupKey === "tahun") {
        if (remaining.length > 0) {
          const min = Math.min(...remaining.map(Number));
          const max = Math.max(...remaining.map(Number));
          setSelectedPeriodeLabel(min === max ? `${min}` : `${min}-${max}`);
          setSelectedPeriodeId(`${min}`);
        } else {
          setSelectedPeriodeLabel("Pilih Periode");
          setSelectedPeriodeId(undefined);
        }
      }

      return updated;
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 0",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <CardNoTab
        headerContent={
          <div>
            <div className="flex flex-row gap-2 pb-2">
              <div className="gap-2 flex w-full">
                <PeriodeList
                  defaultSelectFirst={false}
                  value={selectedPeriodeId}
                  onChange={(periode, label, yearOptions) => {
                    setSelectedPeriodeId(periode.periode_id);
                    setSelectedPeriodeLabel(label);
                    setPeriodeYearOptions(yearOptions);
                    setSelectedFilters((prev) => ({
                      ...prev,
                      tahun: [], // Kosongkan filter tahun saat periode baru dipilih
                    }));
                  }}
                />

                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setFilterOpen(true)}
                >
                  Filter
                </Button>

                <Select
                  showSearch
                  style={{ width: "30%", minWidth: 260 }}
                  placeholder="Cari NIM atau Nama Mahasiswa"
                  optionFilterProp="children"
                  value={selectedStudentId}
                  onChange={(val) => setSelectedStudentId(val)}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={filteredStudents.map((s) => ({
                    value: s.mahasiswa_id,
                    label: `${s.nim} - ${s.nama}`,
                  }))}
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
              title="Filter Periode Mahasiswa"
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onCancel={() => setFilterOpen(false)}
              onApply={(filters) => {
                setSelectedFilters(filters);
                setFilterOpen(false);

                // Update periode label saat filter diterapkan
                const tahunSelected = filters.tahun ?? [];
                if (tahunSelected.length > 0) {
                  const min = Math.min(...tahunSelected.map(Number));
                  const max = Math.max(...tahunSelected.map(Number));
                  setSelectedPeriodeLabel(min === max ? `${min}` : `${min}-${max}`);
                  setSelectedPeriodeId(`${min}`);
                } else {
                  setSelectedPeriodeLabel("Pilih Periode");
                  setSelectedPeriodeId(undefined);
                }
              }}
            />
          </div>
        }
      >
        {selectedStudent ? (
          <StudentTranskripView
            mahasiswaId={selectedStudent.mahasiswa_id}
            prodiId={selectedStudent.prodi_id || prodiId}
          />
        ) : (
          <Empty description="Pilih mahasiswa terlebih dahulu atau tidak ada mahasiswa yang sesuai dengan filter." />
        )}
      </CardNoTab>
    </div>
  );
}
