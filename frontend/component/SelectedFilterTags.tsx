// component/SelectedFilterTags.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Tag } from "antd";
import type {
  FilterGroup,
  SelectedFilters,
} from "@/config/filterpresets";

type SelectedFilterTagsProps = {
  filterGroups: FilterGroup[];
  selectedFilters: SelectedFilters;
  onRemove: (groupKey: string, value: string) => void;
  maxVisible?: number;
};

export default function SelectedFilterTags({
  filterGroups,
  selectedFilters,
  onRemove,
  maxVisible = 6,
}: SelectedFilterTagsProps) {
  const [expanded, setExpanded] = useState(false);

  const tags = useMemo(() => {
    return filterGroups.flatMap((group) => {
      const selectedValues = selectedFilters[group.key] ?? [];

      return selectedValues.map((value) => {
        const option = group.options.find((item) => item.value === value);

        return {
          key: `${group.key}-${value}`,
          groupKey: group.key,
          value,
          label: option?.label ?? value,
        };
      });
    });
  }, [filterGroups, selectedFilters]);

  if (tags.length === 0) return null;

  const visibleTags = expanded ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        paddingTop: 4,
        alignItems: "center",
      }}
    >
      {visibleTags.map((tag) => (
        <Tag
          key={tag.key}
          closable
          closeIcon
          style={{
            backgroundColor: "#D6E8F4",
            color: "#015E9D",
            borderColor: "#B1D4EC",
            margin: 0,
          }}
          onClose={(e) => {
            e.preventDefault();
            onRemove(tag.groupKey, tag.value);
          }}
        >
          {tag.label}
        </Tag>
      ))}

      {!expanded && hiddenCount > 0 && (
        <Tag
          style={{
            backgroundColor: "#F0F7FC",
            border: "1px solid #B1D4EC",
            color: "#015E9D",
            cursor: "pointer",
            margin: 0,
          }}
          onClick={() => setExpanded(true)}
        >
          +{hiddenCount}
        </Tag>
      )}

      {expanded && tags.length > maxVisible && (
        <Tag
          style={{
            backgroundColor: "#F0F7FC",
            border: "1px solid #B1D4EC",
            color: "#015E9D",
            cursor: "pointer",
            margin: 0,
          }}
          onClick={() => setExpanded(false)}
        >
          Sembunyikan
        </Tag>
      )}
    </div>
  );
}