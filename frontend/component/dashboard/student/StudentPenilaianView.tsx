// component/dashboard/student/StudentPenilaianView.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Input,
  InputNumber,
  message,
  Spin,
  Table,
  Tag,
} from "antd";
import type { CollapseProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

import type { NilaiItem } from "@/service/penilaian";
import { postNilai } from "@/service/penilaian";
import { fetchMk, MkItem } from "@/service/mk";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

type Props = {
  role: string;
  mahasiswaId: string;
  nilaiItems: NilaiItem[];
  mkIds: string[];
};

type AsesmenRow = {
  row_key: string;
  nilai_record_id: string;
  cpmk_id: string;
  asesmen_id: string;
  mahasiswa_id: string;
  mk_id: string;
  subcpmk_id: string;
  nama_asesmen: string;
  bobot?: number;
  nilai: number;
};

type SubCpmkGroup = {
  subcpmk_id: string;
  kode_subcpmk: string;
  asesmens: AsesmenRow[];
};

type MkGroup = {
  mk: MkItem;
  subcpmks: SubCpmkGroup[];
};

const StudentPenilaianView: React.FC<Props> = ({
  role,
  mahasiswaId,
  nilaiItems,
  mkIds,
}) => {
  const [mkList, setMkList] = useState<MkItem[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthMeResponse | null>(null);

  const [localNilaiItems, setLocalNilaiItems] =
    useState<NilaiItem[]>(nilaiItems);

  const [editedValues, setEditedValues] = useState<
    Record<string, number | null>
  >({});

  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
  const [searchMk, setSearchMk] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "admin";

  const isDosen = role === "dosen";

  useEffect(() => {
    setLocalNilaiItems(nilaiItems);
  }, [nilaiItems]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [mkRes] = await Promise.all([
          fetchMk(),
        ]);

        setMkList(mkRes);

        if (role === "dosen") {
          const meRes = await fetchAuthMe();
          setCurrentUser(meRes);
        }
      } catch (error) {
        console.error("Error load StudentPenilaianView:", error);
        message.error("Gagal mengambil data penilaian mahasiswa");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [role]);

  const currentDosenId = useMemo(() => {
    if (!currentUser) return "";

    const user = currentUser as any;

    return user.dosen_id ?? user.user_id ?? user.id ?? "";
  }, [currentUser]);

  const filteredMkList = useMemo(() => {
    let result = mkList.filter((mk) => mkIds.includes(mk.mk_id));

    if (role === "dosen") {
      result = result.filter((mk) => mk.dosen_id === currentDosenId);
    }

    if (isAdmin) {
      result = mkList.filter((mk) => mkIds.includes(mk.mk_id));
    }

    const keyword = searchMk.trim().toLowerCase();

    if (keyword) {
      result = result.filter((mk) => {
        const kodeMk = mk.kode_mk?.toLowerCase() ?? "";
        const namaMkId = mk.nama_mk_id?.toLowerCase() ?? "";
        const namaMkEn = mk.nama_mk_en?.toLowerCase() ?? "";

        return (
          kodeMk.includes(keyword) ||
          namaMkId.includes(keyword) ||
          namaMkEn.includes(keyword)
        );
      });
    }

    return result.sort((a, b) => a.kode_mk.localeCompare(b.kode_mk));
  }, [mkList, mkIds, role, currentDosenId, searchMk]);

  const mkGroups: MkGroup[] = useMemo(() => {
    return filteredMkList.map((mk) => {
      const nilaiByMk = localNilaiItems.filter(
        (nilai) => nilai.mk_id === mk.mk_id
      );

      const subMap = new Map<string, SubCpmkGroup>();

      nilaiByMk.forEach((nilai) => {
        const groupKey = nilai.kode_subcpmk || nilai.subcpmk_id;
        if (!subMap.has(groupKey)) {
          subMap.set(groupKey, {
            subcpmk_id: nilai.subcpmk_id,
            kode_subcpmk: nilai.kode_subcpmk,
            asesmens: [],
          });
        }

        const subGroup = subMap.get(groupKey)!;

        const alreadyExists = subGroup.asesmens.some(
          (asesmen) => asesmen.asesmen_id === nilai.asesmen_id
        );

        if (!alreadyExists) {
          subGroup.asesmens.push({
            row_key: `${nilai.mk_id}-${nilai.subcpmk_id}-${nilai.asesmen_id}`,
            nilai_record_id: nilai.id,
            cpmk_id: nilai.cpmk_id,
            asesmen_id: nilai.asesmen_id,
            mahasiswa_id: nilai.mahasiswa_id,
            mk_id: nilai.mk_id,
            subcpmk_id: nilai.subcpmk_id,
            nama_asesmen: nilai.nama_asesmen,
            bobot: nilai.bobot,
            nilai: nilai.nilai,
          });
        }
      });

      const subcpmks = Array.from(subMap.values()).sort((a, b) =>
        a.kode_subcpmk.localeCompare(b.kode_subcpmk)
      );

      subcpmks.forEach((sub) => {
        sub.asesmens.sort((a, b) =>
          a.nama_asesmen.localeCompare(b.nama_asesmen)
        );
      });

      return {
        mk,
        subcpmks,
      };
    });
  }, [filteredMkList, localNilaiItems]);

  const getCurrentInputValue = (row: AsesmenRow) => {
    const hasEditedValue = Object.prototype.hasOwnProperty.call(
      editedValues,
      row.row_key
    );

    return hasEditedValue ? editedValues[row.row_key] : row.nilai;
  };

  const handleChangeNilai = (rowKey: string, value: number | null) => {
    setEditedValues((prev) => ({
      ...prev,
      [rowKey]: value,
    }));
  };

  const handleSaveNilai = async (row: AsesmenRow) => {
    if (!canEdit) return;

    const nilaiBaru = getCurrentInputValue(row);

    if (nilaiBaru === null || nilaiBaru === undefined) {
      message.warning("Nilai tidak boleh kosong");
      return;
    }

    try {
      setSavingRowKey(row.row_key);

      await postNilai({
        mahasiswa_id: mahasiswaId,
        mk_id: row.mk_id,
        cpmk_id: row.cpmk_id,
        subcpmk_id: row.subcpmk_id,
        asesmen_id: row.asesmen_id,
        nilai: nilaiBaru,
      });

      setLocalNilaiItems((prev) =>
        prev.map((item) => {
          const isSameNilai =
            item.mk_id === row.mk_id &&
            item.cpmk_id === row.cpmk_id &&
            item.subcpmk_id === row.subcpmk_id &&
            item.asesmen_id === row.asesmen_id;

          if (!isSameNilai) return item;

          return {
            ...item,
            nilai: nilaiBaru,
          };
        })
      );

      setEditedValues((prev) => {
        const next = { ...prev };
        delete next[row.row_key];
        return next;
      });

      message.success("Nilai berhasil disimpan");
    } catch (error) {
      console.error("Error save nilai:", error);
      message.error("Gagal menyimpan nilai");
    } finally {
      setSavingRowKey(null);
    }
  };

  const canEdit = isDosen || isAdmin;

  const asesmenColumns: ColumnsType<AsesmenRow> = [
    {
      title: "Asesmen",
      dataIndex: "nama_asesmen",
      key: "nama_asesmen",
      width: canEdit ? "40%" : "50%",
    },
    {
      title: "Bobot",
      dataIndex: "bobot",
      key: "bobot",
      width: canEdit ? "20%" : "25%",
      render: (bobot?: number) =>
        bobot !== undefined && bobot !== null ? `${bobot}%` : "-",
    },
    {
      title: "Nilai",
      dataIndex: "nilai",
      key: "nilai",
      width: canEdit ? "20%" : "25%",
      render: (_nilai: number, row: AsesmenRow) => {
        if (!canEdit) {
          return Number(row.nilai ?? 0).toFixed(2);
        }

        return (
          <InputNumber
            min={0}
            max={100}
            value={getCurrentInputValue(row)}
            onChange={(value) => handleChangeNilai(row.row_key, value)}
            style={{ width: "100%", maxWidth: 120 }}
          />
        );
      },
    },
    ...(canEdit
      ? [
          {
            title: "Aksi",
            key: "aksi",
            width: "20%",
            render: (_: unknown, row: AsesmenRow) => (
              <Button
                type="primary"
                size="small"
                loading={savingRowKey === row.row_key}
                onClick={() => handleSaveNilai(row)}
                style={{ backgroundColor: "#016FB9" }}
              >
                Simpan
              </Button>
            ),
          },
        ]
      : []),
  ];

  const collapseItems: CollapseProps["items"] = mkGroups.map(
    ({ mk, subcpmks }) => {
      const hasAsesmen = subcpmks.length > 0;

      const subItems: CollapseProps["items"] = subcpmks.map((sub) => ({
        key: sub.kode_subcpmk || sub.subcpmk_id,
        label: (
          <span style={{ fontWeight: 500 }}>{sub.kode_subcpmk}</span>
        ),
        children: (
          <Table<AsesmenRow>
            size="small"
            columns={asesmenColumns}
            dataSource={sub.asesmens}
            rowKey="row_key"
            pagination={false}
          />
        ),
      }));

      return {
        key: mk.mk_id,
        label: (
          <span>
            <b>{mk.kode_mk}</b> - {mk.nama_mk_id}
          </span>
        ),
        children: hasAsesmen ? (
          <Collapse items={subItems} bordered={false} />
        ) : (
          <Alert
            type="info"
            showIcon
            title="Belum ada asesmen"
            description="Mahasiswa ini belum memiliki data asesmen atau nilai untuk mata kuliah ini."
          />
        ),
      };
    }
  );

  if (loading) {
    return (
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px 0",
          }}
        >
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{ width: "100%" }}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Input
            style={{ width: "30%", minWidth: 240 }}
            placeholder="Cari mata kuliah"
            prefix={<SearchOutlined />}
            value={searchMk}
            onChange={(e) => setSearchMk(e.target.value)}
          />
        </div>
      }
      styles={{
        body: { padding: 16 },
      }}
    >
      {mkIds.length === 0 ? (
        <Empty description="Mahasiswa ini belum memiliki mata kuliah." />
      ) : collapseItems.length === 0 ? (
        <Empty
          description={
            role === "dosen"
              ? "Tidak ada mata kuliah mahasiswa ini yang diampu oleh dosen login."
              : "Tidak ada mata kuliah yang cocok."
          }
        />
      ) : (
        <Collapse items={collapseItems} />
      )}
    </Card>
  );
};

export default StudentPenilaianView;