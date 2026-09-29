"use client";

import React, { useMemo, useState } from "react";
import { Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import CardNoTab from "@/component/CardNoTab";
import AsesmenTable from "@/component/AsesmenTable";
import FilterModal from "@/component/FilterModal";
import SelectedFilterTags from "@/component/SelectedFilterTags";
import {
  buildFilterGroups,
  SelectedFilters,
} from "@/config/filterpresets";

export default function AsesmenContent() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
  const [searchKeyword, setSearchKeyword] = useState("");

  // 🔥 filter5 = hanya semester
  const filterGroups = useMemo(() => {
    return buildFilterGroups("filter5", {});
  }, []);

  // Handler saat filter tag dihapus
  const handleRemoveFilterTag = (groupKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const remaining = (prev[groupKey] ?? []).filter((v) => v !== value);
      return { ...prev, [groupKey]: remaining };
    });
  };

  return (
    <div className="w-full" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <CardNoTab
        headerContent={
          <div>
            <div className="flex flex-row gap-2 pb-2">
              <div className="gap-2 flex w-full">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setFilterOpen(true)}
                >
                  Filter
                </Button>

                <Input
                  style={{ width: "30%" }}
                  placeholder="Cari Kode / Nama MK"
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
              title="Filter Mata Kuliah"
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
        <AsesmenTable
          searchKeyword={searchKeyword}
          semesterList={selectedFilters.semester ?? []}
        />
      </CardNoTab>
    </div>
  );
}
