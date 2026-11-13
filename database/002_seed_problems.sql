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
VALUES
  (
    'suma-doua-numere',
    'Suma a doua numere',
    'Se citesc doua numere intregi a si b. Afiseaza suma lor.',
    'Pe prima linie se afla doua numere intregi a si b.',
    'Afiseaza pe o singura linie valoarea a + b.',
    '-10^9 <= a, b <= 10^9',
    'easy',
    1000,
    64,
    'Bac model',
    ARRAY['introducere', 'aritmetica'],
    true
  ),
  (
    'maxim-din-vector',
    'Maxim din vector',
    'Se da un vector cu n elemente intregi. Determina valoarea maxima din vector.',
    'Prima linie contine n, iar a doua linie contine n numere intregi.',
    'Afiseaza elementul maxim din vector.',
    '1 <= n <= 100000',
    'easy',
    1000,
    64,
    'Admitere UBB',
    ARRAY['vectori'],
    true
  ),
  (
    'subsecventa-crescatoare-maxima',
    'Subsecventa crescatoare maxima',
    'Se da un sir de n numere. Determina lungimea celei mai lungi subsecvente strict crescatoare.',
    'Prima linie contine n, iar a doua linie contine n numere.',
    'Afiseaza lungimea maxima.',
    '1 <= n <= 200000',
    'medium',
    2000,
    128,
    'Pregatire admitere',
    ARRAY['dp', 'binary-search'],
    true
  )
ON CONFLICT (slug) DO NOTHING;

WITH p AS (
  SELECT id, slug FROM problems WHERE slug IN ('suma-doua-numere', 'maxim-din-vector')
)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
SELECT p.id, t.input, t.expected_output, t.is_sample, t.points, t.order_index
FROM p
JOIN (
  VALUES
    ('suma-doua-numere', '2 3', '5', true, 20, 1),
    ('suma-doua-numere', '10 -4', '6', false, 80, 2),
    ('maxim-din-vector', '5\n1 9 3 2 7', '9', true, 30, 1),
    ('maxim-din-vector', '6\n-1 -3 -2 -9 -4 -8', '-1', false, 70, 2)
) AS t(slug, input, expected_output, is_sample, points, order_index)
ON p.slug = t.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM test_cases tc
  WHERE tc.problem_id = p.id
    AND tc.input = t.input
    AND tc.expected_output = t.expected_output
);
