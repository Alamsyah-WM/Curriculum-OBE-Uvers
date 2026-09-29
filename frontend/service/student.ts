// src/services/student.ts

export type Mahasiswa = {
  mahasiswa_id: string;
  nama: string;
  nim: string;
  prodi_id: string;
  angkatan: string;
  nama_prodi: string;
  mk_ids: string[];
  created_at?: { _seconds: number; _nanoseconds: number };
};

// Ambil semua mahasiswa
export async function fetchMahasiswa(): Promise<Mahasiswa[]> {
  const res = await fetch("http://localhost:3000/api/mahasiswa", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch mahasiswa, status: ${res.status}`);
  return res.json();
}

// Ambil satu mahasiswa by ID
export async function fetchMahasiswaById(mahasiswaId: string): Promise<Mahasiswa> {
  const res = await fetch(`http://localhost:3000/api/mahasiswa/${mahasiswaId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch mahasiswa by id, status: ${res.status}`);
  return res.json() as Promise<Mahasiswa>;
}

// Ambil mahasiswa sesuai filter prodi + angkatan
export async function fetchMahasiswaFiltered(prodiId?: string, angkatan?: number): Promise<Mahasiswa[]> {
  const queryParams = new URLSearchParams();
  if (prodiId) queryParams.append("prodi_id", prodiId);
  if (angkatan) queryParams.append("angkatan", String(angkatan));

  const res = await fetch(`http://localhost:3000/api/mahasiswa?${queryParams.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch mahasiswa, status: ${res.status}`);
  return res.json() as Promise<Mahasiswa[]>;
}

// Tambah mahasiswa baru
export async function postMahasiswa(payload: {
  nama: string;
  nim: string;
  angkatan: string;
  prodi_id: string;
}): Promise<Mahasiswa> {
  const res = await fetch("http://localhost:3000/api/mahasiswa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create mahasiswa, status: ${res.status}`);
  return res.json();
}

// Update mahasiswa
export async function updateMahasiswa(mahasiswaId: string, payload: {
  nama: string;
  nim: string;
  angkatan: string;
  prodi_id: string;
}): Promise<Mahasiswa> {
  const res = await fetch(`http://localhost:3000/api/mahasiswa/${mahasiswaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update mahasiswa, status: ${res.status}`);
  return res.json();
}

// Delete mahasiswa
export async function deleteMahasiswa(mahasiswaId: string): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/mahasiswa/${mahasiswaId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete mahasiswa, status: ${res.status}`);
}

export async function updateMahasiswaKRS(
  mahasiswaId: string,
  mk_ids: string[]
): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/mahasiswa/${mahasiswaId}/krs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mk_ids }),
  });

  if (!res.ok) throw new Error(`Failed to update KRS, status: ${res.status}`);
}