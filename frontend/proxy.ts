import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirect 301 de la URL-urile vechi `/grile?exam=<slug>[&view=chapters]` catre
 * `/grile/<slug>` si `/grile/<slug>/capitole`. Restul parametrilor (ex. `payment`, `attempt`) se pastreaza.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const exam = url.searchParams.get("exam");
  if (!exam || !/^[a-z0-9-]+$/.test(exam)) return NextResponse.next();

  const pathname = url.searchParams.get("view") === "chapters" ? `/grile/${exam}/capitole` : `/grile/${exam}`;
  const rest = new URLSearchParams(url.searchParams);
  rest.delete("exam");
  rest.delete("view");
  const query = rest.toString();
  // Next cere URL absolut; in spatele nginx `nextUrl` are protocolul intern (http), asa ca folosim
  // antetele trimise de nginx (`Host`, `X-Forwarded-Proto`) ca sa evitam un hop http→https in plus.
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  const host = request.headers.get("host") || url.host;
  const target = new URL(query ? `${pathname}?${query}` : pathname, `${proto}://${host}`);
  return NextResponse.redirect(target, 301);
}

export const config = {
  matcher: "/grile",
};
