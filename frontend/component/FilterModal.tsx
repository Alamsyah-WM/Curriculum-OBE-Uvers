// component/FilterModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button, Divider, Modal, Space, Tag } from "antd";
import type {
  FilterGroup,
  SelectedFilters,
} from "@/config/filterpresets";

type FilterModalProps = {
  open: boolean;
  title?: string;
  filterGroups: FilterGroup[];
  selectedFilters: SelectedFilters;
  onCancel: () => void;
  onApply: (filters: SelectedFilters) => void;
};

export default function FilterModal({
  open,
  title = "Filter",
  filterGroups,
  selectedFilters,
  onCancel,
  onApply,
}: FilterModalProps) {
  const [tempFilters, setTempFilters] =
    useState<SelectedFilters>(selectedFilters);

  useEffect(() => {
    if (open) {
      setTempFilters(selectedFilters);
    }
  }, [open, selectedFilters]);

  const handleToggle = (group: FilterGroup, value: string) => {
    const currentValues = tempFilters[group.key] ?? [];

    if (group.mode === "single") {
      const isSelected = currentValues.includes(value);

      setTempFilters((prev) => ({
        ...prev,
        [group.key]: isSelected ? [] : [value],
      }));

      return;
    }

    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    setTempFilters((prev) => ({
      ...prev,
      [group.key]: nextValues,
    }));
  };

  const handleReset = () => {
    setTempFilters({});
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={handleReset}>Reset</Button>
          <Button onClick={onCancel}>Batal</Button>
          <Button
            type="primary"
            onClick={() => onApply(tempFilters)}
            style={{ backgroundColor: "#016FB9" }}
          >
            Terapkan
          </Button>
        </Space>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        {filterGroups.map((group, index) => {
          const selectedValues = tempFilters[group.key] ?? [];

          return (
            <div key={group.key}>
              {index > 0 && <Divider style={{ margin: "8px 0" }} />}

              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {group.title}
              </div>

              <Space wrap>
                {group.options.map((option) => {
                  const checked = selectedValues.includes(option.value);
                  const disabled = option.disabled === true;

                  return (
                    <Tag.CheckableTag
                      key={option.value}
                      checked={checked}
                      onChange={() => {
                        if (disabled) return;
                        handleToggle(group, option.value);
                      }}
                      style={{
                        border: "1px solid #D0BCFF",
                        borderRadius: 16,
                        padding: "6px 12px",
                        backgroundColor: checked ? "#003D73" : "#FFFFFF",
                        opacity: disabled ? 0.45 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {option.label}
                    </Tag.CheckableTag>
                  );
                })}
              </Space>
            </div>
          );
        })}
      </Space>
    </Modal>
  );
}