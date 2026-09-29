// app/(dashboard)/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { App, Layout, Spin } from "antd";
import AppHeader from "@/component/AppHeader";
import AppSider from "@/component/AppSider";
import { fetchAuthMe, AuthMeResponse } from "@/service/me";
import { useRouter } from "next/navigation";

const { Content } = Layout;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const data: AuthMeResponse = await fetchAuthMe();

        // simpan profil dan roles di localStorage
        localStorage.setItem("userProfile", JSON.stringify(data));
        if (data.roles && data.roles.length > 0) {
          localStorage.setItem("roles", JSON.stringify(data.roles));
          const existingRole = localStorage.getItem("role");
          if (!existingRole) {
            localStorage.setItem("role", data.roles[0]);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to fetch /auth/me in dashboard layout:",
          err
        );
        // hapus token yang invalid agar tidak loop
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
        localStorage.removeItem("role");
        localStorage.removeItem("roles");
        localStorage.removeItem("userProfile");

        // kalau token invalid / tidak ada, balikan ke login
        router.push("/login");
      }
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin />
      </div>
    );
  }

  return (
    <App>
      <Layout>
        <AppHeader />
        <Layout hasSider>
          <AppSider />
          <Content>{children}</Content>
        </Layout>
      </Layout>
    </App>
  );
}