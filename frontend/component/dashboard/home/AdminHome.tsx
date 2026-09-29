"use client";

import React, { useEffect, useMemo, useState } from "react";
import DekanFirstCard from "@/component/CntCard";
import { Button, Spin, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CplBarChart from "@/component/dashboard/home/CplBarChart";
import CplDetail from "@/component/dashboard/home/CplDetail";
import {
  fetchCplAchievement,
  CplAchievement,
  ProdiTabKey,
} from "@/service/cpl";

import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import {
  buildFilterGroups,
  FilterOption,
  SelectedFilters,
} from "@/config/filterpresets";

const TAB_TO_PRODI_ID: Record<ProdiTabKey, string> = {
  tif: "iOsR1pcAsSDRusMYFRVY",
  tpl: "87hvhJDOZFf9dHffxfLY",
  si: "O1ZyEABQkHRhPJrREyUS",
};

const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + "..." : text;

export default function DekanHome() {
  const [activeTab, setActiveTab] = useState<ProdiTabKey>("tif");

  const [selectedPeriodeId, setSelectedPeriodeId] = useState("");
  const [periodeYearOptions, setPeriodeYearOptions] = useState<FilterOption[]>(
    []
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] =
    useState<SelectedFilters>({});

  const [cplData, setCplData] = useState<CplAchievement[]>([]);
  const [selectedCpl, setSelectedCpl] = useState<CplAchievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterGroups = useMemo(() => {
    return buildFilterGroups("filter1", {
      periodeYearOptions,
    });
  }, [periodeYearOptions]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as ProdiTabKey);
    setSelectedCpl(null);
  };

  const handleRemoveFilter = (groupKey: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] ?? []).filter((item) => item !== value),
    }));
  };

  const selectedTahun = selectedFilters.tahun;
  const queryTahun = useMemo(() => {
    return (selectedTahun && selectedTahun.length > 0)
      ? selectedTahun
      : periodeYearOptions.map((opt) => opt.value);
  }, [selectedTahun, periodeYearOptions]);

  useEffect(() => {
    let active = true;
    const prodiId = TAB_TO_PRODI_ID[activeTab];

    if (!prodiId) {
      setCplData([]);
      setError(`ProdiId untuk tab "${activeTab}" belum di-set`);
      return;
    }

    if (queryTahun.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedCpl(null);

    fetchCplAchievement(prodiId, queryTahun)
      .then((data) => {
        if (!active) return;
        const sortedData = [...data].sort((a, b) =>
          a.kode_cpl.localeCompare(b.kode_cpl, undefined, { numeric: true })
        );
        setCplData(sortedData);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Error fetch CPL:", err);
        setCplData([]);
        setError("Gagal mengambil data CPL");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, queryTahun]);

  const handleSelectCplFromDropdown = (cplId: string) => {
    const found = cplData.find((cpl) => cpl.cpl_id === cplId);
    if (found) {
      setSelectedCpl(found);
    }
  };

  return (
    <div
      className="w-full"
      style={{
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <DekanFirstCard
        activeTabKey={activeTab}
        onTabChange={handleTabChange}
        headerContent={
          <div>
            <div className="flex flex-row gap-2 pb-2">
              <div className="gap-2 flex w-full">
                <PeriodeList
                  value={selectedPeriodeId}
                  onChange={(periode, _label, yearOptions) => {
                    setSelectedPeriodeId(periode.periode_id);
                    setPeriodeYearOptions(yearOptions);

                    setSelectedFilters((prev) => ({
                      ...prev,
                      tahun: yearOptions.map((item) => item.value),
                    }));
                  }}
                />

                <Button
                  icon={<PlusOutlined />}
                  iconPlacement="end"
                  onClick={() => setFilterOpen(true)}
                >
                  Filter
                </Button>
              </div>

              <div className="gap-2 flex justify-end">
                {/* <Button
                  style={{ backgroundColor: "#59D4A2", color: "white" }}
                  icon={<PlusOutlined />}
                  iconPlacement="start"
                >
                  Upload Excl
                </Button> */}
              </div>
            </div>

            <SelectedFilterTags
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onRemove={handleRemoveFilter}
              maxVisible={5}
            />

            <FilterModal
              open={filterOpen}
              title="Filter Dashboard"
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onCancel={() => setFilterOpen(false)}
              onApply={(filters) => {
                setSelectedFilters(filters);
                setFilterOpen(false);
              }}
            />
          </div>
        }
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ padding: 24, color: "red", textAlign: "center" }}>
            {error}
          </div>
        ) : cplData.length === 0 ? (
          <div style={{ padding: 24, opacity: 0.5, textAlign: "center" }}>
            Tidak ada data CPL untuk prodi ini.
          </div>
        ) : (
          <>
            <div style={{ margin: "8px 0 16px 0" }}>
              <Select
                style={{ minWidth: 260, maxWidth: 480 }}
                placeholder="Pilih CPL untuk lihat detail"
                value={selectedCpl?.cpl_id}
                onChange={handleSelectCplFromDropdown}
                options={cplData.map((cpl) => ({
                  label: `${cpl.kode_cpl} - ${truncate(cpl.deskripsi, 60)}`,
                  value: cpl.cpl_id,
                }))}
                allowClear
                onClear={() => setSelectedCpl(null)}
              />
            </div>

            <CplBarChart
              data={cplData}
              onSelectCpl={(cpl) => {
                setSelectedCpl(cpl);
              }}
            />

            {selectedCpl && <CplDetail cpl={selectedCpl} />}
          </>
        )}
      </DekanFirstCard>
    </div>
  );
}