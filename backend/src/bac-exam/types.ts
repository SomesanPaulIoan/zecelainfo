/** Exercise types — extend here when adding new evaluator implementations. */
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

export type BacExamTestRow = {
  id: string;
  exercise_id: string;
  label: string | null;
  input_data: string;
  expected_output: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  output_type: "stdout" | "file" | "both";
  input_source: "stdin" | "file";
  input_filename: string | null;
  output_filename: string | null;
  points: number;
  is_visible: boolean;
  sort_order: number;
};

export type BacExamGradingRuleRow = {
  id: string;
  exercise_id: string;
  rule_key: string;
  rule_value: Record<string, unknown>;
  points: number;
  sort_order: number;
};

export type BacExamExerciseRow = {
  id: string;
  subject_id: string;
  internal_code: string;
  title: string | null;
  section: BacExamSection;
  exercise_type: BacExamExerciseType;
  sort_order: number;
  max_points: number;
  config: Record<string, unknown>;
  grading_rules: Record<string, unknown>;
  default_feedback: string | null;
};

export type BacExamExerciseImageRow = {
  id: string;
  exercise_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
};

export type BacExamSubjectRow = {
  id: string;
  title: string;
  session_label: string | null;
  year: number | null;
  variant_label: string | null;
  profile_id: number;
  duration_minutes: number;
  is_active: boolean;
  points_subject_i: number;
  points_subject_ii: number;
  points_subject_iii: number;
  points_oficiu: number;
  grade_divisor: number;
  metadata: Record<string, unknown>;
};

export type BacExamAnswerPayload = Record<string, unknown>;

export type BacExamBreakdownItem = {
  key: string;
  label: string;
  awarded: number;
  max: number;
  detail?: string;
};

export type BacExamTestRunResult = {
  test_id: string;
  label: string | null;
  verdict: string;
  points: number;
  max_points: number;
  time_ms: number;
  stdout?: string;
  stderr?: string;
  expected_output?: string;
  is_visible: boolean;
};

export type BacExamEvaluationResult = {
  awarded_points: number;
  max_points: number;
  breakdown: BacExamBreakdownItem[];
  feedback: string;
  test_results?: BacExamTestRunResult[];
  needs_ai?: boolean;
};

export type BacExamEvaluatorContext = {
  exercise: BacExamExerciseRow;
  tests: BacExamTestRow[];
  rules: BacExamGradingRuleRow[];
  answer: BacExamAnswerPayload;
  submissionId?: string;
};
