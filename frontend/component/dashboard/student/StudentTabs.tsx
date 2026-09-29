// component/dashboard/student/StudentTabs.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StudentPenilaianView from "./StudentPenilaianView";
import StudentTranskripView from "./StudentTranskripView";
import StudentKrsView from "./StudentKrsView";
import styles from "@/component/CntCard.module.css";
import type { NilaiItem } from "@/service/penilaian";

type StudentTabsProps = {
  role: string;
  nilaiItems: NilaiItem[];
  mahasiswaId: string;
  namaMahasiswa: string;
  prodiId: string;
  mkIds: string[];
};

const StudentTabs: React.FC<StudentTabsProps> = ({
  role,
  nilaiItems,
  mahasiswaId,
  namaMahasiswa,
  prodiId,
  mkIds,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const initialKey =
    tabParam === "transkrip"
      ? "transkrip"
      : tabParam === "krs"
      ? "krs"
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
    { key: "transkrip", label: "Transkrip OBE", children: null },
  ];

  // Tambahkan tab KRS hanya untuk admin
  if (role === "admin") {
    items.push({
      key: "krs",
      label: "KRS",
      children: null,
    });
  }

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
          <StudentPenilaianView
            role={role}
            mahasiswaId={mahasiswaId}
            nilaiItems={nilaiItems}
            mkIds={mkIds}
          />
        )}

        {activeKey === "transkrip" && (
          <StudentTranskripView mahasiswaId={mahasiswaId} prodiId={prodiId} />
        )}

        {activeKey === "krs" && role === "admin" && (
          <StudentKrsView mahasiswaId={mahasiswaId} prodiId={prodiId} mkIds={mkIds} />
        )}
      </div>
    </div>
  );
};

export default StudentTabs;