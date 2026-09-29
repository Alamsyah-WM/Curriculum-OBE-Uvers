// service/prodi.ts

export type ProdiItem = {
  prodi_id: string;
  nama_prodi: string;
  kode_prodi: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchProdi(): Promise<ProdiItem[]> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/prodi", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch prodi, status: ${res.status}`);
  }

  const data = await res.json();
  return data as ProdiItem[];
}

export async function postProdi(payload: {
  kode_prodi: string;
  nama_prodi: string;
}): Promise<{ message: string; prodi_id: string }> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/prodi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create prodi, status: ${res.status}`);
  }

  return res.json();
}

export async function updateProdi(
  prodiId: string,
  payload: {
    kode_prodi: string;
    nama_prodi: string;
  }
): Promise<{ message: string }> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/prodi/${prodiId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update prodi, status: ${res.status}`);
  }

  return res.json();
}

export async function deleteProdi(prodiId: string): Promise<void> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/prodi/${prodiId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete prodi, status: ${res.status}`);
  }
}