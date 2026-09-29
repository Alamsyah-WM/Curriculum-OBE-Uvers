// component/CardNoTab.tsx
import React from "react";
import { Card } from "antd";
import styles from "./CntCard.module.css";

type CardNoTabProps = {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
};

export default function CardNoTab({ children, headerContent }: CardNoTabProps) {
  return (
    <Card
        variant="borderless"
        className={styles.noTabCard}
        style={{ margin: 10 }}
        title={headerContent ?? undefined}
        >
        {children}
    </Card>
  );
}