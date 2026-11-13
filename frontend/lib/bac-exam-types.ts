export const BAC_EXAM_EXERCISE_TYPES = [
  "grid_mcq",
  "output_display",
  "data_sets",
  "code_full",
  "code_function",
  "code_fill",
  "pseudocode_modify",
  "pseudocode_composite",
  "cpp_struct",
  "flexible_answer",
  "code_with_explanation",
] as const;

export type BacExamExerciseType = (typeof BAC_EXAM_EXERCISE_TYPES)[number];
export type BacExamSection = "I" | "II" | "III";

export type BacExamTestForm = {
  label: string;
  input_data: string;
  expected_output: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  output_type: "stdout" | "file" | "both";
  input_source: "stdin" | "file";
  input_filename: string;
  output_filename: string;
  points: number;
  is_visible: boolean;
  sort_order: number;
};

export type BacExamImageForm = {
  file_name: string;
  file_base64: string;
  alt_text: string;
  preview_url?: string;
};

export type BacExamExerciseForm = {
  internal_code: string;
  title: string;
  section: BacExamSection;
  exercise_type: BacExamExerciseType;
  sort_order: number;
  max_points: number;
  config: Record<string, unknown>;
  grading_rules: Record<string, unknown>;
  default_feedback: string;
  images: BacExamImageForm[];
  tests: BacExamTestForm[];
};

export type BacExamSubjectForm = {
  title: string;
  session_label: string;
  year: number;
  variant_label: string;
  profile_id: number;
  duration_minutes: number;
  is_active: boolean;
  points_subject_i: number;
  points_subject_ii: number;
  points_subject_iii: number;
  points_oficiu: number;
  grade_divisor: number;
  exercises: BacExamExerciseForm[];
};

export const EXERCISE_TYPE_LABELS: Record<BacExamExerciseType, string> = {
  grid_mcq: "Grila A/B/C/D",
  output_display: "Ce se afiseaza",
  data_sets: "Seturi de date (pseudocod)",
  code_full: "Program C++ complet",
  code_function: "Implementare functie",
  code_fill: "Completeaza secventa",
  pseudocode_modify: "Modifica pseudocod (Blockly)",
  pseudocode_composite: "Problema pseudocod 2.1 (a+b+c+d)",
  cpp_struct: "Structura C/C++",
  flexible_answer: "Raspuns flexibil / matematic",
  code_with_explanation: "Program + explicatie (AI)",
};

export function defaultSubjectForm(): BacExamSubjectForm {
  return {
    title: "Subiect Bac Informatica",
    session_label: "Simulare",
    year: 2026,
    variant_label: "1",
    profile_id: 1,
    duration_minutes: 180,
    is_active: false,
    points_subject_i: 20,
    points_subject_ii: 40,
    points_subject_iii: 30,
    points_oficiu: 10,
    grade_divisor: 10,
    exercises: [
      {
        internal_code: "S1-1",
        title: "Grila 1",
        section: "I",
        exercise_type: "grid_mcq",
        sort_order: 1,
        max_points: 4,
        config: { correct_answer: "a" },
        grading_rules: {},
        default_feedback: "",
        images: [],
        tests: [],
      },
    ],
  };
}

export function defaultTest(): BacExamTestForm {
  return {
    label: "",
    input_data: "",
    expected_output: "",
    time_limit_ms: 2000,
    memory_limit_mb: 128,
    output_type: "stdout",
    input_source: "stdin",
    input_filename: "bac.in",
    output_filename: "bac.out",
    points: 1,
    is_visible: false,
    sort_order: 0,
  };
}

export type PseudocodeCompositeConfig = {
  part_a: { expected_output: string; points: number };
  part_b: {
    reference_code: string;
    target_output: string;
    required_sets: number;
    points: number;
    require_distinct: boolean;
  };
  part_c: { points: number; wrapper_template: string };
  part_d: {
    initial_blockly_xml: string;
    points: number;
    required_block_types: string[];
    forbidden_block_types: string[];
    required_cpp_regex: string[];
    forbidden_cpp_regex: string[];
    forbid_old_structure: boolean;
    grading_weights: { structure: number; tests: number };
  };
  part_d_tests: BacExamTestForm[];
};

export function defaultPseudocodeCompositeConfig(): PseudocodeCompositeConfig {
  return {
    part_a: { expected_output: "", points: 4 },
    part_b: { reference_code: "", target_output: "", required_sets: 2, points: 6, require_distinct: true },
    part_c: { points: 6, wrapper_template: "" },
    part_d: {
      initial_blockly_xml: "",
      points: 4,
      required_block_types: [],
      forbidden_block_types: [],
      required_cpp_regex: [],
      forbidden_cpp_regex: [],
      forbid_old_structure: true,
      grading_weights: { structure: 1, tests: 3 },
    },
    part_d_tests: [defaultTest(), defaultTest()],
  };
}

export function compositeMaxPoints(cfg: PseudocodeCompositeConfig): number {
  return cfg.part_a.points + cfg.part_b.points + cfg.part_c.points + cfg.part_d.points;
}

export function parseCompositeConfig(raw: Record<string, unknown>): PseudocodeCompositeConfig {
  const defaults = defaultPseudocodeCompositeConfig();
  const partA = (raw.part_a ?? {}) as Partial<PseudocodeCompositeConfig["part_a"]>;
  const partB = (raw.part_b ?? {}) as Partial<PseudocodeCompositeConfig["part_b"]>;
  const partC = (raw.part_c ?? {}) as Partial<PseudocodeCompositeConfig["part_c"]>;
  const partD = (raw.part_d ?? {}) as Partial<PseudocodeCompositeConfig["part_d"]>;
  const partDTests = Array.isArray(raw.part_d_tests) ? (raw.part_d_tests as BacExamTestForm[]) : defaults.part_d_tests;
  return {
    part_a: { ...defaults.part_a, ...partA },
    part_b: { ...defaults.part_b, ...partB },
    part_c: { ...defaults.part_c, ...partC },
    part_d: { ...defaults.part_d, ...partD, grading_weights: { ...defaults.part_d.grading_weights, ...partD.grading_weights } },
    part_d_tests: partDTests,
  };
}
