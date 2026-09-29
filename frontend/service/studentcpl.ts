export type MahasiswaCplCpmk = {
  cpmk_id: string;
  kode_cpmk: string;
  bobot: number;
  nilai: number;
  bobotPercentage: number;
  formatted_bobot: string;
  formatted_nilai: string;
};

export type MahasiswaCplMk = {
  mk_id: string;
  nama_mk: string;
  bobot: number;
  nilai: number;
  cpmks: MahasiswaCplCpmk[];
  bobotPercentage: number;
  formatted_bobot: string;
  formatted_nilai: string;
};

export type MahasiswaCplAchievement = {
  cpl_id: string;
  kode_cpl: string;
  deskripsi: string;
  finalScore: number;
  formattedScore: string;
  status: string;
  statusColor: string;
  barColor: string;
  totalEarnedScore: number;
  totalTargetScore: number;
  formattedHeaderScore: string;
  isEvaluated: boolean;
  evaluatorCount: number;
  mata_kuliahs: MahasiswaCplMk[];
};

export async function fetchMahasiswaCplAchievement(
  mahasiswaId: string,
  prodiId: string
): Promise<MahasiswaCplAchievement[]> {
  const res = await fetch(
    `http://localhost:3000/api/cpl/achievement/mahasiswa/${mahasiswaId}?prodiId=${prodiId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch CPL mahasiswa, status: ${res.status}`
    );
  }

  const json = await res.json();
  return json as MahasiswaCplAchievement[];
}