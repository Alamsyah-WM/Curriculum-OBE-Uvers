// component/dashboard/asesmen/AsesmenPenilaian.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CardNoTab from "@/component/CardNoTab";
import AsesmenMahasiswa from "./AsesmenMahasiswa";
import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import {
  buildFilterGroups,
  FilterOption,
  SelectedFilters,
} from "@/config/filterpresets";

type Props = {
  role: string;
  mkId: string;
  namaMk: string;
  prodiId: string;
};

export default function AsesmenPenilaian({ role, mkId, namaMk, prodiId }: Props) {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>();
  const [selectedPeriodeLabel, setSelectedPeriodeLabel] =
    useState<string>("Pilih Periode");
  const [periodeYearOptions, setPeriodeYearOptions] = useState<FilterOption[]>(
    []
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const [searchKeyword, setSearchKeyword] = useState("");

  const filterGroups = useMemo(() => {
    return buildFilterGroups("filter6", { periodeYearOptions });
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

                <Input
                  style={{ width: "30%", minWidth: 200 }}
                  placeholder="Cari NIM / Nama"
                  prefix={<SearchOutlined />}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
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
              title="Filter Asesmen Penilaian"
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
        <AsesmenMahasiswa
          role={role}
          mkId={mkId}
          prodiId={prodiId}
          searchKeyword={searchKeyword}
          angkatanList={selectedFilters.tahun ?? []}
          penilaianFilter={selectedFilters.penilaian ?? []}
        />
      </CardNoTab>
    </div>
  );
}
