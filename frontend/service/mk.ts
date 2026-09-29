// service/mk.ts

export type MkItem = {
  mk_id: string;
  kode_mk: string;
  nama_mk_id: string;
  nama_mk_en: string;
  prodi_id: string;
  semester: number;
  cpl_ids: string[];
  created_at: {
    _seconds: number;
    _nanoseconds: number;
  };
  dosen_id: string;
  nama_dosen: string;
  nama_prodi: string;
  cpl_display: string;
};

export type MkPayload = {
  kode_mk: string;
  nama_mk_id: string;
  nama_mk_en: string;
  prodi_id: string;
  dosen_id: string;
  semester: string;
  cpl_ids: string[];
};

type FetchMkParams = {
  prodiId?: string;
  semester?: string;
  dosenId?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchMk(params?: FetchMkParams): Promise<MkItem[]> {
  const token = getToken();

  const url = new URL("http://localhost:3000/api/mk");

  if (params?.prodiId) {
    url.searchParams.set("prodi_id", params.prodiId);
  }

  if (params?.semester) {
    url.searchParams.set("semester", params.semester);
  }

  if (params?.dosenId) {
    url.searchParams.set("dosen_id", params.dosenId);
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
    throw new Error(`Failed to fetch MK, status: ${res.status}`);
  }

  const data = await res.json();
  return data as MkItem[];
}

export async function postMk(payload: MkPayload): Promise<string> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/mk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post MK, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "Mata kuliah berhasil ditambahkan";
}

export async function updateMk(
  mkId: string,
  payload: MkPayload
): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/mk/${mkId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update MK, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "Mata kuliah berhasil diperbarui";
}

export async function deleteMk(mkId: string): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/mk/${mkId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete MK, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "Mata kuliah berhasil dihapus";
}