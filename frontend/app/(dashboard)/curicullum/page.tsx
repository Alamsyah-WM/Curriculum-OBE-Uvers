// app/(dashboard)/curicullum/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

import { CurriculumTabCard } from "@/component/CntCard";
import PeriodeList from "@/component/PeriodeList";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import ProfileLulusanContent from "@/component/dashboard/curicullum/ProfileLulusanContent";
import CplContent from "@/component/dashboard/curicullum/CplContent";
import MataKuliahContent from "@/component/dashboard/curicullum/MataKuliahContent";
import CpmkContent from "@/component/dashboard/curicullum/CpmkContent";

import {
  buildFilterGroups,
  FilterOption,
  SelectedFilters,
} from "@/config/filterpresets";

import { fetchProdi, ProdiItem } from "@/service/prodi";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";

type CurriculumTabKey =
  | "profile-lulusan"
  | "cpl"
  | "matakuliah"
  | "cpmk";

export default function CuricullumPage() {
  const [activeTab, setActiveTab] =
    useState<CurriculumTabKey>("profile-lulusan");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (
        tab === "profile-lulusan" ||
        tab === "cpl" ||
        tab === "matakuliah" ||
        tab === "cpmk"
      ) {
        setActiveTab(tab as CurriculumTabKey);
      }
    }
  }, []);

  const [role, setRole] = useState("");
  const [kaprodiProdiId, setKaprodiProdiId] = useState("");

  const [selectedPeriodeId, setSelectedPeriodeId] = useState("");
  const [prodiOptions, setProdiOptions] = useState<FilterOption[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] =
    useState<SelectedFilters>({});

  const [addTrigger, setAddTrigger] = useState(0);
  const [searchCpmk, setSearchCpmk] = useState("");

  const isKaprodi = role === "kaprodi";

  const filterPreset = useMemo(() => {
    return activeTab === "matakuliah" ? "filter4" : "filter3";
  }, [activeTab]);

  const filterGroups = useMemo(() => {
    return buildFilterGroups(filterPreset, {
      prodiOptions,
    });
  }, [filterPreset, prodiOptions]);

  useEffect(() => {
    if (activeTab !== "matakuliah") {
      setSelectedFilters((prev) => {
        const next = { ...prev };
        delete next.semester;
        return next;
      });
    }
  }, [activeTab]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedRole = localStorage.getItem("role") ?? "";
        setRole(storedRole);

        const prodiData: ProdiItem[] = await fetchProdi();

        let userProdiId = "";

        if (storedRole === "kaprodi") {
        const user: AuthMeResponse = await fetchAuthMe();
        userProdiId = user.prodi_id;

        setKaprodiProdiId(userProdiId);

        setSelectedFilters((prev) => ({
            ...prev,
            prodi: [userProdiId],
        }));
        }

        const options: FilterOption[] = prodiData.map((prodi) => ({
        label: prodi.nama_prodi,
        value: prodi.prodi_id,
        disabled:
            storedRole === "kaprodi" && prodi.prodi_id !== userProdiId,
        }));

        setProdiOptions(options);
      } catch (error) {
        console.error("Error load filter kurikulum:", error);
        message.error("Gagal mengambil data filter kurikulum");
      }
    };

    loadInitialData();
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key as CurriculumTabKey);
    if (key !== "cpmk") setSearchCpmk("");
  };

  const handleRemoveFilter = (groupKey: string, value: string) => {
    if (isKaprodi && groupKey === "prodi") {
      return;
    }

    setSelectedFilters((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] ?? []).filter((item) => item !== value),
    }));
  };

  const handleApplyFilter = (filters: SelectedFilters) => {
    if (isKaprodi && kaprodiProdiId) {
        setSelectedFilters({
            ...filters,
            prodi: [kaprodiProdiId],
        });
    } else {
      setSelectedFilters(filters);
    }

    setFilterOpen(false);
  };

  const addButtonLabel = useMemo(() => {
    switch (activeTab) {
        case "profile-lulusan":
        return "Tambah Profile Lulusan";
        case "cpl":
        return "Tambah CPL";
        case "matakuliah":
        return "Tambah Mata Kuliah";
        case "cpmk":
        return "Tambah CPMK";
        default:
        return "Tambah Data";
    }
  }, [activeTab]);

  const renderContent = () => {
    const commonProps = {
        role,
        selectedPeriodeId,
        selectedFilters,
        addTrigger,
    };

    const cpmkProps = {
        ...commonProps,
        searchKeyword: searchCpmk,
    };

    switch (activeTab) {
        case "profile-lulusan":
        return <ProfileLulusanContent {...commonProps} />;

        case "cpl":
        return <CplContent {...commonProps} />;

        case "matakuliah":
        return <MataKuliahContent {...commonProps} />;

        case "cpmk":
        return <CpmkContent {...cpmkProps} />;

        default:
        return null;
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
      <CurriculumTabCard
        activeTabKey={activeTab}
        onTabChange={handleTabChange}
        headerContent={
          <div>
            <div className="flex flex-row gap-2 pb-2">
              <div className="gap-2 flex w-full">
                <PeriodeList
                  value={selectedPeriodeId}
                  onChange={(periode) => {
                    setSelectedPeriodeId(periode.periode_id);
                  }}
                />

                <Button
                  icon={<PlusOutlined />}
                  iconPlacement="end"
                  onClick={() => setFilterOpen(true)}
                >
                  Filter
                </Button>

                {activeTab === "cpmk" && (
                  <Input
                    style={{ width: "30%" }}
                    placeholder="Cari Nama MK / Kode CPMK"
                    prefix={<SearchOutlined />}
                    value={searchCpmk}
                    onChange={(e) => setSearchCpmk(e.target.value)}
                    allowClear
                  />
                )}
              </div>

              <div className="gap-2 flex justify-end">
                <Button
                    style={{ backgroundColor: "#59D4A2", color: "white" }}
                    icon={<PlusOutlined />}
                    iconPlacement="start"
                    onClick={() => setAddTrigger((prev) => prev + 1)}
                >
                  {addButtonLabel}
                </Button>
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
              title="Filter Kurikulum"
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onCancel={() => setFilterOpen(false)}
              onApply={handleApplyFilter}
            />
          </div>
        }
      >
        {renderContent()}
      </CurriculumTabCard>
    </div>
  );
}