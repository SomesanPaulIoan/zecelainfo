import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/bacalaureat/rezolva-subiecte",
          "/bacalaureat/examen",
          "/bacalaureat/subiect/*/simulare",
          "/bacalaureat/subiect/*/feedback",
          "/bacalaureat/subiect/*/submisie",
        ],
      },
    ],
    sitemap: "https://zecelainfo.ro/sitemap.xml",
  };
}
