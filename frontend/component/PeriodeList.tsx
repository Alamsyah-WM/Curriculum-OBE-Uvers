// component/PeriodeList.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Space, message } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import {
  fetchPeriode,
  formatPeriode,
  PeriodeItem,
} from "@/service/periode";
import type { FilterOption } from "@/config/filterpresets";
import { buildPeriodeYearOptions } from "@/config/filterpresets";

type PeriodeListProps = {
  value?: string;
  onChange: (
    periode: PeriodeItem,
    label: string,
    yearOptions: FilterOption[]
  ) => void;
  defaultSelectFirst?: boolean;
};

export default function PeriodeList({
  value,
  onChange,
  defaultSelectFirst = true,
}: PeriodeListProps) {
  const [periodeList, setPeriodeList] = useState<PeriodeItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPeriode = async () => {
      try {
        setLoading(true);

        const data = await fetchPeriode();
        setPeriodeList(data);

        if (defaultSelectFirst && !value && data.length > 0) {
          const firstPeriode = data[0];
          const label = formatPeriode(firstPeriode);
          const yearOptions = buildPeriodeYearOptions(firstPeriode);

          onChange(firstPeriode, label, yearOptions);
        }
      } catch (error) {
        console.error("Error fetch periode:", error);
        message.error("Gagal mengambil data periode");
      } finally {
        setLoading(false);
      }
    };

    loadPeriode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPeriode = useMemo(() => {
    return periodeList.find((periode) => periode.periode_id === value);
  }, [periodeList, value]);

  const selectedLabel = selectedPeriode
    ? formatPeriode(selectedPeriode)
    : "Pilih Periode";

  const items: MenuProps["items"] = periodeList.map((periode) => ({
    key: periode.periode_id,
    label: formatPeriode(periode),
    onClick: () => {
      const label = formatPeriode(periode);
      const yearOptions = buildPeriodeYearOptions(periode);

      onChange(periode, label, yearOptions);
    },
  }));

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
      disabled={loading || periodeList.length === 0}
    >
      <Button loading={loading}>
        <Space>
          {selectedLabel}
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
}