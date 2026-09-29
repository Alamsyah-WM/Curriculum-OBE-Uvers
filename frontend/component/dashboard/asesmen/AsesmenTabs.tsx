// component/dashboard/asesmen/AsesmenTabs.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AsesmenPenilaian from "./AsesmenPenilaian";
import AsesmenPemetaan from "./AsesmenPemetaan";
import AsesmenTranskripView from "./AsesmenTranskripView";
import styles from "@/component/CntCard.module.css";

type AsesmenTabsProps = {
  role: string;
  mkId: string;
  namaMk: string;
  prodiId: string;
};

const AsesmenTabs: React.FC<AsesmenTabsProps> = ({
  role,
  mkId,
  namaMk,
  prodiId,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const initialKey =
    tabParam === "pemetaan"
      ? "pemetaan"
      : tabParam === "asesmentranskrip"
      ? "asesmentranskrip"
      : "penilaian";

  const [activeKey, setActiveKey] = useState<string>(initialKey);

  useEffect(() => {
    setActiveKey(initialKey);
  }, [initialKey]);

  const handleChange: TabsProps["onChange"] = (key) => {
    setActiveKey(key);

    const params = new URLSearchParams(searchParams?.toString());

    if (key === "penilaian") {
      params.delete("tab");
    } else {
      params.set("tab", key);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const items: TabsProps["items"] = [
    { key: "penilaian", label: "Penilaian", children: null },
    { key: "pemetaan", label: "Pemetaan Kurikulum", children: null },
    { key: "asesmentranskrip", label: "Transkrip OBE", children: null },
  ];

  return (
    <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      <div style={{ width: "100%", backgroundColor: "#003D73" }}>
        <Tabs
          className={styles.studentFullWidthTabs}
          activeKey={activeKey}
          onChange={handleChange}
          items={items}
          tabBarStyle={{ backgroundColor: "#003D73", margin: 0, padding: 0 }}
        />
      </div>

      <div style={{ width: "100%", boxSizing: "border-box", padding: 16 }}>
        {activeKey === "penilaian" && (
          <AsesmenPenilaian
            role={role}
            mkId={mkId}
            namaMk={namaMk}
            prodiId={prodiId}
          />
        )}

        {activeKey === "pemetaan" && (
          <AsesmenPemetaan
            role={role}
            mkId={mkId}
            namaMk={namaMk}
            prodiId={prodiId}
          />
        )}

        {activeKey === "asesmentranskrip" && (
          <AsesmenTranskripView
            mkId={mkId}
            prodiId={prodiId}
          />
        )}
      </div>
    </div>
  );
};

export default AsesmenTabs;
