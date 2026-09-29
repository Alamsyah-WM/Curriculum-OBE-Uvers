// service/asesmen.ts

export type AsesmenItem = {
  asesmen_id: string;
  subcpmk_id: string;
  nama_asesmen: string;
  deskripsi: string;
  bobot: number;
  teknik_penilaian: string;
  created_at?: {
    _seconds: number;
    _nanoseconds: number;
  };
  kode_subcpmk: string;
  kode_cpmk: string;
  nama_mk: string;
  nama_prodi: string;
};

export type AsesmenPayload = {
  subcpmk_id: string;
  nama_asesmen: string;
  deskripsi: string;
  bobot: number;
  teknik_penilaian: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchAsesmen(): Promise<AsesmenItem[]> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/asesmen", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch asesmen, status: ${res.status}`);
  }

  return res.json();
}

export async function postAsesmen(payload: AsesmenPayload): Promise<any> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/asesmen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post asesmen, status: ${res.status}`);
  }

  return res.json();
}

export async function updateAsesmen(
  asesmenId: string,
  payload: AsesmenPayload
): Promise<any> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/asesmen/${asesmenId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update asesmen, status: ${res.status}`);
  }

  return res.json();
}

export async function deleteAsesmen(asesmenId: string): Promise<any> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/asesmen/${asesmenId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete asesmen, status: ${res.status}`);
  }

  return res.json();
}