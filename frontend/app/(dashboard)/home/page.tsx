"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { roleConfig } from "@/config/role";
import DekanHome from "@/component/dashboard/home/DekanHome";
import KaprodiHome from "@/component/dashboard/home/KaprodiHome";
import AdminHome from "@/component/dashboard/home/AdminHome";
import DosenHome from "@/component/dashboard/home/DosenHome";

export default function DashboardPage() {
  const [role, setRole] = useState<string>("");
  const router = useRouter();

  // Redirect if role has a different landing page
  useEffect(() => {
    if (role) {
      const homePath = roleConfig[role as keyof typeof roleConfig]?.homePath;
      if (homePath && homePath !== "/home") {
        router.replace(homePath);
      }
    }
  }, [role, router]);

  //  Handler update role
  const updateRoleFromStorage = useCallback(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole && storedRole !== role) {
      setRole(storedRole);
    }
  }, [role]);

  useEffect(() => {
    // Initial load
    updateRoleFromStorage();

    //  CUSTOM EVENT + storage event (SAME seperti AppSider)
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

  if (!role) {
    return <div>Loading...</div>;
  }

  switch (role) {
    case "dekan":
      return <DekanHome />;
    case "kaprodi":
      return <KaprodiHome />;
    case "admin":
      return <AdminHome />;
    case "dosen":
      return <DosenHome />;
    default:
      return <div>Role tidak dikenali: {role}</div>;
  }
}