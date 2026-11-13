/** Randeaza un bloc <script type="application/ld+json"> cu escaping sigur (previne iesirea din tag prin "</script"). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
