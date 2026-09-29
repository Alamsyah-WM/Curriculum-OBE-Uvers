// service/dosen.ts

export type DosenItem = {
  dosen_id: string;
  nidn: string;
  prodi_id: string;
  email: string;
  roles: string[];
  uid: string;
  periode_id?: string | null;
  angkatan?: number | null;
  dosenWali: boolean;
  created_at?: {
    _seconds: number;
    _nanoseconds: number;
  };
  nama_dosen: string;
  nama_prodi: string;
  periode_display?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

// GET semua dosen
export async function fetchDosen(): Promise<DosenItem[]> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/dosen", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch dosen, status: ${res.status}`);
  }

  return res.json() as Promise<DosenItem[]>;
}

// POST dosen baru
export async function postDosen(payload: {
  nama_dosen: string;
  nidn: string;
  email: string;
  password: string;
  prodi_id: string;
  periode_id?: string | null;
  angkatan?: number | null;
  roles: string[];
}): Promise<DosenItem> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/dosen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create dosen, status: ${res.status}`);
  }

  return res.json() as Promise<DosenItem>;
}

// PUT update dosen
export async function updateDosen(
  dosenId: string,
  payload: {
    nama_dosen: string;
    nidn: string;
    email: string;
    password?: string;
    prodi_id: string;
    periode_id?: string | null;
    angkatan?: number | null;
    roles: string[];
  }
): Promise<DosenItem> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/dosen/${dosenId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update dosen, status: ${res.status}`);
  }

  return res.json() as Promise<DosenItem>;
}

// DELETE dosen
export async function deleteDosen(dosenId: string): Promise<void> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/dosen/${dosenId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete dosen, status: ${res.status}`);
  }
}