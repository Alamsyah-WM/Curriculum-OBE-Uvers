"use client";

import { useEffect, useState } from "react";
import { Button, Flex } from "antd";
import { useRouter } from "next/navigation";
import "@/component/typhography.css";
import { UserOutlined, CrownOutlined, ClusterOutlined } from "@ant-design/icons";
import { roleConfig as globalRoleConfig } from "@/config/role";

const roleDisplayConfig: Record<string, {
  icon: React.ReactNode;
  label: string;
}> = {
  dosen: {
    icon: <UserOutlined />,
    label: "Dosen",
  },
  admin: {
    icon: <CrownOutlined />,
    label: "Admin",
  },
  kaprodi: {
    icon: <ClusterOutlined />,
    label: "Kaprodi",
  },
  dekan: {
    icon: <ClusterOutlined />,
    label: "Dekan",
  },
};

export default function Home() {
  const [roles, setRoles] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("roles");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRoles(parsed);
        }
      } catch (e) {
        console.error("Failed to parse roles from localStorage", e);
      }
    }
  }, []);

  const handleSelectRole = (role: string) => {
    console.log("Selected role:", role);
    localStorage.setItem("role", role);
    const homePath = globalRoleConfig[role as keyof typeof globalRoleConfig]?.homePath || "/home";
    router.push(homePath);
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        height: "100%",
      }}
    >
      <div
        style={{
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div
          className="title-large"
          style={{
            marginBottom: 8,
          }}
        >
          Select role👋
        </div>

        <div
          className="roboto-mono"
          style={{
            marginBottom: 12,
          }}
        >
          Login your account as
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {roles.length === 0 ? (
            <div className="title-small" style={{ opacity: 0.6 }}>
              Tidak ada role tersedia.
            </div>
          ) : (
            roles.map((role) => {
              const normalizedRole = role.trim().toLowerCase();
              const config = roleDisplayConfig[normalizedRole];

              if (!config) {
                console.warn("Role tidak dikenali:", role);
                return null;
              }

              return (
                <Button
                  key={normalizedRole}
                  type="primary"
                  style={{
                    backgroundColor: "#016FB9",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    height: "100px",
                    width: "100px",
                    padding: "10px 10px",
                  }}
                  onClick={() => handleSelectRole(normalizedRole)}
                >
                  <span style={{ fontSize: 30, lineHeight: 1 }}>
                    {config.icon}
                  </span>
                  <span className="title-small">{config.label}</span>
                </Button>
              );
            })
          )}
        </div>
      </div>
    </Flex>
  );
}