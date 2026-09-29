"use client";

import React, { useEffect, useMemo, useState } from "react";
import CardNoTab from "@/component/CardNoTab";
import { Button, Spin, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CplBarChart from "@/component/dashboard/home/CplBarChart";
import CplDetail from "@/component/dashboard/home/CplDetail";
import {
  fetchCplAchievement,
  CplAchievement,
} from "@/service/cpl";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import {
  buildFilterGroups,
  FilterOption,
  SelectedFilters,
} from "@/config/filterpresets";

export default function KaprodiHome() {
  const [prodiId, setProdiId] = useState<string>("");

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

  useEffect(() => {
    fetchAuthMe()
      .then((user: AuthMeResponse) => {
        setProdiId(user.prodi_id);
      })
      .catch((err) => {
        console.error("Error fetch user prodi:", err);
        setError("Gagal load prodi user");
      });
  }, []);

  const selectedTahun = selectedFilters.tahun;
  const queryTahun = useMemo(() => {
    return (selectedTahun && selectedTahun.length > 0)
      ? selectedTahun
      : periodeYearOptions.map((opt) => opt.value);
  }, [selectedTahun, periodeYearOptions]);

  useEffect(() => {
    let active = true;
    if (!prodiId) return;
    if (queryTahun.length === 0) return;

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
  }, [prodiId, queryTahun]);

  const handleRemoveFilter = (groupKey: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] ?? []).filter((item) => item !== value),
    }));
  };

  const handleSelectCplFromDropdown = (cplId: string) => {
    const found = cplData.find((cpl) => cpl.cpl_id === cplId);
    if (found) {
      setSelectedCpl(found);
    }
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  return (
    <div
      className="w-full"
      style={{
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <CardNoTab
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
      </CardNoTab>
    </div>
  );
}