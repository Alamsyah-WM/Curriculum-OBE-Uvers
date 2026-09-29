"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Sider from "antd/es/layout/Sider";
import Link from "next/link";
import { Menu, ConfigProvider } from "antd";
import { usePathname } from "next/navigation";
import { navigationByRole } from "@/config/navigation";
import {
  DashboardOutlined,
  TeamOutlined,
  SolutionOutlined,
  CalendarOutlined,
  BookOutlined,
  FormOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

type NavItem = {
  key: string;
  label: string;
  path: string;
};

const getIcon = (path: string) => {
  switch (path) {
    case "/home":
      return <DashboardOutlined style={{ fontSize: "16px" }} />;
    case "/student":
      return <TeamOutlined style={{ fontSize: "16px" }} />;
    case "/lecturer":
      return <SolutionOutlined style={{ fontSize: "16px" }} />;
    case "/period":
      return <CalendarOutlined style={{ fontSize: "16px" }} />;
    case "/prodi":
      return <ApartmentOutlined style={{ fontSize: "16px" }} />;
    case "/curicullum":
      return <BookOutlined style={{ fontSize: "16px" }} />;
    case "/assessment":
      return <FormOutlined style={{ fontSize: "16px" }} />;
    default:
      return null;
  }
};

export default function AppSider() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("");

  // Handler untuk update role dari localStorage
  const updateRoleFromStorage = useCallback(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    // Initial load
    updateRoleFromStorage();

    // 🔥 Listen CUSTOM EVENT (same tab) + storage event (multi-tab)
    const handleRoleChange = () => updateRoleFromStorage();
    
    window.addEventListener("roleChanged", handleRoleChange);
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key === "role") handleRoleChange();
    });

    return () => {
      window.removeEventListener("roleChanged", handleRoleChange);
      window.removeEventListener("storage", handleRoleChange);
    };
  }, [updateRoleFromStorage]);

  const items = useMemo(() => {
    const navItems: NavItem[] = navigationByRole[role as keyof typeof navigationByRole] ?? [];

    return navItems.map((item) => ({
      key: item.path,
      label: <Link href={item.path}>{item.label}</Link>,
      icon: getIcon(item.path),
    }));
  }, [role]);

  return (
    <Sider
      width={360}
      style={{
        backgroundColor: "#F7F2FA",
        color: "black",
        position: "sticky",
        height: "calc(100vh - 64px)",
        top: 64,
      }}
    >
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemSelectedBg: "#D6E8F4",
              itemSelectedColor: "#015E9D",
            },
          },
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={items}
          style={{
            backgroundColor: "#F7F2FA",
            color: "black",
          }}
        />
      </ConfigProvider>
    </Sider>
  );
}