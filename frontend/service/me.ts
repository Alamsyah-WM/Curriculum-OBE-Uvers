// src/service/me.ts
export type AuthMeResponse = {
  uid: string;
  dosen_id: string;
  nama_dosen: string;
  nidn: string;
  prodi_id: string;
  nama_prodi: string;
  roles: string[];
};

// helper ambil token dari localStorage atau cookie
function getToken(): string | null {
  if (typeof window === "undefined") return null;

  // kalau mau, kamu bisa simpan token ke localStorage saat login,
  // tapi sekarang cukup dari cookie
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));
  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch /auth/me, status: ${res.status}`);
  }

  const data = await res.json();
  return data as AuthMeResponse;
}