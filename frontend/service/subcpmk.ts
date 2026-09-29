// service/subcpmk.ts

export type SubcpmkItem = {
  subcpmk_id: string;
  cpmk_id: string;
  kode_subcpmk: string;
  deskripsi: string;
  bobot: number;
  created_at?: {
    _seconds: number;
    _nanoseconds: number;
  };
  kode_cpmk: string;
  nama_mk: string;
  nama_prodi: string;
  mk_id: string;
  prodi_id: string;
};

export type SubcpmkPayload = {
  cpmk_id: string;
  kode_subcpmk: string;
  deskripsi: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchSubcpmk(): Promise<SubcpmkItem[]> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/subcpmk", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch SubCPMK, status: ${res.status}`);
  }

  return res.json();
}

export async function postSubcpmk(payload: SubcpmkPayload): Promise<any> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/subcpmk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post SubCPMK, status: ${res.status}`);
  }

  return res.json();
}

export async function updateSubcpmk(
  subcpmkId: string,
  payload: SubcpmkPayload
): Promise<any> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/subcpmk/${subcpmkId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update SubCPMK, status: ${res.status}`);
  }

  return res.json();
}

export async function deleteSubcpmk(subcpmkId: string): Promise<any> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/subcpmk/${subcpmkId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete SubCPMK, status: ${res.status}`);
  }

  return res.json();
}