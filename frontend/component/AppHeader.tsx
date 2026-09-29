"use client";

import { Header } from "antd/es/layout/layout";
import { Avatar, Breadcrumb, Dropdown, MenuProps } from "antd";
import { UserOutlined, DownOutlined, LogoutOutlined } from "@ant-design/icons";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { navigationByRole } from "@/config/navigation";
import { roleConfig } from "@/config/role";
import { logout } from "@/service/auth"; // Import logout service

type UserProfile = {
  uid: string;
  dosen_id: string;
  nama_dosen: string;
  nidn: string;
  prodi_id: string;
  nama_prodi: string;
  roles: string[];
};

const DynamicBreadcrumb: React.FC<{ role: string }> = ({ role }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items = useMemo(() => {
    if (pathname.startsWith("/student/") && pathname !== "/student") {
      const nama = searchParams.get("nama") ?? "Mahasiswa";
      const tab = searchParams.get("tab");
      const last = tab === "transkrip" ? "Transkrip OBE" : "Penilaian";

      return [
        { title: <span style={{ color: "white" }}>Mahasiswa</span> },
        { title: <span style={{ color: "white" }}>{nama}</span> },
        { title: <span style={{ color: "white" }}>{last}</span> },
      ];
    }

    if (pathname.startsWith("/assessment/") && pathname !== "/assessment") {
      const namaMk = searchParams.get("nama_mk") ?? "Mata Kuliah";
      const tab = searchParams.get("tab");
      const last =
        tab === "pemetaan"
          ? "Pemetaan Kurikulum"
          : tab === "asesmentranskrip"
          ? "Asesmen Transkrip"
          : "Penilaian";

      return [
        { title: <span style={{ color: "white" }}>Penilaian</span> },
        { title: <span style={{ color: "white" }}>{namaMk}</span> },
        { title: <span style={{ color: "white" }}>{last}</span> },
      ];
    }

    if (
      pathname.startsWith("/curicullum/cpmk/") &&
      pathname.endsWith("/subcpmk_asesmen")
    ) {
      const parts = pathname.split("/");
      const cpmkId = parts[3];

      let kodeCpmk = cpmkId;

      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem(`selectedCpmk:${cpmkId}`);

        if (stored) {
          try {
            const parsed = JSON.parse(stored) as {
              kode_cpmk?: string;
            };

            if (parsed.kode_cpmk) {
              kodeCpmk = parsed.kode_cpmk;
            }
          } catch (error) {
            console.error("Failed to parse selected CPMK breadcrumb:", error);
          }
        }
      }

      return [
        { title: <span style={{ color: "white" }}>Kurikulum</span> },
        { title: <span style={{ color: "white" }}>CPMK</span> },
        { title: <span style={{ color: "white" }}>{kodeCpmk}</span> },
        {
          title: (
            <span style={{ color: "white" }}>
              SubCPMK & Asesmen
            </span>
          ),
        },
      ];
    }

    const navItems =
      navigationByRole[role as keyof typeof navigationByRole] ?? [];

    const currentItem = navItems.find((item) => item.path === pathname);
    const label = currentItem?.label ?? pathname;

    return [{ title: <span style={{ color: "white" }}>{label}</span> }];
  }, [pathname, role, searchParams]);

  return (
    <Breadcrumb
      separator={
        <span style={{ color: "white", margin: "0 8px" }}>/</span>
      }
      items={items}
    />
  );
};

export default function AppHeader() {
  const [role, setRole] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }

    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as UserProfile;
        setUserProfile(parsed);
      } catch (e) {
        console.error("Failed to parse userProfile", e);
      }
    }
  }, []);

  const roleLabel =
    roleConfig[role as keyof typeof roleConfig]?.label ?? "Guest";

  //  ANTD STYLE DROPDOWN + LOGOUT
  const roleMenuItems: MenuProps["items"] = [
    ...((userProfile?.roles ?? []).map((r) => ({
      key: r,
      label: roleConfig[r as keyof typeof roleConfig]?.label ?? r,
      onClick: () => {
        localStorage.setItem("role", r);
        setRole(r);
        window.dispatchEvent(new CustomEvent("roleChanged"));
        const navItems = navigationByRole[r as keyof typeof navigationByRole];
        const firstPath = navItems?.[0]?.path || "/home";
        router.push(firstPath);
      },
    })) || []),
    {
      type: "divider",
    },
    {
      key: "logout",
      label: (
        <div 
          style={{ 
            color: "#ff4d4f", 
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <LogoutOutlined />
          Logout
        </div>
      ),
      onClick: async () => {
        try {
          await logout();
          router.push("/login");
        } catch (error) {
          console.error("Logout failed:", error);
          router.push("/login");
        }
      },
    },
  ];

  const displayName = userProfile?.nama_dosen ?? "User";

  return (
    <Header
      style={{
        backgroundColor: "#016FB9",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
      }}
    >
      <div className="flex flex-row w-full">
        {/* kiri: info user + role selector */}
        <div className="basis-1/3 flex gap-2 items-center">
          <Avatar size={45} icon={<UserOutlined />} />
          <Dropdown menu={{ items: roleMenuItems }} trigger={["click"]}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {displayName}
              </span>
              <span
                style={{
                  fontSize: 12,
                  opacity: 0.85,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                [Role: {roleLabel}]
                <DownOutlined style={{ fontSize: 10 }} />
              </span>
            </div>
          </Dropdown>
        </div>

        {/* tengah: breadcrumb */}
        <div className="basis-2/3 flex items-center pl-4">
          <DynamicBreadcrumb role={role} />
        </div>
      </div>
    </Header>
  );
}