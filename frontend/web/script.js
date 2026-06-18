const STORAGE_KEY = "brandforge_current_brand";
const SYSTEM_FONT_FALLBACK =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const LOADED_GOOGLE_FONTS = new Set();

const GOOGLE_FONT_MAP = {
  "playfair display": "Playfair+Display",
  montserrat: "Montserrat",
  poppins: "Poppins",
  inter: "Inter",
  roboto: "Roboto",
};

let currentBrandData = null;
let visualGenerationId = 0;

const PREVIEW_IMAGE_IDS = ["mockupHeroImg"];

const ARCHETYPES = {
  luxury: {
    label: "Luxury",
    imagePool: "luxury",
    sectionOrder: ["experience", "moodboard", "creative", "launch", "actions"],
  },
  technology: {
    label: "Technology",
    imagePool: "tech",
    sectionOrder: ["experience", "creative", "moodboard", "launch", "actions"],
  },
  food: {
    label: "Food & Beverage",
    imagePool: "food",
    sectionOrder: ["experience", "moodboard", "launch", "creative", "actions"],
  },
  fashion: {
    label: "Fashion",
    imagePool: "luxury",
    sectionOrder: ["experience", "moodboard", "creative", "launch", "actions"],
  },
  beauty: {
    label: "Beauty",
    imagePool: "beauty",
    sectionOrder: ["experience", "moodboard", "creative", "launch", "actions"],
  },
  wellness: {
    label: "Nature & Plants",
    imagePool: "nature",
    sectionOrder: ["experience", "creative", "moodboard", "launch", "actions"],
  },
  creative: {
    label: "Creative Studio",
    imagePool: "default",
    sectionOrder: ["experience", "moodboard", "creative", "launch", "actions"],
  },
  corporate: {
    label: "Corporate",
    imagePool: "finance",
    sectionOrder: ["experience", "creative", "moodboard", "launch", "actions"],
  },
};

const EDITORIAL_SLOTS = ["editorial-0", "editorial-1", "editorial-2", "editorial-3", "editorial-4", "editorial-5"];

let systemRevealObserver = null;
let revealObserver = null;

document.addEventListener("mousemove", (e) => {
  const glow = document.querySelector(".glow");
  if (!glow) return;
  const rect = glow.getBoundingClientRect();
  glow.style.left = (e.clientX - rect.width / 2) + "px";
  glow.style.top = (e.clientY - rect.height / 2) + "px";
});

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".features .card");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${index * 0.25}s`;
        entry.target.classList.add("show");
      }
    });
  }, { threshold: 0.2 });

  cards.forEach((card) => observer.observe(card));

  initMockupTabs();

  const saved = loadBrandData();
  if (saved) {
    currentBrandData = saved;
    document.getElementById("outputBox").classList.remove("hidden");
    renderBrandToUI(saved);
  }
});

function saveBrandData(data) {
  currentBrandData = data;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadBrandData() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {
    // ignore invalid stored data
  }
  return null;
}

function showPdfButton(show) {
  const btn = document.getElementById("downloadPdfBtn");
  if (show) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}

function clearPdfError() {
  const errorEl = document.getElementById("pdfError");
  errorEl.innerText = "";
  errorEl.classList.add("hidden");
}

function showPdfError(message) {
  const errorEl = document.getElementById("pdfError");
  errorEl.innerText = message;
  errorEl.classList.remove("hidden");
}

function getFontFamily(fontName) {
  if (!fontName) return "'Inter', sans-serif";
  const lower = fontName.toLowerCase();

  for (const [key, family] of [
    ["playfair display", "'Playfair Display', serif"],
    ["montserrat", "'Montserrat', sans-serif"],
    ["poppins", "'Poppins', sans-serif"],
    ["inter", "'Inter', sans-serif"],
    ["roboto", "'Roboto', sans-serif"],
  ]) {
    if (lower.includes(key)) return family;
  }

  if (lower.includes("luxury") || lower.includes("elegant")) return "'Playfair Display', serif";
  if (lower.includes("modern") || lower.includes("tech")) return "'Inter', sans-serif";
  if (lower.includes("bold") || lower.includes("startup")) return "'Montserrat', sans-serif";
  if (lower.includes("creative")) return "'Poppins', sans-serif";
  if (lower.includes("minimal")) return "'Roboto', sans-serif";

  return `'${fontName}', sans-serif`;
}

function resolveGoogleFontId(fontName) {
  const lower = (fontName || "").toLowerCase();
  for (const [key, googleId] of Object.entries(GOOGLE_FONT_MAP)) {
    if (lower.includes(key)) return googleId;
  }
  if (lower.includes("luxury") || lower.includes("elegant")) return "Playfair+Display";
  if (lower.includes("modern") || lower.includes("tech")) return "Inter";
  if (lower.includes("bold") || lower.includes("startup")) return "Montserrat";
  if (lower.includes("creative")) return "Poppins";
  if (lower.includes("minimal")) return "Roboto";
  return null;
}

function ensureFontLoaded(fontName) {
  const googleId = resolveGoogleFontId(fontName);
  if (!googleId || LOADED_GOOGLE_FONTS.has(googleId)) return;
  LOADED_GOOGLE_FONTS.add(googleId);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleId}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}

function getHeroFontFamily(fontName) {
  const googleId = resolveGoogleFontId(fontName);
  if (!googleId) return SYSTEM_FONT_FALLBACK;
  ensureFontLoaded(fontName);
  return `${getFontFamily(fontName)}, ${SYSTEM_FONT_FALLBACK}`;
}

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== "string") return `rgba(139, 92, 246, ${alpha})`;
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length !== 6) return `rgba(139, 92, 246, ${alpha})`;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(139, 92, 246, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyBrandTheme(data) {
  const colors = data.color_palette || {};
  const primary = colors.primary || "#8b5cf6";
  const secondary = colors.secondary || "#3b82f6";
  const accent = colors.accent || "#ec4899";
  const el = document.getElementById("generatedContent");

  el.style.setProperty("--brand-primary", primary);
  el.style.setProperty("--brand-secondary", secondary);
  el.style.setProperty("--brand-accent", accent);
  el.style.setProperty("--brand-primary-08", hexToRgba(primary, 0.08));
  el.style.setProperty("--brand-primary-15", hexToRgba(primary, 0.15));
  el.style.setProperty("--brand-primary-25", hexToRgba(primary, 0.25));
  el.style.setProperty("--brand-primary-40", hexToRgba(primary, 0.4));
  el.style.setProperty("--brand-secondary-20", hexToRgba(secondary, 0.2));
  el.style.setProperty("--brand-accent-30", hexToRgba(accent, 0.3));
  el.style.setProperty("--brand-glow", hexToRgba(primary, 0.35));
}

function resolveMoodboardStyle(visualDirection) {
  const text = (visualDirection || "").toLowerCase();
  if (text.includes("minimal") || text.includes("clean")) return "moodboard-minimal";
  if (text.includes("bold") || text.includes("vibrant")) return "moodboard-bold";
  if (text.includes("nature") || text.includes("organic") || text.includes("green")) return "moodboard-organic";
  if (text.includes("luxury") || text.includes("elegant")) return "moodboard-luxury";
  if (text.includes("tech") || text.includes("modern")) return "moodboard-tech";
  return "moodboard-default";
}

function classifyFromIdea(idea) {
  const text = (idea || "").trim().toLowerCase();
  if (!text) return null;

  if (
    /plant\s*shop|garden\s*center|flower\s*store|flower\s*shop|plant\s*nursery|plant\s*store|garden\s*store|greenhouse|succulent|houseplant|indoor\s*plant|botanical\s*garden|florist|nursery|garden\s*center/.test(
      text
    )
  ) {
    return "wellness";
  }

  if (
    /\b(plant|plants|garden|flora|flowers?|botanical|foliage|terrarium|herb\s*garden)\b/.test(text) &&
    !/beauty|cosmetic|skincare|makeup|lipstick|perfume|salon/.test(text)
  ) {
    return "wellness";
  }

  if (/beauty|cosmetic|skincare|makeup|lipstick|perfume|fragrance|salon|serum|moisturizer/.test(text)) {
    return "beauty";
  }

  if (
    /restaurant|mexican|taco|taqueria|cantina|dining|bistro|cuisine|chef|menu|bakery|food|cafe|coffee|kitchen|culinary|grill|pizza|sushi|tamales|enchilada/.test(
      text
    )
  ) {
    return "food";
  }

  if (/\bai\b|startup|saas|software|tech|digital\s*product|app\b|platform|developer|cloud|cyber|fintech|machine\s*learning/.test(text)) {
    return "technology";
  }

  if (/fashion|apparel|clothing|wear|runway|streetwear|couture|garment/.test(text)) return "fashion";

  if (/luxury|jewel|haute|premium\s*brand/.test(text) && !/plant|garden|nursery|flower/.test(text)) {
    return "luxury";
  }

  if (/finance|bank|invest|capital|fund|corporate|enterprise|consulting|b2b/.test(text)) {
    return "corporate";
  }

  if (/design|creative|agency|studio|art|portfolio/.test(text)) return "creative";

  return null;
}

function ideaSuggestsPlants(idea) {
  const text = (idea || "").trim().toLowerCase();
  return /plant|garden|nursery|flower|flora|botanical|greenhouse|succulent|houseplant|foliage|florist/.test(text);
}

function resolveArchetype(data) {
  const idea = data._brand_idea || "";
  const fromIdea = classifyFromIdea(idea);
  if (fromIdea) return fromIdea;

  const plantLocked = ideaSuggestsPlants(idea);

  const parts = [
    data.brand_name,
    data.tagline,
    data.logo_concept,
    data.sample_usage?.product_description,
  ];

  if (Array.isArray(data.brand_personality)) {
    data.brand_personality.forEach((p) => {
      if (typeof p === "string") parts.push(p);
      else if (p && typeof p === "object") parts.push(`${p.type || ""} ${p.description || ""}`);
    });
  }

  const text = parts.filter(Boolean).join(" ").toLowerCase();

  if (/fashion|apparel|clothing|wear|runway|streetwear|couture|garment/.test(text)) return "fashion";

  if (
    !plantLocked &&
    /perfume|fragrance|scent|cologne|parfum|aroma|beauty|cosmetic|skincare|makeup|lipstick/.test(text)
  ) {
    return "beauty";
  }

  if (
    /restaurant|mexican|taco|taqueria|cantina|dining|bistro|cuisine|chef|menu|bakery|food|cafe|coffee|kitchen|culinary|bar\s|grill|pizza|sushi|beverage|drink/.test(
      text
    )
  ) {
    return "food";
  }

  if (/tech|software|saas|digital|app|\bai\b|data|cloud|cyber|startup|platform|code|developer/.test(text)) {
    return "technology";
  }

  if (/luxury|elegant|premium|jewel|haute/.test(text) && !plantLocked) {
    if (/boutique/.test(text) && /fashion|apparel|beauty|luxury/.test(text)) return "luxury";
    if (!/boutique/.test(text)) return "luxury";
  }

  if (
    /wellness|yoga|spa|meditation|fitness|gym|sport|plant|nursery|botanical|garden|flora|organic|nature|leaf|greenhouse|succulent|houseplant/.test(
      text
    ) ||
    plantLocked
  ) {
    return "wellness";
  }

  if (/finance|bank|money|invest|capital|fund|fintech|corporate|enterprise|consulting|b2b/.test(text)) {
    return "corporate";
  }

  if (/design|creative|agency|studio|art|brand|portfolio/.test(text)) return "creative";
  return "creative";
}

function getImagePoolKey(archetype) {
  return ARCHETYPES[archetype]?.imagePool || "default";
}

function archetypeLogoKey(archetype) {
  return ARCHETYPES[archetype]?.imagePool || "default";
}

function buildLogoSvg(category, primary, secondary, initial) {
  const p = primary || "#8b5cf6";
  const s = secondary || "#3b82f6";
  const letter = (initial || "B").toUpperCase().charAt(0);

  const marks = {
    nature: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M60 18 C38 42 28 62 28 78 C28 94 42 104 60 104 C78 104 92 94 92 78 C92 62 82 42 60 18Z" fill="${p}"/><path d="M60 48 C52 58 48 68 48 76 C48 84 54 88 60 88 C66 88 72 84 72 76 C72 68 68 58 60 48Z" fill="${s}" opacity="0.85"/></svg>`,
    tech: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><polygon points="60,14 98,38 98,82 60,106 22,82 22,38" fill="none" stroke="${p}" stroke-width="6"/><circle cx="60" cy="60" r="14" fill="${s}"/><line x1="60" y1="14" x2="60" y2="46" stroke="${p}" stroke-width="4"/><line x1="98" y1="38" x2="74" y2="52" stroke="${p}" stroke-width="4"/><line x1="98" y1="82" x2="74" y2="68" stroke="${p}" stroke-width="4"/></svg>`,
    luxury: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="48" fill="none" stroke="${p}" stroke-width="3"/><text x="60" y="72" text-anchor="middle" font-family="Georgia,serif" font-size="42" fill="${s}">${letter}</text></svg>`,
    food: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="M30 78 Q60 38 90 78 L90 92 Q60 68 30 92Z" fill="${p}"/><ellipse cx="60" cy="82" rx="28" ry="10" fill="${s}" opacity="0.7"/></svg>`,
    finance: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="36" width="64" height="48" rx="8" fill="none" stroke="${p}" stroke-width="5"/><path d="M44 68 L56 52 L68 62 L76 48" fill="none" stroke="${s}" stroke-width="5" stroke-linecap="round"/></svg>`,
    beauty: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="44" y="24" width="32" height="72" rx="10" fill="none" stroke="${p}" stroke-width="5"/><ellipse cx="60" cy="28" rx="18" ry="8" fill="${s}" opacity="0.8"/><path d="M52 72 Q60 88 68 72" fill="none" stroke="${p}" stroke-width="4"/></svg>`,
    default: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="80" height="80" rx="22" fill="${p}"/><text x="60" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="#fff">${letter}</text></svg>`,
  };

  return marks[category] || marks.default;
}

const HERO_IMAGES = {
  nature: [
    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519331457843-f7758a4e8c4a?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1592150621744-aca8f683cbe4?w=1200&q=80&fit=crop",
  ],
  tech: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80&fit=crop",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd955f5cbbb?w=1200&q=80&fit=crop",
  ],
  food: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80&fit=crop",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=1200&q=80&fit=crop",
  ],
  finance: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80&fit=crop",
  ],
  default: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80&fit=crop",
  ],
};

const MOODBOARD_IMAGES = {
  nature: [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1491147334573-44cbb4602074?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1459411550351-94aa36cd4e2a?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519331457843-f7758a4e8c4a?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1592150621744-aca8f683cbe4?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1530836369251-97da7903f940?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1466692476867-aef1dfb1e735?w=600&q=80&fit=crop",
  ],
  tech: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80&fit=crop",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd955f5cbbb?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1515377901643-1a582a89f891?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop",
  ],
  food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb4b07?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&fit=crop",
  ],
  finance: [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&fit=crop",
  ],
  default: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&fit=crop",
  ],
};

const CATEGORY_HEADLINES = {
  nature: [
    "Bring Nature Home",
    "Greener Living Starts Here",
    "Plants For Modern Spaces",
    "Rooted In Everyday Life",
    "Where Green Meets Home",
  ],
  beauty: [
    "Rituals Worth Returning To",
    "Beauty Designed Around You",
    "Skincare That Feels Intentional",
    "Glow Built On Care",
    "Your Routine, Refined",
  ],
  tech: [
    "Build Smarter Systems",
    "AI That Works In Production",
    "Ship Faster With Confidence",
    "Software Built For Scale",
    "Turn Data Into Decisions",
  ],
  food: [
    "Flavors Worth Gathering For",
    "Made Fresh, Served With Soul",
    "Where Every Plate Tells A Story",
    "Taste The Difference Tonight",
    "Honest Food, Warm Welcome",
  ],
  luxury: [
    "Crafted For The Discerning",
    "Quiet Luxury, Lasting Impression",
    "Elevated By Design",
    "Where Detail Defines Experience",
    "Timeless By Intention",
  ],
  finance: [
    "Clarity For Every Decision",
    "Growth With Discipline",
    "Capital That Moves With Purpose",
    "Built On Trust And Insight",
    "Your Future, Strategically Managed",
  ],
  default: [
    "Built For What Comes Next",
    "Design That Earns Attention",
    "Clarity From Day One",
    "Made To Stand Out",
    "Start With Something Bold",
  ],
};

const GENERIC_HEADLINE_RE =
  /unlock your|radiance|nurture your space|experience excellence|^welcome$|your brand story|discover the|elevate your|transform your|unleash|embrace the|step into/i;

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function shuffleIndices(length, seedKey) {
  const indices = Array.from({ length }, (_, i) => i);
  let seed = hashString(seedKey);
  for (let i = indices.length - 1; i > 0; i--) {
    seed = hashString(`${seedKey}:shuffle:${seed}:${i}`);
    const j = seed % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function pickHeroImage(archetype, data) {
  const poolKey = getImagePoolKey(archetype);
  const pool = HERO_IMAGES[poolKey] || HERO_IMAGES.default;
  const unique = [...new Set(pool)];
  const seedKey = [archetype, poolKey, data.brand_name || "", data._brand_idea || "", visualGenerationId, "hero"].join("|");
  const index = hashString(seedKey) % unique.length;
  return unique[index];
}

function pickMoodboardImages(archetype, data, heroUrl) {
  const poolKey = getImagePoolKey(archetype);
  const pool = MOODBOARD_IMAGES[poolKey] || MOODBOARD_IMAGES.default;
  const unique = [...new Set(pool)].filter((url) => url !== heroUrl);
  const seedKey = [archetype, poolKey, data.brand_name || "", data._brand_idea || "", visualGenerationId, "moodboard"].join("|");
  const shuffled = shuffleIndices(unique.length, seedKey);
  const count = Math.min(6, unique.length);
  return shuffled.slice(0, count).map((i) => unique[i]);
}

function pickCategoryHeadline(poolKey, data) {
  const options = CATEGORY_HEADLINES[poolKey] || CATEGORY_HEADLINES.default;
  const seed = hashString([data._brand_idea || "", data.brand_name || "", visualGenerationId, "headline"].join("|"));
  return options[seed % options.length];
}

function resolveMockupHeadline(hero, poolKey, data) {
  const ai = (hero.headline || "").trim();
  if (ai && !GENERIC_HEADLINE_RE.test(ai)) return ai;
  return pickCategoryHeadline(poolKey, data);
}

function getCategoryLabel(poolKey) {
  const labels = {
    nature: "Nature",
    beauty: "Beauty",
    tech: "Technology",
    food: "Food & Beverage",
    luxury: "Luxury",
    finance: "Finance",
    default: "General",
  };
  return labels[poolKey] || labels.default;
}

function resolveBrandVisuals(data) {
  const archetype = resolveArchetype(data);
  const poolKey = getImagePoolKey(archetype);
  const heroImage = pickHeroImage(archetype, data);
  const moodboardImages = pickMoodboardImages(archetype, data, heroImage);

  console.log("Idea:", data._brand_idea || "");
  console.log("Industry:", getArchetypeLabel(archetype));
  console.log("Category:", getCategoryLabel(poolKey));
  console.log("Image Pool:", poolKey);

  return { archetype, poolKey, heroImage, images: moodboardImages };
}

function truncateText(text, maxLen) {
  const cleaned = String(text || "").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trim()}…`;
}

function applyArchetype(archetype) {
  const root = document.getElementById("archetypeRoot");
  root.className = `archetype-root archetype-${archetype}`;

  const mockup = document.getElementById("siteMockup");
  if (mockup) mockup.className = `site-mockup mockup-${archetype}`;

  applySectionOrder(archetype);
}

function applySectionOrder(archetype) {
  const config = ARCHETYPES[archetype] || ARCHETYPES.creative;
  const canvas = document.querySelector(".deck-canvas");
  if (!canvas) return;

  document.getElementById("brandMetaCompact").style.order = "1";

  config.sectionOrder.forEach((key, index) => {
    const el =
      key === "experience"
        ? document.getElementById("revealExperience")
        : document.querySelector(`[data-section="${key}"]`);
    if (el) el.style.order = String(index + 2);
  });
}

function clearVisualAssets() {
  PREVIEW_IMAGE_IDS.forEach((id) => {
    const img = document.getElementById(id);
    if (!img) return;
    delete img.dataset.visualSrc;
    img.removeAttribute("src");
    img.alt = "";
  });

  document.querySelectorAll(".editorial-cell img, .pin-item img").forEach((img) => {
    delete img.dataset.visualSrc;
    img.removeAttribute("src");
    img.alt = "";
  });

  const board = document.getElementById("editorialMoodboard");
  if (board) board.innerHTML = "";

  document.getElementById("brandMoodboardSection")?.classList.remove("is-expanded");
}

function getArchetypeLabel(archetype) {
  return ARCHETYPES[archetype]?.label || ARCHETYPES.creative.label;
}

function getStyleKeywords(data) {
  const hero = data.website_hero || {};
  const visualDirection = (hero.visual_direction || "").toLowerCase();
  const keywords = new Set();

  if (Array.isArray(data.brand_personality)) {
    data.brand_personality.forEach((p) => {
      if (typeof p === "string") keywords.add(p);
      else if (p?.type) keywords.add(p.type);
    });
  }

  [
    ["minimal", "Minimal"],
    ["clean", "Clean"],
    ["bold", "Bold"],
    ["luxury", "Luxury"],
    ["modern", "Modern"],
    ["organic", "Organic"],
    ["elegant", "Elegant"],
    ["vibrant", "Vibrant"],
  ].forEach(([token, label]) => {
    if (visualDirection.includes(token)) keywords.add(label);
  });

  if (!keywords.size) {
    keywords.add("Modern");
    keywords.add("Confident");
  }

  return Array.from(keywords).slice(0, 3);
}

function renderEditorialMoodboard(archetype, images) {
  const board = document.getElementById("editorialMoodboard");
  if (!board) return;

  const slice = images.slice(0, 6);
  const narrative = getArchetypeLabel(archetype);

  board.innerHTML = slice
    .map(
      (src, index) => `
      <figure class="editorial-cell ${EDITORIAL_SLOTS[index]}" data-editorial="${index}">
        <img class="editorial-cell-img" alt="" loading="lazy" />
      </figure>`
    )
    .join("");

  board.querySelectorAll(".editorial-cell-img").forEach((img, index) => {
    setMasonryImage(img, slice[index], `${narrative} visual reference`);
  });
}

function renderMetaHeader(data, archetype) {
  const typography = data.typography || {};
  const headingFont = typography.heading || "Montserrat";

  ensureFontLoaded(headingFont);

  const nameEl = document.getElementById("metaBrandName");
  nameEl.innerText = data.brand_name || "Your Brand";
  nameEl.style.fontFamily = getHeroFontFamily(headingFont);

  document.getElementById("metaCategory").innerText = getCategoryLabel(getImagePoolKey(archetype));

  const keywordRow = document.getElementById("metaStyleKeywords");
  keywordRow.innerHTML = "";
  getStyleKeywords(data).forEach((word) => {
    const span = document.createElement("span");
    span.className = "meta-keyword";
    span.innerText = word;
    keywordRow.appendChild(span);
  });

  document.getElementById("brandMetaCompact").classList.remove("hidden");
}

function renderMockupExtraPages(data) {
  const hero = data.website_hero || {};
  const brandName = data.brand_name || "Your Brand";
  const personality = Array.isArray(data.brand_personality) ? data.brand_personality : [];
  const featuresGrid = document.getElementById("mockupFeaturesGrid");

  const featureItems = personality.slice(0, 3).map((p, i) => {
    const title = typeof p === "string" ? p : p?.type || `Feature ${i + 1}`;
    const desc =
      typeof p === "object" && p?.description
        ? p.description
        : "Designed to deliver clarity and value at every touchpoint.";
    return { title, desc };
  });

  while (featureItems.length < 3) {
    featureItems.push({
      title: ["Clarity", "Speed", "Trust"][featureItems.length],
      desc: "Built to help your audience understand and believe in the brand.",
    });
  }

  featuresGrid.innerHTML = featureItems
    .map(
      (item) => `
      <div class="mockup-feature-item">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>`
    )
    .join("");

  document.getElementById("mockupAboutTitle").innerText = `About ${brandName}`;
  document.getElementById("mockupAboutBody").innerText =
    data.sample_usage?.product_description ||
    hero.subheadline ||
    `${brandName} exists to create meaningful experiences for its audience.`;

  const voiceText =
    data.brand_voice?.tone ||
    data.brand_voice?.description ||
    "Friendly, clear, and confident.";
  document.getElementById("mockupAboutQuote").innerText = `"${voiceText}"`;

  document.getElementById("mockupContactTitle").innerText = "Get in touch";
  document.getElementById("mockupContactBody").innerText =
    hero.subheadline || "We would love to hear from you.";
  document.getElementById("mockupContactCta").innerText =
    (hero.cta && hero.cta.trim()) || "Get Started";
  document.getElementById("mockupContactDomain").innerText = brandDomain(brandName);
}

function renderCreativeDirection(data) {
  const hero = data.website_hero || {};
  const visual = (hero.visual_direction || "").trim();
  const tone = (data.brand_voice?.tone || "").trim();
  const name = data.brand_name || "This brand";

  let text = "";
  if (visual && tone) {
    text = `${visual} — expressed with a ${tone.toLowerCase()} voice.`;
  } else if (visual) {
    text = visual.endsWith(".") ? visual : `${visual}.`;
  } else if (tone) {
    text = `${name} presents a ${tone.toLowerCase()} world with intentional restraint.`;
  } else {
    text = `${name} pairs clarity with character across every brand touchpoint.`;
  }

  const el = document.getElementById("creativeDirectionText");
  if (el) el.innerText = truncateText(text, 220);
}

function initMockupTabs() {
  const tabs = document.querySelectorAll(".mockup-tab");
  const pages = document.querySelectorAll(".mockup-page");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      const current = document.querySelector(".mockup-page.is-active");
      const next = document.querySelector(`.mockup-page[data-page="${target}"]`);
      if (!next || next === current) return;

      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));

      if (current) {
        current.classList.add("is-exiting");
        current.classList.remove("is-active");
        setTimeout(() => current.classList.remove("is-exiting"), 450);
      }

      next.classList.add("is-active");
    });
  });
}

function initSystemReveal() {
  const cards = document.querySelectorAll(".deck-system .system-card");
  if (!cards.length) return;

  if (systemRevealObserver) systemRevealObserver.disconnect();

  cards.forEach((card) => card.classList.remove("is-revealed"));

  systemRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const step = Number(entry.target.dataset.step) || 1;
        setTimeout(() => {
          entry.target.classList.add("is-revealed");
        }, (step - 1) * 130);
        systemRevealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  cards.forEach((card) => systemRevealObserver.observe(card));
}

function initMoodboardExpandObserver() {
  const section = document.getElementById("brandMoodboardSection");
  if (!section) return;

  section.classList.remove("is-expanded");

  const expandObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("is-expanded");
          section.querySelectorAll(".editorial-cell").forEach((cell, index) => {
            setTimeout(() => cell.classList.add("is-revealed"), index * 70);
          });
          expandObserver.unobserve(section);
        }
      });
    },
    { threshold: 0.12 }
  );

  expandObserver.observe(section);
}

function initRevealObserver() {
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal-stage.is-active").forEach((stage) => {
    stage.classList.remove("is-visible");
    revealObserver.observe(stage);
  });

  document.querySelectorAll(".editorial-cell").forEach((cell, index) => {
    cell.classList.remove("is-revealed");
    const cellObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            cellObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    cell.style.transitionDelay = `${index * 0.05}s`;
    cellObserver.observe(cell);
  });
}

function brandDomain(brandName) {
  const slug = (brandName || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return `${slug || "brand"}.com`;
}

function setMasonryImage(imgEl, src, alt) {
  if (!imgEl || !src) return;
  imgEl.alt = alt || "Brand inspiration";
  imgEl.onerror = () => {
    const fallback = MOODBOARD_IMAGES.default[0];
    if (imgEl.dataset.visualSrc !== fallback) {
      imgEl.dataset.visualSrc = fallback;
      imgEl.src = fallback;
    }
  };
  if (imgEl.dataset.visualSrc === src) return;
  imgEl.dataset.visualSrc = src;
  imgEl.removeAttribute("src");
  imgEl.src = src;
}

function renderSiteMockup(data, visuals) {
  const hero = data.website_hero && typeof data.website_hero === "object" ? data.website_hero : {};
  const colors = data.color_palette || {};
  const primary = colors.primary || "#8b5cf6";
  const secondary = colors.secondary || "#3b82f6";
  const accent = colors.accent || "#ec4899";
  const visualDirection = (hero.visual_direction && hero.visual_direction.trim()) || "";
  const logoKey = visuals.poolKey || archetypeLogoKey(visuals.archetype);
  const heroImage = visuals.heroImage;
  const images = visuals.images;
  const brandName = data.brand_name || "Your Brand";
  const headingFont = data.typography?.heading || "Montserrat";
  const bodyFont = data.typography?.body || "Inter";
  const imageAlt = visualDirection || `${brandName} homepage hero`;
  const initial = (brandName || "B").charAt(0);

  const preview = document.getElementById("liveHeroSitePreview");
  preview.className = `hero-site-preview deck-website mockup-${visuals.archetype} ${resolveMoodboardStyle(visualDirection)}`;
  preview.removeAttribute("aria-hidden");

  document.getElementById("mockupUrl").innerText = brandDomain(brandName);
  document.getElementById("mockupBrandName").innerText = brandName;
  document.getElementById("mockupBrandName").style.fontFamily = getHeroFontFamily(headingFont);

  const mockupHeadline = document.getElementById("mockupHeadline");
  mockupHeadline.innerText = resolveMockupHeadline(hero, visuals.poolKey, data);
  mockupHeadline.style.fontFamily = getHeroFontFamily(headingFont);

  const mockupSub = document.getElementById("mockupSubheadline");
  mockupSub.innerText = (hero.subheadline && hero.subheadline.trim()) || "Your brand story starts here.";
  mockupSub.style.fontFamily = getHeroFontFamily(bodyFont);

  const mockupCta = document.getElementById("mockupCtaPill");
  mockupCta.innerText = (hero.cta && hero.cta.trim()) || "Get Started";
  mockupCta.style.background = `linear-gradient(135deg, ${primary}, ${accent})`;

  const contactCta = document.getElementById("mockupContactCta");
  if (contactCta) {
    contactCta.innerText = (hero.cta && hero.cta.trim()) || "Get Started";
    contactCta.style.background = `linear-gradient(135deg, ${primary}, ${accent})`;
  }

  const logoMark = document.getElementById("mockupLogoMark");
  logoMark.innerHTML = buildLogoSvg(logoKey, primary, secondary, initial);
  logoMark.style.background = "transparent";

  document.querySelector(".mockup-nav-cta").style.background = primary;

  setMasonryImage(document.getElementById("mockupHeroImg"), heroImage, imageAlt);

  renderMockupExtraPages(data);

  const activeTab = document.querySelector(".mockup-tab.is-active");
  if (activeTab?.dataset.tab !== "home") {
    document.querySelector('.mockup-tab[data-tab="home"]')?.click();
  }
}

function renderHeroSitePreview(data) {
  clearVisualAssets();
  const visuals = resolveBrandVisuals(data);
  applyArchetype(visuals.archetype);
  renderMetaHeader(data, visuals.archetype);
  renderSiteMockup(data, visuals);
  renderEditorialMoodboard(visuals.archetype, visuals.images);
  renderCreativeDirection(data);
  return visuals;
}

function renderLogoConcept(data) {
  const logoKey = archetypeLogoKey(resolveArchetype(data));
  const colors = data.color_palette || {};
  const primary = colors.primary || "#8b5cf6";
  const secondary = colors.secondary || "#3b82f6";
  const initial = (data.brand_name || "B").charAt(0);

  document.getElementById("logoSvgContainer").innerHTML = buildLogoSvg(
    logoKey,
    primary,
    secondary,
    initial
  );
  document.getElementById("logoSvgContainer").removeAttribute("aria-hidden");
}

function resetRevealAnimations() {
  document.querySelectorAll(".reveal-stage").forEach((el) => {
    el.classList.remove("is-visible", "is-active");
  });
  document.querySelectorAll(".extract-block, .editorial-cell").forEach((el) => {
    el.classList.remove("is-revealed");
  });
  document.getElementById("brandMoodboardSection")?.classList.remove("is-expanded");

  if (systemRevealObserver) {
    systemRevealObserver.disconnect();
    systemRevealObserver = null;
  }
}

function animateBrandReveal() {
  initSystemReveal();
  initRevealObserver();
  initMoodboardExpandObserver();
}

function renderLiveBrandPreview(data) {
  renderHeroSitePreview(data);

  [
    "brandMetaCompact",
    "revealExperience",
    "brandMoodboardSection",
    "creativeDirection",
    "launchZone",
    "actionsZone",
  ].forEach((id) => {
    document.getElementById(id)?.classList.remove("hidden");
  });

  document.getElementById("liveHeroSitePreview")?.removeAttribute("aria-hidden");
  showLegacyBrandHeader(false);
}

function markRevealStagesActive() {
  document.querySelectorAll(".reveal-stage").forEach((el) => {
    if (!el.classList.contains("hidden")) el.classList.add("is-active");
    else el.classList.remove("is-active");
  });
}

function hideLiveBrandPreview() {
  [
    "brandMetaCompact",
    "revealExperience",
    "creativeDirection",
    "brandMoodboardSection",
    "launchZone",
    "actionsZone",
  ].forEach((id) => {
    document.getElementById(id)?.classList.add("hidden");
  });
}

function showLegacyBrandHeader(show) {
  const header = document.getElementById("legacyBrandHeader");
  if (show) {
    header.classList.remove("hidden");
    hideLiveBrandPreview();
  } else {
    header.classList.add("hidden");
  }
}

function showGenerationLoading() {
  visualGenerationId += 1;
  document.getElementById("generatedContent").classList.add("hidden");
  document.getElementById("loadingState").classList.remove("hidden");
  resetRevealAnimations();
  hideLiveBrandPreview();
  clearGenerateError();
  clearPdfError();
}

function clearGenerateError() {
  const errorEl = document.getElementById("generateError");
  if (!errorEl) return;
  errorEl.innerText = "";
  errorEl.classList.add("hidden");
}

function showGenerateError(message) {
  const errorEl = document.getElementById("generateError");
  if (!errorEl) return;
  errorEl.innerText = message;
  errorEl.classList.remove("hidden");
}

function showGeneratedContent() {
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("generatedContent").classList.remove("hidden");
}

function showGenerationFailed(message) {
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("generatedContent").classList.add("hidden");
  document.getElementById("outputBox").classList.add("hidden");
  [
    "brandMetaCompact",
    "revealExperience",
    "creativeDirection",
    "brandMoodboardSection",
    "launchZone",
    "actionsZone",
  ].forEach((id) => {
    document.getElementById(id)?.classList.add("hidden");
  });
  showGenerateError(message || "Generation failed. Please try again.");
  showLegacyBrandHeader(false);
  hideLiveBrandPreview();
  hideLaunchContent();
  clearVisualAssets();
  showPdfButton(false);
  resetRevealAnimations();
}

function socialFallback(value) {
  return value && String(value).trim() ? String(value).trim() : "Not specified";
}

function hideLaunchContent() {
  document.getElementById("launchContentCard").classList.add("hidden");
}

function renderTypography(typography) {
  const headingFont = typography?.heading || "Montserrat";
  const bodyFont = typography?.body || "Inter";
  ensureFontLoaded(headingFont);
  ensureFontLoaded(bodyFont);

  const headingEl = document.getElementById("headingFontDisplay");
  const bodyEl = document.getElementById("bodyFontDisplay");
  const headingSample = document.querySelector(".type-sample-heading");
  const bodySample = document.querySelector(".type-sample-body");

  headingEl.innerText = headingFont;
  headingEl.style.fontFamily = getHeroFontFamily(headingFont);

  bodyEl.innerText = bodyFont;
  bodyEl.style.fontFamily = getHeroFontFamily(bodyFont);

  if (headingSample) {
    const meta = headingSample.querySelector(".type-meta-heading");
    if (meta) meta.style.fontFamily = getHeroFontFamily(headingFont);
  }
  if (bodySample) {
    const meta = bodySample.querySelector(".type-meta-body");
    if (meta) meta.style.fontFamily = getHeroFontFamily(bodyFont);
  }
}

function renderBrandColors(colors) {
  const palette = {
    primary: colors.primary || "#8b5cf6",
    secondary: colors.secondary || "#3b82f6",
    accent: colors.accent || "#ec4899",
  };

  document.querySelector(".color-primary").style.backgroundColor = palette.primary;
  document.querySelector(".color-secondary").style.backgroundColor = palette.secondary;
  document.querySelector(".color-accent").style.backgroundColor = palette.accent;
  document.querySelector(".hex-primary").innerText = palette.primary;
  document.querySelector(".hex-secondary").innerText = palette.secondary;
  document.querySelector(".hex-accent").innerText = palette.accent;
}

function renderPersonality(personality) {
  const list = document.getElementById("personality");
  list.innerHTML = "";

  if (!Array.isArray(personality) || !personality.length) {
    const li = document.createElement("li");
    li.className = "personality-chip";
    li.innerText = "Unique";
    list.appendChild(li);
    return;
  }

  personality.slice(0, 3).forEach((p) => {
    const li = document.createElement("li");
    li.className = "personality-chip";

    if (typeof p === "string") {
      li.innerText = p;
    } else if (p.type) {
      li.innerText = p.type;
      if (p.description) li.title = p.description;
    } else if (p.description) {
      li.innerText = p.description;
    } else {
      li.innerText = "Creative";
    }

    list.appendChild(li);
  });
}

function renderVoice(brandVoice) {
  const voiceEl = document.getElementById("voice");
  let text = "Not available";

  if (typeof brandVoice === "string" && brandVoice.trim()) {
    text = brandVoice.trim();
  } else if (brandVoice && typeof brandVoice === "object") {
    const tone = brandVoice.tone || "";
    const language = brandVoice.language_tone || "";
    text = [tone, language].filter(Boolean).join(" · ") || text;
  }

  voiceEl.innerText = `"${truncateText(text, 110)}"`;
}

function renderInstagramPreview(instagramData, brandName) {
  const instagram = instagramData && typeof instagramData === "object" ? instagramData : {};
  const handle = (brandName || "brand").toLowerCase().replace(/\s+/g, "");

  document.getElementById("igBrandHandle").innerText = handle;
  document.getElementById("instagramVisual").innerText = socialFallback(instagram.visual_concept);
  document.getElementById("instagramCaption").innerHTML =
    `<strong>${handle}</strong> ${socialFallback(instagram.caption)}`;
}

function renderLinkedInPreview(linkedinData, brandName) {
  const linkedin = linkedinData && typeof linkedinData === "object" ? linkedinData : {};

  document.getElementById("liBrandName").innerText = brandName || "Your Brand";
  document.getElementById("linkedinHeadline").innerText = socialFallback(linkedin.headline);
  document.getElementById("linkedinPost").innerText = socialFallback(linkedin.post);
}

function renderSocialMedia(socialData, brandName) {
  const social = socialData && typeof socialData === "object" ? socialData : {};
  renderInstagramPreview(social.instagram, brandName);
  renderLinkedInPreview(social.linkedin, brandName);
  document.getElementById("launchContentCard").classList.remove("hidden");
}

function renderBrandAssets(data) {
  const brandEl = document.getElementById("brandName");
  const taglineEl = document.getElementById("tagline");

  brandEl.innerText = data.brand_name || "No brand name";
  taglineEl.innerText =
    data.sample_usage?.website_headline ||
    data.tagline ||
    "No tagline available";

  renderBrandColors(data.color_palette || {});
  renderPersonality(data.brand_personality);
  renderVoice(data.brand_voice);
  renderTypography(data.typography);
  renderLogoConcept(data);
}

function renderBrandToUI(data) {
  showGeneratedContent();
  resetRevealAnimations();

  applyBrandTheme(data);
  renderLiveBrandPreview(data);
  renderBrandAssets(data);
  renderSocialMedia(data.social_media, data.brand_name);

  showPdfButton(true);
  clearPdfError();

  markRevealStagesActive();
  animateBrandReveal();
}

async function generateBrand() {
  const idea = document.getElementById("brandInput").value;
  const outputBox = document.getElementById("outputBox");

  outputBox.classList.remove("hidden");
  showGenerationLoading();

  try {
    const data = await fetchBrand(idea);
    data._brand_idea = idea;
    clearGenerateError();
    renderBrandToUI(data);
    saveBrandData(data);
  } catch (error) {
    if (currentBrandData) {
      document.getElementById("outputBox").classList.remove("hidden");
      showGenerateError(error.message || "Generation failed. Showing your previous brand.");
      renderBrandToUI(currentBrandData);
    } else {
      showGenerationFailed(error.message);
    }
  }
}

async function downloadPdf() {
  if (!currentBrandData) {
    showPdfError("No brand data available. Generate a brand first.");
    return;
  }

  const btn = document.getElementById("downloadPdfBtn");
  const originalText = btn.innerText;

  btn.disabled = true;
  btn.innerText = "Generating PDF…";
  clearPdfError();

  try {
    const { blob, filename } = await exportBrandPdf(currentBrandData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    showPdfError(error.message || "PDF export failed. Please try again.");
  } finally {
    btn.disabled = false;
    btn.innerText = originalText;
  }
}
