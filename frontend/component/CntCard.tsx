import React from "react";
import { Card } from "antd";
import styles from "./CntCard.module.css";

const prodiTabList = [
  {
    key: "tif",
    label: "Teknik Informatika",
  },
  {
    key: "tpl",
    label: "Teknik Perangkat Lunak",
  },
  {
    key: "si",
    label: "Sistem Informasi",
  },
];

const curriculumTabList = [
  {
    key: "profile-lulusan",
    label: "Profile Lulusan",
  },
  {
    key: "cpl",
    label: "CPL",
  },
  {
    key: "matakuliah",
    label: "Matakuliah",
  },
  {
    key: "cpmk",
    label: "CPMK",
  },
];

type TabCardProps = {
  children: React.ReactNode;
  activeTabKey: string;
  onTabChange: (key: string) => void;
  headerContent?: React.ReactNode;
};

export default function DekanFirstCard({
  children,
  activeTabKey,
  onTabChange,
  headerContent,
}: TabCardProps) {
  return (
    <Card
      variant="borderless"
      className={styles.fullWidthCard}
      style={{
        margin: 10,
      }}
      title={headerContent ?? undefined}
      tabList={prodiTabList}
      activeTabKey={activeTabKey}
      onTabChange={onTabChange}
    >
      {children}
    </Card>
  );
}

export function CurriculumTabCard({
  children,
  activeTabKey,
  onTabChange,
  headerContent,
}: TabCardProps) {
  return (
    <Card
      variant="borderless"
      className={styles.fullWidthCard}
      style={{
        margin: 10,
      }}
      title={headerContent ?? undefined}
      tabList={curriculumTabList}
      activeTabKey={activeTabKey}
      onTabChange={onTabChange}
    >
      {children}
    </Card>
  );
}