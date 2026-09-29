export type NilaiItem = {
  id: string;
  cpmk_id: string;
  asesmen_id: string;
  mahasiswa_id: string;
  mk_id: string;
  subcpmk_id: string;
  updated_at: {
    _seconds: number;
    _nanoseconds: number;
  };
  nilai: number;
  kode_mk: string;
  nama_mk: string;
  kode_subcpmk: string;
  nama_asesmen: string;
  bobot?: number;
};

export type CreateNilaiPayload = {
  mahasiswa_id: string;
  mk_id: string;
  cpmk_id: string;
  subcpmk_id: string;
  asesmen_id: string;
  nilai: number;
};

export async function fetchNilaiByMahasiswa(
  mahasiswaId: string
): Promise<NilaiItem[]> {
  const res = await fetch(`http://localhost:3000/api/nilai/${mahasiswaId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch nilai, status: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json) ? json : [json];
  return data as NilaiItem[];
}

export async function fetchNilaiByProdi(
  prodiId: string
): Promise<NilaiItem[]> {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
      : null;

  const res = await fetch(`http://localhost:3000/api/nilai/prodi/${prodiId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch nilai by prodi, status: ${res.status}`);
  }

  return res.json();
}


export async function postNilai(payload: CreateNilaiPayload): Promise<string> {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
      : null;

  const res = await fetch("http://localhost:3000/api/nilai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post nilai, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string" ? data : data?.message ?? "berhasil di input";
}