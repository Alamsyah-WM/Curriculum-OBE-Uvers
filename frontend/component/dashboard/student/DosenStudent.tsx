"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, message, Modal, Form, Select } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CardNoTab from "@/component/CardNoTab";
import StudentTable from "@/component/StudentTable";
import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import {
  buildFilterGroups,
  FilterOption,
  SelectedFilters,
} from "@/config/filterpresets";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

export default function KaprodiStudent() {
  const [prodiId, setProdiId] = useState<string>("");

  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>();
  const [selectedPeriodeLabel, setSelectedPeriodeLabel] =
    useState<string>("Pilih Periode");
  const [periodeYearOptions, setPeriodeYearOptions] = useState<FilterOption[]>(
    []
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] =
    useState<SelectedFilters>({});
  const [searchKeyword, setSearchKeyword] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<any>();

  // Load prodi user (kaprodi)
  useEffect(() => {
    fetchAuthMe()
      .then((user: AuthMeResponse) => setProdiId(user.prodi_id))
      .catch((err) => {
        console.error("Error fetch user prodi:", err);
        message.error("Gagal memuat data prodi user");
      });
  }, []);

  const filterGroups = useMemo(() => {
    return buildFilterGroups("filter1", { periodeYearOptions });
  }, [periodeYearOptions]);

  // Handler saat filter tag dihapus
  const handleRemoveFilterTag = (groupKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const remaining = (prev[groupKey] ?? []).filter((v) => v !== value);
      const updated = { ...prev, [groupKey]: remaining };

      // Update periode label otomatis
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

  return (
    <div className="w-full" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <CardNoTab
        headerContent={
          <div>
            <div className="flex flex-row gap-2 pb-2">
              <div className="gap-2 flex w-full">
                <PeriodeList
                  value={selectedPeriodeId}
                  onChange={(periode, label, yearOptions) => {
                    setSelectedPeriodeId(periode.periode_id);
                    setSelectedPeriodeLabel(label);
                    setPeriodeYearOptions(yearOptions);
                    setSelectedFilters((prev) => ({
                      ...prev,
                      tahun: yearOptions.map((o) => o.value),
                    }));
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
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="gap-2 flex justify-end">
                {/* <Button
                  style={{ backgroundColor: "#59D4A2", color: "white" }}
                  icon={<PlusOutlined />}
                >
                  Upload Excel
                </Button> */}
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
        <StudentTable
          prodiId={prodiId}
          angkatanList={selectedFilters.tahun ?? []}
          searchKeyword={searchKeyword}
        />
      </CardNoTab>
    </div>
  );
}