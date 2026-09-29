// component/dashboard/asesmen/AsesmenMahasiswa.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, InputNumber, Button, message, Spin, Tag, Space, Empty, ConfigProvider } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SaveOutlined } from "@ant-design/icons";
import { fetchMahasiswa, Mahasiswa } from "@/service/student";
import { fetchSubcpmk, SubcpmkItem } from "@/service/subcpmk";
import { fetchAsesmen, AsesmenItem } from "@/service/asesmen";
import { fetchNilaiByProdi, postNilai, NilaiItem } from "@/service/penilaian";

type Props = {
  role: string;
  mkId: string;
  prodiId: string;
  searchKeyword: string;
  angkatanList: string[];
  penilaianFilter: string[];
};

export default function AsesmenMahasiswa({
  role,
  mkId,
  prodiId,
  searchKeyword,
  angkatanList,
  penilaianFilter,
}: Props) {
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [subcpmkList, setSubcpmkList] = useState<SubcpmkItem[]>([]);
  const [asesmenList, setAsesmenList] = useState<AsesmenItem[]>([]);
  const [grades, setGrades] = useState<NilaiItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Menyimpan perubahan nilai lokal sebelum disimpan ke database
  // Format key: mahasiswaId_asesmenId
  const [editedValues, setEditedValues] = useState<Record<string, number | null>>({});

  const canEdit = role === "dosen" || role === "admin";

  const loadData = async () => {
    try {
      setLoading(true);
      const [mhsRes, subcpmkRes, asesmenRes, gradesRes] = await Promise.all([
        fetchMahasiswa(),
        fetchSubcpmk(),
        fetchAsesmen(),
        fetchNilaiByProdi(prodiId),
      ]);

      setStudents(mhsRes);
      setSubcpmkList(subcpmkRes);
      setAsesmenList(asesmenRes);
      setGrades(gradesRes);
    } catch (err) {
      console.error("Gagal memuat data AsesmenMahasiswa:", err);
      message.error("Gagal memuat data tabel asesmen mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mkId && prodiId) {
      loadData();
    }
  }, [mkId, prodiId]);

  // 1. Filter Sub-CPMK milik mata kuliah ini dan urutkan berdasarkan kodenya
  const courseSubcpmks = useMemo(() => {
    return subcpmkList
      .filter((s) => s.mk_id === mkId)
      .sort((a, b) =>
        a.kode_subcpmk.localeCompare(b.kode_subcpmk, undefined, { numeric: true })
      );
  }, [subcpmkList, mkId]);

  // 2. Filter Asesmen milik Sub-CPMK mata kuliah ini
  const courseSubcpmkIds = useMemo(() => {
    return courseSubcpmks.map((s) => s.subcpmk_id);
  }, [courseSubcpmks]);

  const courseAsesmens = useMemo(() => {
    return asesmenList.filter((a) => courseSubcpmkIds.includes(a.subcpmk_id));
  }, [asesmenList, courseSubcpmkIds]);

  // 3. Filter list Sub-CPMK berdasarkan Teknik Penilaian jika filter aktif
  const filteredSubcpmks = useMemo(() => {
    if (penilaianFilter.length === 0) {
      return courseSubcpmks;
    }

    const activeTechnique = penilaianFilter[0];
    // Ambil subcpmk_id yang memiliki asesmen dengan teknik ini
    const subcpmkWithMatchingAsesmen = courseAsesmens
      .filter((a) => a.teknik_penilaian === activeTechnique)
      .map((a) => a.subcpmk_id);

    return courseSubcpmks.filter((s) =>
      subcpmkWithMatchingAsesmen.includes(s.subcpmk_id)
    );
  }, [courseSubcpmks, courseAsesmens, penilaianFilter]);

  // 4. Filter Mahasiswa yang terdaftar di mata kuliah ini, prodi ini, dan angkatan / keyword
  const filteredStudents = useMemo(() => {
    let result = students.filter(
      (m) => m.mk_ids && m.mk_ids.includes(mkId)
    );

    if (angkatanList.length > 0) {
      result = result.filter((m) => angkatanList.includes(String(m.angkatan)));
    }

    if (searchKeyword.trim() !== "") {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        (m) =>
          m.nim.toLowerCase().includes(keyword) ||
          m.nama.toLowerCase().includes(keyword)
      );
    }

    return result.sort((a, b) => a.nim.localeCompare(b.nim));
  }, [students, mkId, angkatanList, searchKeyword]);

  // Mengubah nilai secara lokal
  const handleValChange = (mahasiswaId: string, asesmenId: string, value: number | null) => {
    setEditedValues((prev) => ({
      ...prev,
      [`${mahasiswaId}_${asesmenId}`]: value,
    }));
  };

  // Simpan nilai ke backend
  const handleSaveNilai = async (
    mahasiswaId: string,
    subcpmkId: string,
    asesmenId: string,
    value: number | null
  ) => {
    if (value === null || value === undefined) {
      message.warning("Nilai tidak boleh kosong");
      return;
    }

    // Cari cpmk_id dari subcpmkList
    const subcpmk = subcpmkList.find((s) => s.subcpmk_id === subcpmkId);
    const cpmkId = subcpmk ? subcpmk.cpmk_id : "";

    if (!cpmkId) {
      message.error("Gagal mencocokkan data CPMK");
      return;
    }

    const key = `${mahasiswaId}_${asesmenId}`;
    try {
      setSavingId(key);
      await postNilai({
        mahasiswa_id: mahasiswaId,
        mk_id: mkId,
        cpmk_id: cpmkId,
        subcpmk_id: subcpmkId,
        asesmen_id: asesmenId,
        nilai: value,
      });

      // Update local grades state agar UI terupdate tanpa full fetch
      setGrades((prev) => {
        const existingIndex = prev.findIndex(
          (g) => g.mahasiswa_id === mahasiswaId && g.asesmen_id === asesmenId
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            nilai: value,
          };
          return updated;
        } else {
          // Tambahkan baru
          return [
            ...prev,
            {
              id: "",
              cpmk_id: cpmkId,
              asesmen_id: asesmenId,
              mahasiswa_id: mahasiswaId,
              mk_id: mkId,
              subcpmk_id: subcpmkId,
              nilai: value,
              kode_mk: "",
              nama_mk: "",
              kode_subcpmk: subcpmk?.kode_subcpmk ?? "",
              nama_asesmen: "",
              updated_at: { _seconds: 0, _nanoseconds: 0 },
            },
          ];
        }
      });

      // Hapus dari daftar edit lokal
      setEditedValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      message.success("Nilai berhasil disimpan");
    } catch (err) {
      console.error("Gagal simpan nilai:", err);
      message.error("Gagal menyimpan nilai");
    } finally {
      setSavingId(null);
    }
  };

  // Membangun kolom tabel secara dinamis
  const columns: ColumnsType<Mahasiswa> = useMemo(() => {
    const baseCols: ColumnsType<Mahasiswa> = [
      {
        title: "NIM",
        dataIndex: "nim",
        key: "nim",
        width: 140,
        fixed: "left",
      },
      {
        title: "Nama Mahasiswa",
        dataIndex: "nama",
        key: "nama",
        width: 200,
        fixed: "left",
      },
    ];

    // Kolom dinamis untuk setiap Sub-CPMK yang difilter
    const scpmkCols: ColumnsType<Mahasiswa> = filteredSubcpmks.map((sub) => {
      // Cari asesmen yang termasuk dalam Sub-CPMK ini
      let asesmensForSub = courseAsesmens.filter(
        (a) => a.subcpmk_id === sub.subcpmk_id
      );

      // Jika ada filter teknik penilaian aktif, tampilkan asesmen dengan teknik tersebut saja
      if (penilaianFilter.length > 0) {
        asesmensForSub = asesmensForSub.filter(
          (a) => a.teknik_penilaian === penilaianFilter[0]
        );
      }

      return {
        title: `${sub.kode_subcpmk}`,
        key: sub.subcpmk_id,
        render: (_, student) => {
          if (asesmensForSub.length === 0) {
            return <span style={{ opacity: 0.45 }}>-</span>;
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {asesmensForSub.map((asm, index) => {
                const key = `${student.mahasiswa_id}_${asm.asesmen_id}`;

                // Ambil nilai dari DB
                const dbGrade = grades.find(
                  (g) =>
                    g.mahasiswa_id === student.mahasiswa_id &&
                    g.asesmen_id === asm.asesmen_id
                );
                const dbVal = dbGrade?.nilai ?? null;

                // Ambil nilai edit lokal jika ada
                const hasEditedVal = Object.prototype.hasOwnProperty.call(
                  editedValues,
                  key
                );
                const currentVal = hasEditedVal ? editedValues[key] : dbVal;

                const isSaving = savingId === key;
                const isChanged = hasEditedVal && currentVal !== dbVal;

                return (
                  <div
                    key={asm.asesmen_id}
                    style={{
                      paddingBottom:
                        index < asesmensForSub.length - 1 ? 8 : 0,
                      borderBottom:
                        index < asesmensForSub.length - 1
                          ? "1px solid #E2E8F0"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748B",
                        marginBottom: 4,
                      }}
                    >
                      {asm.nama_asesmen}{" "}
                      <span style={{ fontWeight: 600 }}>({asm.bobot}%)</span>
                    </div>

                    {canEdit ? (
                      <Space size={4}>
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: 80 }}
                          value={currentVal}
                          onChange={(val) =>
                            handleValChange(
                              student.mahasiswa_id,
                              asm.asesmen_id,
                              val
                            )
                          }
                          placeholder="-"
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<SaveOutlined />}
                          loading={isSaving}
                          onClick={() =>
                            handleSaveNilai(
                              student.mahasiswa_id,
                              sub.subcpmk_id,
                              asm.asesmen_id,
                              currentVal
                            )
                          }
                          disabled={!isChanged}
                          style={{
                            backgroundColor: isChanged ? "#016FB9" : undefined,
                          }}
                        />
                      </Space>
                    ) : (
                      <Tag color={dbVal !== null ? "blue" : "default"}>
                        {dbVal !== null ? Number(dbVal).toFixed(2) : "-"}
                      </Tag>
                    )}
                  </div>
                );
              })}
            </div>
          );
        },
      };
    });

    return [...baseCols, ...scpmkCols];
  }, [filteredSubcpmks, courseAsesmens, penilaianFilter, grades, editedValues, savingId, canEdit]);

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
    <div>

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
      {filteredStudents.length === 0 ? (
        <Empty description="Tidak ada mahasiswa yang mengambil mata kuliah ini." />
      ) : (
        <Table<Mahasiswa>
          rowKey="mahasiswa_id"
          columns={columns}
          dataSource={filteredStudents}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10 }}
        />
      )}
    </ConfigProvider>
    </div>
  );
}
