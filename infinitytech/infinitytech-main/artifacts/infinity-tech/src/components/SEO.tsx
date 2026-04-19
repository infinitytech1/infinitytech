import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

const BASE_URL = "https://infinitytech.dev";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  lang?: "en" | "ar";
  noIndex?: boolean;
  jsonLd?: object | object[];
  type?: "website" | "article" | "profile";
}

export function SEO({
  title,
  description = "Hardware Engineer & PCB Design specialist — multi-layer HDI boards, embedded systems, and production-ready firmware. From schematic to silicon.",
  keywords = "hardware engineer, PCB design, embedded systems, firmware, robotics, STM32, FPGA, KiCad, Altium",
  image = `${BASE_URL}/opengraph.jpg`,
  lang = "en",
  noIndex = false,
  jsonLd,
  type = "website",
}: SEOProps) {
  const [location] = useLocation();
  const canonical = `${BASE_URL}${location === "/" ? "" : location}`;
  const altLang = lang === "en" ? "ar" : "en";
  const fullTitle = title
    ? `${title} — INFINITY.TECH`
    : "INFINITY.TECH — Fares Salah · Hardware Engineer & PCB Design";

  const schemas = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    : [];

  return (
    <Helmet>
      {/* Core */}
      <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Fares Salah" />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical + hreflang */}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang={lang} href={canonical} />
      <link rel="alternate" hrefLang={altLang} href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="INFINITY.TECH" />
      <meta property="og:locale" content={lang === "ar" ? "ar_SA" : "en_US"} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@infinitytech_dev" />

      {/* JSON-LD */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "INFINITY.TECH",
  url: BASE_URL,
  description: "Hardware engineering portfolio of Fares Salah — PCB design, embedded systems, and robotics.",
  author: {
    "@type": "Person",
    name: "Fares Salah",
    jobTitle: "Hardware Engineer & PCB Design Specialist",
    url: BASE_URL,
    sameAs: [
      "https://linkedin.com/in/fares-salah-eng",
      "https://github.com/infinitytech-dev",
    ],
  },
};

export const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Fares Salah",
  jobTitle: "Hardware Engineer & PCB Design Specialist",
  description: "Hardware engineer specializing in multi-layer PCB design, bare-metal firmware, and production-ready embedded systems.",
  url: BASE_URL,
  email: "fares@infinitytech.dev",
  knowsAbout: [
    "PCB Design", "Embedded Systems", "Firmware Development",
    "STM32", "FPGA", "KiCad", "Altium Designer",
    "ROS2", "Edge AI", "Power Electronics",
  ],
  sameAs: [
    "https://linkedin.com/in/fares-salah-eng",
    "https://github.com/infinitytech-dev",
  ],
};

export function projectToJsonLd(project: {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  githubUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: `${BASE_URL}/projects/${project.id}`,
    author: {
      "@type": "Person",
      name: "Fares Salah",
      url: BASE_URL,
    },
    keywords: project.tags.join(", "),
    dateCreated: project.createdAt,
    dateModified: project.updatedAt,
    ...(project.githubUrl && { sameAs: project.githubUrl }),
    creativeWorkStatus: project.status === "completed" ? "Published" : "InProgress",
  };
}
