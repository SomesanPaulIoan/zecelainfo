import { pgPool } from "../db/postgres";
import { evaluateExercise } from "./evaluators";
import type {
  BacExamExerciseRow,
  BacExamGradingRuleRow,
  BacExamSubjectRow,
  BacExamTestRow,
} from "./types";

export async function loadSubjectBundle(subjectId: string) {
  const subjectResult = await pgPool.query<BacExamSubjectRow>(
    `SELECT id, title, session_label, year, variant_label, profile_id, duration_minutes, is_active,
            points_subject_i::float8 AS points_subject_i,
            points_subject_ii::float8 AS points_subject_ii,
            points_subject_iii::float8 AS points_subject_iii,
            points_oficiu::float8 AS points_oficiu,
            grade_divisor::float8 AS grade_divisor,
            metadata
     FROM bac_exam_subjects WHERE id = $1 LIMIT 1`,
    [subjectId],
  );
  const subject = subjectResult.rows[0];
  if (!subject) return null;

  const exercisesResult = await pgPool.query<BacExamExerciseRow>(
    `SELECT id, subject_id, internal_code, title, section, exercise_type, sort_order,
            max_points::float8 AS max_points, config, grading_rules, default_feedback
     FROM bac_exam_exercises
     WHERE subject_id = $1
     ORDER BY sort_order ASC, internal_code ASC`,
    [subjectId],
  );

  const exerciseIds = exercisesResult.rows.map((e) => e.id);
  let images: Array<{ id: string; exercise_id: string; image_url: string; alt_text: string | null; sort_order: number }> = [];
  let tests: BacExamTestRow[] = [];
  let rules: BacExamGradingRuleRow[] = [];

  if (exerciseIds.length > 0) {
    const imagesResult = await pgPool.query(
      `SELECT id, exercise_id, image_url, alt_text, sort_order
       FROM bac_exam_exercise_images
       WHERE exercise_id = ANY($1::uuid[])
       ORDER BY sort_order ASC`,
      [exerciseIds],
    );
    images = imagesResult.rows;

    const testsResult = await pgPool.query<BacExamTestRow>(
      `SELECT id, exercise_id, label, input_data, expected_output, time_limit_ms, memory_limit_mb,
              output_type, input_source, input_filename, output_filename,
              points::float8 AS points, is_visible, sort_order
       FROM bac_exam_tests
       WHERE exercise_id = ANY($1::uuid[])
       ORDER BY sort_order ASC`,
      [exerciseIds],
    );
    tests = testsResult.rows;

    const rulesResult = await pgPool.query<BacExamGradingRuleRow>(
      `SELECT id, exercise_id, rule_key, rule_value, points::float8 AS points, sort_order
       FROM bac_exam_grading_rules
       WHERE exercise_id = ANY($1::uuid[])
       ORDER BY sort_order ASC`,
      [exerciseIds],
    );
    rules = rulesResult.rows;
  }

  return { subject, exercises: exercisesResult.rows, images, tests, rules };
}

export async function gradeSubmission(submissionId: string) {
  const submissionResult = await pgPool.query<{ id: string; subject_id: string; user_id: string }>(
    `SELECT id, subject_id, user_id FROM bac_exam_submissions WHERE id = $1 LIMIT 1`,
    [submissionId],
  );
  const submission = submissionResult.rows[0];
  if (!submission) throw new Error("Submission not found");

  const bundle = await loadSubjectBundle(submission.subject_id);
  if (!bundle) throw new Error("Subject not found");

  const answersResult = await pgPool.query<{ exercise_id: string; answer: Record<string, unknown> }>(
    `SELECT exercise_id, answer FROM bac_exam_submission_answers WHERE submission_id = $1`,
    [submissionId],
  );
  const answerByExercise = new Map(answersResult.rows.map((row) => [row.exercise_id, row.answer]));

  let totalPoints = Number(bundle.subject.points_oficiu || 0);
  const sectionTotals = { I: 0, II: 0, III: 0 } as Record<string, number>;

  for (const exercise of bundle.exercises) {
    const answer = answerByExercise.get(exercise.id) ?? {};
    const tests = bundle.tests.filter((t) => t.exercise_id === exercise.id);
    const rules = bundle.rules.filter((r) => r.exercise_id === exercise.id);

    const result = await evaluateExercise({
      exercise,
      tests,
      rules,
      answer,
      submissionId,
    });

    sectionTotals[exercise.section] = (sectionTotals[exercise.section] ?? 0) + result.awarded_points;
    totalPoints += result.awarded_points;

    await pgPool.query(
      `INSERT INTO bac_exam_submission_results
         (submission_id, exercise_id, awarded_points, max_points, breakdown, feedback, test_results, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, NOW())
       ON CONFLICT (submission_id, exercise_id) DO UPDATE
       SET awarded_points = EXCLUDED.awarded_points,
           max_points = EXCLUDED.max_points,
           breakdown = EXCLUDED.breakdown,
           feedback = EXCLUDED.feedback,
           test_results = EXCLUDED.test_results,
           updated_at = NOW()`,
      [
        submissionId,
        exercise.id,
        result.awarded_points,
        result.max_points,
        JSON.stringify(result.breakdown),
        result.feedback,
        result.test_results ? JSON.stringify(result.test_results) : null,
      ],
    );
  }

  const divisor = Number(bundle.subject.grade_divisor || 10);
  const finalGrade = divisor > 0 ? Number((totalPoints / divisor).toFixed(2)) : 0;

  await pgPool.query(
    `UPDATE bac_exam_submissions
     SET status = 'graded', total_points = $2, final_grade = $3, finished_at = COALESCE(finished_at, NOW()), updated_at = NOW()
     WHERE id = $1`,
    [submissionId, totalPoints, finalGrade],
  );

  return {
    submission_id: submissionId,
    total_points: totalPoints,
    final_grade: finalGrade,
    section_totals: sectionTotals,
    points_oficiu: Number(bundle.subject.points_oficiu || 0),
  };
}

export async function recalculateSubmissionTotals(submissionId: string) {
  const submissionResult = await pgPool.query<{ subject_id: string }>(
    `SELECT subject_id FROM bac_exam_submissions WHERE id = $1 LIMIT 1`,
    [submissionId],
  );
  const submission = submissionResult.rows[0];
  if (!submission) throw new Error("Submission not found");

  const bundle = await loadSubjectBundle(submission.subject_id);
  if (!bundle) throw new Error("Subject not found");

  const resultsResult = await pgPool.query<{ exercise_id: string; awarded_points: number }>(
    `SELECT exercise_id, awarded_points::float8 AS awarded_points FROM bac_exam_submission_results WHERE submission_id = $1`,
    [submissionId],
  );

  const pointsByExercise = new Map(resultsResult.rows.map((r) => [r.exercise_id, Number(r.awarded_points || 0)]));
  const sectionTotals = { I: 0, II: 0, III: 0 } as Record<string, number>;
  let totalPoints = Number(bundle.subject.points_oficiu || 0);

  for (const exercise of bundle.exercises) {
    const pts = pointsByExercise.get(exercise.id) ?? 0;
    sectionTotals[exercise.section] = (sectionTotals[exercise.section] ?? 0) + pts;
    totalPoints += pts;
  }

  const divisor = Number(bundle.subject.grade_divisor || 10);
  const finalGrade = divisor > 0 ? Number((totalPoints / divisor).toFixed(2)) : 0;

  await pgPool.query(
    `UPDATE bac_exam_submissions SET total_points = $2, final_grade = $3, updated_at = NOW() WHERE id = $1`,
    [submissionId, totalPoints, finalGrade],
  );

  return { total_points: totalPoints, final_grade: finalGrade, section_totals: sectionTotals };
}
