"use client";

import React, { useState, useCallback } from "react";
import DekanStudent from "@/component/dashboard/student/DekanStudent"; // BARU
import KaprodiStudent from "@/component/dashboard/student/KaprodiStudent"; // BARU
import DosenStudent from "@/component/dashboard/student/DosenStudent"; // BARU
import AdminStudent from "@/component/dashboard/student/AdminStudent"; // BARU

export default function StudentPage() {
  const [role, setRole] = useState<string>("");

  // 🔥 Role listener (sama seperti home!)
  const updateRoleFromStorage = useCallback(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole && storedRole !== role) {
      setRole(storedRole);
    }
  }, [role]);

  React.useEffect(() => {
    updateRoleFromStorage();
    const handleRoleChange = () => updateRoleFromStorage();
    window.addEventListener("roleChanged", handleRoleChange);
    window.addEventListener("storage", (e) => e.key === "role" && handleRoleChange());
    return () => {
      window.removeEventListener("roleChanged", handleRoleChange);
      window.removeEventListener("storage", handleRoleChange);
    };
  }, [updateRoleFromStorage]);

  if (!role) return <div>Loading...</div>;

  switch (role) {
    case "dekan":
      return <DekanStudent />;
    case "kaprodi":
      return <KaprodiStudent />;
    case "dosen":
      return <DosenStudent />;
    case "admin":
      return <AdminStudent />;
    default:
      return <div>Role tidak dikenali</div>;
  }
}