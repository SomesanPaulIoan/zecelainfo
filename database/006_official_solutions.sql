ALTER TABLE problems
ADD COLUMN IF NOT EXISTS official_solution TEXT;

UPDATE problems
SET official_solution = COALESCE(
  official_solution,
  'Soluția oficială va fi publicată în curând. Între timp, încearcă o abordare bazată pe pași clari: citește datele, aplică algoritmul potrivit și validează rezultatul pe exemple.'
);

ALTER TABLE problems
ALTER COLUMN official_solution SET NOT NULL;

ALTER TABLE problems
ALTER COLUMN official_solution SET DEFAULT
'Soluția oficială va fi publicată în curând. Între timp, încearcă o abordare bazată pe pași clari: citește datele, aplică algoritmul potrivit și validează rezultatul pe exemple.';

UPDATE problems
SET official_solution = CASE slug
  WHEN 'suma-doua-numere' THEN
    'Observație: problema cere doar suma a două numere întregi.\n\nPași:\n1) Citești a și b.\n2) Calculezi s = a + b.\n3) Afișezi s.\n\nComplexitate:\n- Timp: O(1)\n- Memorie: O(1)'
  WHEN 'maxim-din-vector' THEN
    'Idee: parcurgere liniară cu menținerea maximului curent.\n\nPași:\n1) Citești n și elementele vectorului.\n2) Inițializezi maximul cu primul element.\n3) Pentru fiecare element, dacă este mai mare decât maximul, actualizezi.\n4) Afișezi maximul final.\n\nComplexitate:\n- Timp: O(n)\n- Memorie: O(1)'
  WHEN 'subsecventa-crescatoare-maxima' THEN
    'Problema este LIS (Longest Increasing Subsequence).\n\nSoluție eficientă:\n- Menții un vector `tails`, unde `tails[k]` este cea mai mică valoare posibilă pentru finalul unei subsecvențe crescătoare de lungime `k + 1`.\n- Pentru fiecare element x, cauți binar prima poziție din `tails` cu valoare >= x și o înlocuiești.\n- Dacă nu există, adaugi x la final.\n\nRăspunsul este lungimea lui `tails`.\n\nComplexitate:\n- Timp: O(n log n)\n- Memorie: O(n)'
  WHEN 'interogari-cautare-binara' THEN
    'Ai un vector sortat și q interogări. Pentru fiecare x trebuie să verifici dacă există.\n\nSoluție:\n1) Pentru fiecare interogare aplici căutare binară în vector.\n2) Dacă găsești x, afișezi 1, altfel 0.\n\nDe ce e corect:\n- Vectorul este sortat, deci putem elimina jumătate din interval la fiecare pas.\n\nComplexitate:\n- Timp: O(q log n)\n- Memorie: O(1) suplimentar'
  ELSE official_solution
END;
