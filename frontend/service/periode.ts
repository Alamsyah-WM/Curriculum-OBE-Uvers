// service/periode.ts

export type PeriodeItem = {
  periode_id: string;
  tahun_mulai: number;
  tahun_selesai: number;
  created_at?: {
    _seconds: number;
    _nanoseconds: number;
  };
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

// Ambil semua periode
export async function fetchPeriode(): Promise<PeriodeItem[]> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/periode", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to fetch periode, status: ${res.status}`);
  return res.json() as Promise<PeriodeItem[]>;
}

// Tambah periode baru
export async function postPeriode(payload: { tahun_mulai: number; tahun_selesai: number }): Promise<PeriodeItem> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/periode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to create periode, status: ${res.status}`);
  return res.json() as Promise<PeriodeItem>;
}

// Update periode
export async function updatePeriode(
  periodeId: string,
  payload: { tahun_mulai: number; tahun_selesai: number }
): Promise<PeriodeItem> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/periode/${periodeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to update periode, status: ${res.status}`);
  return res.json() as Promise<PeriodeItem>;
}

// Delete periode
export async function deletePeriode(periodeId: string): Promise<void> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/periode/${periodeId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error(`Failed to delete periode, status: ${res.status}`);
}

// Helper format periode
export function formatPeriode(periode: PeriodeItem): string {
  return `${periode.tahun_mulai} - ${periode.tahun_selesai}`;
}