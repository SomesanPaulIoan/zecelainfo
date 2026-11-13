INSERT INTO problems (
  slug,
  title,
  statement,
  input_format,
  output_format,
  constraints,
  difficulty,
  time_limit_ms,
  memory_limit_mb,
  source,
  tags,
  is_published
)
VALUES (
  'interogari-cautare-binara',
  'Interogari de cautare binara',
  'Se da un vector sortat crescator cu n numere distincte si q interogari. Pentru fiecare valoare x din interogari, afiseaza 1 daca x exista in vector si 0 altfel. O solutie eficienta foloseste cautare binara pentru fiecare interogare.',
  'Prima linie contine n si q. A doua linie contine n numere sortate crescator. A treia linie contine q valori x.',
  'Afiseaza q linii, cate una pentru fiecare interogare: 1 daca valoarea exista, 0 daca nu exista.',
  '1 <= n, q <= 200000. Numerele au valori in intervalul [-10^9, 10^9].',
  'medium',
  700,
  128,
  'Antrenament zecelainfo',
  ARRAY['binary-search', 'vectori', 'interogari'],
  true
)
ON CONFLICT (slug) DO NOTHING;

WITH problem AS (
  SELECT id FROM problems WHERE slug = 'interogari-cautare-binara' LIMIT 1
)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
SELECT
  problem.id,
  t.input,
  t.expected_output,
  t.is_sample,
  t.points,
  t.order_index
FROM problem
JOIN (
  VALUES
    (
      E'5 5\n1 3 5 7 9\n3 4 9 1 8\n',
      E'1\n0\n1\n1\n0',
      true,
      10,
      1
    ),
    (
      E'6 4\n-5 -1 0 3 10 14\n14 2 -5 0\n',
      E'1\n0\n1\n1',
      true,
      10,
      2
    )
) AS t(input, expected_output, is_sample, points, order_index)
ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM test_cases tc
  WHERE tc.problem_id = problem.id AND tc.order_index = t.order_index
);

WITH problem AS (
  SELECT id FROM problems WHERE slug = 'interogari-cautare-binara' LIMIT 1
),
heavy_present AS (
  SELECT
    format(
      E'%s %s\n%s\n%s\n',
      50000,
      50000,
      (SELECT string_agg((i * 2 - 1)::text, ' ') FROM generate_series(1, 50000) AS i),
      (SELECT string_agg((i * 2 - 1)::text, ' ') FROM generate_series(1, 50000) AS i)
    ) AS input_data,
    (SELECT string_agg('1', E'\n') FROM generate_series(1, 50000)) AS expected_data
),
heavy_absent AS (
  SELECT
    format(
      E'%s %s\n%s\n%s\n',
      50000,
      50000,
      (SELECT string_agg((i * 2 - 1)::text, ' ') FROM generate_series(1, 50000) AS i),
      (SELECT string_agg((i * 2)::text, ' ') FROM generate_series(1, 50000) AS i)
    ) AS input_data,
    (SELECT string_agg('0', E'\n') FROM generate_series(1, 50000)) AS expected_data
)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
SELECT problem.id, hp.input_data, hp.expected_data, false, 40, 90
FROM problem
CROSS JOIN heavy_present hp
WHERE NOT EXISTS (
  SELECT 1 FROM test_cases tc WHERE tc.problem_id = problem.id AND tc.order_index = 90
)
UNION ALL
SELECT problem.id, ha.input_data, ha.expected_data, false, 40, 100
FROM problem
CROSS JOIN heavy_absent ha
WHERE NOT EXISTS (
  SELECT 1 FROM test_cases tc WHERE tc.problem_id = problem.id AND tc.order_index = 100
);
