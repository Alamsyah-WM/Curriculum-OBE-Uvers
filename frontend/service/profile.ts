export type ProfileLulusanItem = {
  pl_id: string;
  kode_pl: string;
  profesi: string;
  periode_id: string;
  prodi_id: string;
  referensi: string;
  deskripsi: string;
  created_at?: {
    _seconds: number;
    _nanoseconds: number;
  };
  periode_display: string;
  prodi_display: string;
};

export type ProfileLulusanPayload = {
  periode_id: string;
  prodi_id: string;
  kode_pl: string;
  profesi: string;
  referensi: string;
  deskripsi: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));

  return cookie ? cookie.split("=")[1] : null;
}

export async function fetchProfileLulusan(
  periodeId?: string
): Promise<ProfileLulusanItem[]> {
  const token = getToken();

  const url = new URL("http://localhost:3000/api/profile");

  if (periodeId) {
    url.searchParams.set("periode_id", periodeId);
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
    throw new Error(`Failed to fetch profile lulusan, status: ${res.status}`);
  }

  const data = await res.json();
  return data as ProfileLulusanItem[];
}

export async function postProfileLulusan(
  payload: ProfileLulusanPayload
): Promise<string> {
  const token = getToken();

  const res = await fetch("http://localhost:3000/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to post profile lulusan, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string" ? data : data?.message ?? "Berhasil tambah profile lulusan";
}

export async function updateProfileLulusan(
  plId: string,
  payload: ProfileLulusanPayload
): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/profile/${plId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update profile lulusan, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string" ? data : data?.message ?? "Berhasil update profile lulusan";
}

export async function deleteProfileLulusan(plId: string): Promise<string> {
  const token = getToken();

  const res = await fetch(`http://localhost:3000/api/profile/${plId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete profile lulusan, status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data === "string" ? data : data?.message ?? "Berhasil hapus profile lulusan";
}