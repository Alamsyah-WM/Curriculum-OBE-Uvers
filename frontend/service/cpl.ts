export interface CpmkItem {
  cpmk_id: string;
  kode_cpmk: string;
  bobot: number;
  nilai: number;
  bobotPercentage: number;
  formatted_bobot: string;
  formatted_nilai: string;
}

export interface MataKuliahItem {
  mk_id: string;
  nama_mk: string;
  bobot: number;
  nilai: number;
  cpmks: CpmkItem[];
  bobotPercentage: number;
  formatted_bobot: string;
  formatted_nilai: string;
}

export interface CplAchievement {
  cpl_id: string;
  kode_cpl: string;
  deskripsi: string;
  finalScore: number;
  formattedScore: string;
  status: string;
  statusColor: string;
  barColor: string;
  totalEarnedScore: number;
  totalTargetScore: number;
  formattedHeaderScore: string;
  isEvaluated: boolean;
  evaluatorCount: number;
  mata_kuliahs: MataKuliahItem[];
}

export type CplItem = {
  cpl_id: string;
  deskripsi: string;
  kode_cpl: string;
  pl_id?: string;
  referensi: string;
  created_at?: {
    _seconds: number;
    _nanoseconds: number;
  };
  pl_ids: string[];
  profile_display: string | null;
  profile_display_2: string | null;
  prodi_id: string;
};

export type CplPayload = {
  pl_ids: string[];
  kode_cpl: string;
  deskripsi: string;
  referensi: string;
};


export type ProdiTabKey = "tif" | "tpl" | "si";

export async function fetchCplAchievement(
  prodiId: string,
  angkatan?: string[]
): Promise<CplAchievement[]> {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const url = new URL(`http://localhost:3000/api/cpl/achievement/prodi/${prodiId}`);
  if (angkatan && angkatan.length > 0) {
    url.searchParams.set("angkatan", angkatan.join(","));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch CPL untuk prodi: ${prodiId}`);
  }

  return res.json();
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchCpl(prodiId?: string): Promise<CplItem[]> {
  const token = getToken();

  const url = new URL("http://localhost:3000/api/cpl");

  if (prodiId) {
    url.searchParams.set("prodi_id", prodiId);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch CPL, status: ${res.status}`);
  }

  const data = await res.json();
  return data as CplItem[];
}

export async function postCpl(payload: CplPayload): Promise<string> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/cpl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post CPL, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "CPL berhasil ditambahkan";
}

export async function updateCpl(
  cplId: string,
  payload: CplPayload
): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/cpl/${cplId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update CPL, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "CPL berhasil diperbarui";
}

export async function deleteCpl(cplId: string): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/cpl/${cplId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete CPL, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "CPL berhasil dihapus";
}