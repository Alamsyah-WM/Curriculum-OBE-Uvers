// service/cpmk.ts

export type CpmkItem = {
  cpmk_id: string;
  mk_id: string;
  cpl_id: string;
  kode_cpmk: string;
  deskripsi: string;
  bobot: number;
  created_at: {
    _seconds: number;
    _nanoseconds: number;
  };
  prodi_id: string;
  nama_cpl: string;
  nama_mk: string;
  nama_prodi: string;
};

export type CpmkPayload = {
  mk_id: string;
  cpl_id: string;
  kode_cpmk: string;
  deskripsi: string;
};

type FetchCpmkParams = {
  prodiId?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchCpmk(
  params?: FetchCpmkParams
): Promise<CpmkItem[]> {
  const token = getToken();

  const url = new URL("http://localhost:3000/api/cpmk");

  if (params?.prodiId) {
    url.searchParams.set("prodi_id", params.prodiId);
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
    throw new Error(`Failed to fetch CPMK, status: ${res.status}`);
  }

  const data = await res.json();
  return data as CpmkItem[];
}

export async function postCpmk(payload: CpmkPayload): Promise<string> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/cpmk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post CPMK, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "CPMK berhasil ditambahkan";
}

export async function updateCpmk(
  cpmkId: string,
  payload: CpmkPayload
): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/cpmk/${cpmkId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update CPMK, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "CPMK berhasil diperbarui";
}

export async function deleteCpmk(cpmkId: string): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/cpmk/${cpmkId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete CPMK, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string"
    ? data
    : data?.message ?? "CPMK berhasil dihapus";
}