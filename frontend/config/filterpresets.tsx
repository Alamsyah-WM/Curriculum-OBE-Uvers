// config/filterpresets.ts

export type FilterOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type FilterGroup = {
  key: string;
  title: string;
  mode: "single" | "multiple";
  options: FilterOption[];
};

export type SelectedFilters = Record<string, string[]>;

export type FilterPreset = "filter1" | "filter2" | "filter3" | "filter4" | "filter5" | "filter6";

type BuildFilterGroupsParams = {
  periodeYearOptions?: FilterOption[];
  prodiOptions?: FilterOption[];
};

const semesterOptions: FilterOption[] = Array.from({ length: 8 }, (_, index) => {
  const semester = index + 1;

  return {
    label: `Semester ${semester}`,
    value: String(semester),
  };
});

const teknikPenilaianOptions = [
  "Partisipasi (Quiz)",
  "Observasi (Praktik/Tugas)",
  "Tes Tulisan (UTS)",
  "Tes Tulisan (UAS)",
  "Unjuk Kerja (Presentasi Proyek)",
  "Analisis Partisipatif",
  "Tes Lisan (Tugas Kelompok)",
].map((item) => ({
  label: item,
  value: item,
}));

export function buildPeriodeYearOptions(periode: {
  tahun_mulai: number;
  tahun_selesai: number;
}): FilterOption[] {
  const years: FilterOption[] = [];

  for (
    let year = periode.tahun_mulai;
    year <= periode.tahun_selesai;
    year++
  ) {
    years.push({
      label: String(year),
      value: String(year),
    });
  }

  return years;
}

export function buildFilterGroups(
  preset: FilterPreset,
  params: BuildFilterGroupsParams
): FilterGroup[] {
  const periodeGroup: FilterGroup = {
    key: "tahun",
    title: "Periode",
    mode: "multiple",
    options: params.periodeYearOptions ?? [],
  };

  const prodiGroup: FilterGroup = {
    key: "prodi",
    title: "Prodi",
    mode: "multiple",
    options: params.prodiOptions ?? [],
  };

  const semesterGroup: FilterGroup = {
    key: "semester",
    title: "Semester",
    mode: "multiple",
    options: semesterOptions,
  };

  const penilaianGroup: FilterGroup = {
    key: "penilaian",
    title: "Teknik Penilaian",
    mode: "single",
    options: teknikPenilaianOptions,
  };

  switch (preset) {
    case "filter1":
      return [periodeGroup];

    case "filter2":
      return [prodiGroup, periodeGroup];

    case "filter3":
      return [prodiGroup];

    case "filter4":
      return [prodiGroup, semesterGroup];

    case "filter5":
      return [semesterGroup];

    case "filter6":
      return [
        { ...periodeGroup, mode: "single" },
        penilaianGroup,
      ];

    default:
      return [];
  }
}