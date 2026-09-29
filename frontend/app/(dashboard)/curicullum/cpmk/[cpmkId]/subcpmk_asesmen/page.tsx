// app/(dashboard)/curicullum/cpmk/[cpmkId]/subcpmk_asesmen/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import SubCpmkAsesmenContent from "@/component/dashboard/curicullum/SubCpmkAsesmenContent";

export default function SubCpmkAsesmenPage() {
  const params = useParams<{ cpmkId: string }>();

  return <SubCpmkAsesmenContent cpmkId={params.cpmkId} />;
}