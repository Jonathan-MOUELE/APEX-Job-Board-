<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>APEX by AVERS — Trouvez votre prochain emploi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,800&display=swap" rel="stylesheet">
<!-- Lucide version fixe — évite le "not defined" -->
<scrip src="https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js"></script>
<style>
/* ================================
   DESIGN SYSTEM — APEX v2
================================ */
:root {
  --bg: #fafafa;
  --surface: #ffffff;
  --surface2: #f4f4f5;
  --border: #e4e4e7;
  --text: #0c0c0d;
  --muted: #71717a;
  --orange: #f97316;
  --orange-dark: #ea6c10;
  --orange-light: #fff7ed;
  --blue: #0ea5e9;
  --blue-light: #e0f2fe;
  --green: #10b981;
  --green-light: #ecfdf5;
  --tag-bg: #f4f4f5;
  --shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --font: 'DM Sans', system-ui, sans-serif;
}
html.dark {
  --bg: #09090b;
  --surface: #18181b;
  --surface2: #1f1f22;
  --border: #27272a;
  --text: #f4f4f5;
  --muted: #a1a1aa;
  --orange-light: #1c1208;
  --blue-light: #0a1929;
  --green-light: #071a12;
  --tag-bg: #27272a;
  --shadow: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

/* ================================
   ACCESSIBILITÉ
================================ */
#skip-link {
  position: absolute; left: -9999px; top: 8px; z-index: 9999;
  background: var(--orange); color: #fff; padding: 8px 16px; border-radius: 6px;
  font-size: 14px; font-weight: 600; text-decoration: none;
}
#skip-link:focus { left: 8px; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

body.large-text { font-size: 18px; }
body.large-text .hero h1 { font-size: clamp(36px, 5vw, 64px); }

/* ================================
   HEADER
================================ */
header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  background: var(--bg); border-bottom: 1px solid var(--border);
  height: 58px; display: flex; align-items: center;
  padding: 0 32px; gap: 8px;
  transition: background 0.2s, border-color 0.2s;
}

.logo-wrap { display: flex; align-items: center; gap: 6px; text-decoration: none; flex-shrink: 0; }
.logo-apex { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
.logo-apex span { color: var(--orange); }
.logo-by { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border: 1px solid var(--border); border-radius: 4px; }

nav { display: flex; align-items: center; gap: 2px; margin-left: 28px; flex: 1; }
.nav-link { font-size: 14px; font-weight: 500; color: var(--muted); text-decoration: none; padding: 6px 11px; border-radius: 6px; transition: color 0.15s, background 0.15s; white-space: nowrap; }
.nav-link:hover { color: var(--text); background: var(--surface2); }

.header-right { display: flex; align-items: center; gap: 6px; margin-left: auto; }

.btn-a11y { height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; transition: color 0.15s; display: flex; align-items: center; gap: 4px; }
.btn-a11y:hover { color: var(--text); }

.vr { width: 1px; height: 20px; background: var(--border); }

.btn-ghost { height: 34px; padding: 0 14px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--text); font-family: var(--font); font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background 0.15s; text-decoration: none; white-space: nowrap; }
.btn-ghost:hover { background: var(--surface2); }
.btn-ghost svg, .btn-solid svg { width: 14px; height: 14px; }

.btn-solid { height: 34px; padding: 0 16px; border-radius: 7px; border: none; background: var(--orange); color: #fff; font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: opacity 0.15s, transform 0.15s; text-decoration: none; white-space: nowrap; }
.btn-solid:hover { opacity: 0.88; transform: translateY(-1px); }

.btn-icon-sm { width: 34px; height: 34px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.15s; }
.btn-icon-sm:hover { color: var(--text); }
.btn-icon-sm svg { width: 15px; height: 15px; }

/* ================================
   HERO
================================ */
.hero {
  padding: 100px 32px 72px;
  max-width: 1200px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 56px; align-items: center;
}

.hero-left {}
.hero h1 {
  font-size: clamp(38px, 4.5vw, 64px);
  font-weight: 800; letter-spacing: -2px;
  line-height: 1.05; color: var(--text);
  margin-bottom: 18px;
}
.hero h1 em { font-style: normal; color: var(--orange); }
.hero h1 .blue-em { font-style: normal; color: var(--blue); }

.hero-sub { font-size: 16px; color: var(--muted); margin-bottom: 32px; max-width: 440px; line-height: 1.7; }

.search-wrap {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px; padding: 6px;
  display: flex; gap: 4px;
  box-shadow: var(--shadow-md);
  max-width: 520px;
}
.search-field { display: flex; align-items: center; gap: 8px; flex: 1; padding: 0 10px; }
.search-field svg { width: 16px; height: 16px; color: var(--muted); flex-shrink: 0; }
.search-field input { border: none; outline: none; background: transparent; font-family: var(--font); font-size: 14px; color: var(--text); width: 100%; }
.search-field input::placeholder { color: var(--muted); }
.search-sep { width: 1px; background: var(--border); align-self: stretch; margin: 6px 0; }
.search-field.city { max-width: 148px; }
.search-go { flex-shrink: 0; height: 40px; padding: 0 20px; background: var(--orange); color: #fff; border: none; border-radius: 10px; font-family: var(--font); font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.search-go:hover { opacity: 0.88; }

.quick-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
.qtag { font-size: 13px; font-weight: 500; color: var(--muted); padding: 5px 12px; border: 1px solid var(--border); border-radius: 100px; background: var(--surface); cursor: pointer; transition: border-color 0.15s, color 0.15s; text-decoration: none; }
.qtag:hover, .qtag.active { border-color: var(--orange); color: var(--orange); }

/* hero collage */
.hero-collage {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 160px 160px;
  gap: 10px;
  border-radius: 18px; overflow: hidden;
}
.hero-collage img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-collage .span2 { grid-row: span 2; height: 100%; }
.hero-collage img:first-child { border-radius: 0; }

/* ================================
   COMPANIES STRIP
================================ */
.companies-strip {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 20px 32px;
  background: var(--surface);
}
.companies-strip-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 32px; overflow-x: auto; scrollbar-width: none; }
.companies-strip-inner::-webkit-scrollbar { display: none; }
.strip-label { font-size: 12px; font-weight: 600; color: var(--muted); white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; }
.company-logo-item { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; opacity: 0.7; transition: opacity 0.2s; }
.company-logo-item:hover { opacity: 1; }
.company-logo-item img { height: 24px; width: auto; object-fit: contain; }
.company-logo-fallback { font-size: 13px; font-weight: 700; color: var(--muted); font-family: 'DM Sans', monospace; letter-spacing: -0.3px; }

/* ================================
   SECTION CONTAINER
================================ */
.sec { padding: 72px 32px; }
.sec-inner { max-width: 1200px; margin: 0 auto; }
.sec-alt { background: var(--surface); }

.sec-hd { margin-bottom: 36px; }
.sec-eye { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--orange); margin-bottom: 8px; }
.sec-title { font-size: clamp(24px, 3vw, 34px); font-weight: 800; letter-spacing: -1px; color: var(--text); }
.sec-sub { font-size: 15px; color: var(--muted); margin-top: 8px; }
.sec-hd-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

/* ================================
   FEATURES CARDS
================================ */
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.feat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 28px 24px;
  transition: border-color 0.2s, transform 0.2s;
}
.feat-card:hover { border-color: var(--orange); transform: translateY(-2px); }

.feat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.feat-icon.orange { background: var(--orange-light); color: var(--orange); }
.feat-icon.blue { background: var(--blue-light); color: var(--blue); }
.feat-icon.green { background: var(--green-light); color: var(--green); }
.feat-icon svg { width: 22px; height: 22px; }

.feat-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.feat-desc { font-size: 14px; color: var(--muted); line-height: 1.65; }

/* ================================
   CV UPLOAD SECTION
================================ */
.cv-upload-section {
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: 18px;
  padding: 48px 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  max-width: 620px; margin: 0 auto;
}
.cv-upload-section:hover { border-color: var(--orange); background: var(--orange-light); }
.cv-upload-icon { width: 56px; height: 56px; background: var(--orange-light); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--orange); }
.cv-upload-icon svg { width: 28px; height: 28px; }
.cv-upload-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.cv-upload-sub { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
.cv-upload-section input[type="file"] { display: none; }

/* ================================
   SECTEURS — horizontal scroll
================================ */
.sectors-scroll { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; padding-bottom: 8px; }
.sectors-scroll::-webkit-scrollbar { display: none; }
.sector-chip {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 20px 22px; cursor: pointer;
  flex-shrink: 0; min-width: 110px;
  transition: border-color 0.2s, transform 0.2s;
  text-decoration: none;
}
.sector-chip:hover { border-color: var(--orange); transform: translateY(-2px); }
.sector-chip-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--tag-bg); display: flex; align-items: center; justify-content: center; color: var(--orange); }
.sector-chip-icon svg { width: 20px; height: 20px; }
.sector-chip-name { font-size: 13px; font-weight: 600; color: var(--text); text-align: center; }
.sector-chip-count { font-size: 11px; color: var(--muted); }

/* ================================
   JOBS LIST
================================ */
.jobs-list { display: flex; flex-direction: column; gap: 10px; }

.job-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 18px 20px;
  display: flex; align-items: center; gap: 16px;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;
}
.job-card:hover { border-color: var(--orange); box-shadow: var(--shadow-md); }

.job-logo-wrap {
  width: 46px; height: 46px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--surface2);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
.job-logo-wrap img { width: 36px; height: 36px; object-fit: contain; }
.job-logo-wrap .initials { font-size: 13px; font-weight: 700; color: var(--muted); }

.job-body { flex: 1; min-width: 0; }
.job-title { font-size: 15px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.job-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 5px; }
.job-company { font-size: 13px; color: var(--muted); }
.job-tag { font-size: 11px; font-weight: 600; color: var(--muted); background: var(--tag-bg); border: 1px solid var(--border); padding: 2px 8px; border-radius: 100px; white-space: nowrap; }
.job-tag.contract { color: var(--blue); border-color: var(--blue-light); background: var(--blue-light); }
.job-tag.remote { color: var(--green); border-color: var(--green-light); background: var(--green-light); }

.job-actions { display: flex; gap: 6px; flex-shrink: 0; align-items: center; }

.btn-analyze {
  height: 32px; padding: 0 11px; border-radius: 7px;
  background: var(--tag-bg); color: var(--muted);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  border: 1px solid var(--border); cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: color 0.15s, border-color 0.15s;
}
.btn-analyze:hover { color: var(--orange); border-color: var(--orange); }
.btn-analyze svg { width: 13px; height: 13px; }

.btn-apply {
  height: 32px; padding: 0 14px; border-radius: 7px;
  background: var(--orange); color: #fff;
  font-family: var(--font); font-size: 12px; font-weight: 700;
  border: none; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: opacity 0.15s;
}
.btn-apply:hover { opacity: 0.88; }
.btn-apply svg { width: 13px; height: 13px; }

.btn-linkedin {
  width: 32px; height: 32px; border-radius: 7px;
  background: var(--tag-bg); color: #0A66C2;
  border: 1px solid var(--border); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; text-decoration: none;
  font-size: 11px; font-weight: 700;
}
.btn-linkedin:hover { background: #e8f0fe; }

/* ================================
   OUTILS GRID
================================ */
.tools-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.tool-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 24px 20px;
  display: flex; flex-direction: column; gap: 12px;
  text-decoration: none; transition: border-color 0.2s, transform 0.2s;
}
.tool-card:hover { border-color: var(--orange); transform: translateY(-2px); }
.tool-icon { width: 42px; height: 42px; border-radius: 10px; background: var(--tag-bg); display: flex; align-items: center; justify-content: center; color: var(--orange); }
.tool-icon svg { width: 20px; height: 20px; }
.tool-title { font-size: 14px; font-weight: 700; color: var(--text); }
.tool-desc { font-size: 13px; color: var(--muted); line-height: 1.5; }
.tool-cta { font-size: 13px; font-weight: 600; color: var(--orange); display: flex; align-items: center; gap: 4px; margin-top: auto; }
.tool-cta svg { width: 13px; height: 13px; }

/* ================================
   ARTICLES
================================ */
.articles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.article-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden; text-decoration: none;
  transition: box-shadow 0.2s, transform 0.2s; display: block;
}
.article-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.article-img { width: 100%; height: 160px; object-fit: cover; display: block; }
.article-body { padding: 18px; }
.article-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--orange); margin-bottom: 8px; }
.article-title { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.45; margin-bottom: 8px; }
.article-date { font-size: 12px; color: var(--muted); }

/* ================================
   PRICING
================================ */
.pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: start; }

.plan-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 16px; padding: 24px 20px;
  position: relative;
}
.plan-card.featured {
  border-color: var(--orange);
  border-width: 2px;
}
.plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--orange); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 100px; white-space: nowrap; }
.plan-name { font-size: 14px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.plan-price { font-size: 32px; font-weight: 800; letter-spacing: -1px; color: var(--text); line-height: 1; margin-bottom: 4px; }
.plan-price small { font-size: 16px; font-weight: 400; color: var(--muted); }
.plan-period { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
.plan-feats { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.plan-feat { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--text); }
.plan-feat svg { width: 15px; height: 15px; color: var(--green); flex-shrink: 0; margin-top: 2px; }
.plan-feat.off { color: var(--muted); }
.plan-feat.off svg { color: var(--muted); }
.plan-btn { width: 100%; height: 38px; border-radius: 9px; font-family: var(--font); font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--tag-bg); color: var(--text); transition: all 0.15s; }
.plan-btn:hover { background: var(--surface2); }
.plan-card.featured .plan-btn { background: var(--orange); color: #fff; border-color: var(--orange); }
.plan-card.featured .plan-btn:hover { opacity: 0.88; }

/* ================================
   VILLES
================================ */
.cities-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.city-chip { display: flex; flex-direction: column; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 12px; text-decoration: none; transition: border-color 0.15s; }
.city-chip:hover { border-color: var(--orange); }
.city-chip-name { font-size: 13px; font-weight: 600; color: var(--text); }
.city-chip-count { font-size: 11px; color: var(--muted); }

/* ================================
   ALTERNANCE / STAGE / INTÉRIM
================================ */
.contract-tabs { display: flex; gap: 4px; margin-bottom: 24px; }
.ct-tab { height: 34px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--border); background: transparent; font-family: var(--font); font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer; transition: all 0.15s; }
.ct-tab.active { background: var(--orange); color: #fff; border-color: var(--orange); }
.ct-tab:hover:not(.active) { background: var(--surface2); }

.contract-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cchip { font-size: 13px; font-weight: 500; color: var(--text); padding: 6px 14px; border: 1px solid var(--border); border-radius: 100px; background: var(--surface); cursor: pointer; text-decoration: none; transition: border-color 0.15s, color 0.15s; }
.cchip:hover { border-color: var(--orange); color: var(--orange); }

/* ================================
   CTA BANNER
================================ */
.cta-banner {
  background: var(--orange); /* SOLID — pas de gradient */
  border-radius: 18px; padding: 56px 48px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: 12px;
}
.cta-banner h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; letter-spacing: -1px; color: #fff; }
.cta-banner p { font-size: 16px; color: rgba(255,255,255,0.8); max-width: 480px; }
.cta-actions { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
.cta-btn-primary { height: 46px; padding: 0 28px; border-radius: 11px; background: #fff; color: var(--orange); font-family: var(--font); font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: opacity 0.15s; }
.cta-btn-primary:hover { opacity: 0.9; }
.cta-btn-ghost { height: 46px; padding: 0 28px; border-radius: 11px; background: transparent; color: #fff; font-family: var(--font); font-size: 15px; font-weight: 600; border: 2px solid rgba(255,255,255,0.5); cursor: pointer; transition: background 0.15s; }
.cta-btn-ghost:hover { background: rgba(255,255,255,0.1); }

/* ================================
   FOOTER
================================ */
footer { background: var(--surface); border-top: 1px solid var(--border); padding: 48px 32px 32px; }
.footer-inner { max-width: 1200px; margin: 0 auto; }
.footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 36px; border-bottom: 1px solid var(--border); }
.footer-brand .logo-apex { font-size: 18px; display: block; margin-bottom: 10px; }
.footer-brand p { font-size: 13px; color: var(--muted); line-height: 1.7; max-width: 240px; margin-bottom: 8px; }
.footer-brand a { font-size: 13px; color: var(--muted); text-decoration: none; }
.footer-brand a:hover { color: var(--orange); }
.footer-col h5 { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px; }
.footer-col a { display: block; font-size: 13px; color: var(--muted); text-decoration: none; margin-bottom: 9px; transition: color 0.15s; }
.footer-col a:hover { color: var(--text); }
.footer-bottom { padding-top: 24px; font-size: 12px; color: var(--muted); line-height: 1.7; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }

/* ================================
   DRAWER — APEX (plus "Agent")
================================ */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 500; opacity: 0; pointer-events: none; transition: opacity 0.25s;
}
.drawer-overlay.open { opacity: 1; pointer-events: all; }

.drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
  max-width: 100vw; background: var(--surface); border-left: 1px solid var(--border);
  z-index: 600; display: flex; flex-direction: column;
  transform: translateX(100%); transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
}
.drawer.open { transform: translateX(0); }

.drawer-hd {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.drawer-hd-icon { width: 34px; height: 34px; background: var(--orange); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; }
.drawer-hd-icon svg { width: 17px; height: 17px; }
.drawer-hd-name { font-size: 15px; font-weight: 700; color: var(--text); }
.drawer-hd-sub { font-size: 11px; color: var(--muted); }
.drawer-close { margin-left: auto; width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.drawer-close svg { width: 14px; height: 14px; }

.chat-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
.chat-msgs::-webkit-scrollbar { width: 4px; }
.chat-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.cmsg { display: flex; gap: 8px; max-width: 88%; }
.cmsg.bot { align-self: flex-start; }
.cmsg.user { align-self: flex-end; flex-direction: row-reverse; }
.cmsg-av { width: 28px; height: 28px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; align-self: flex-end; }
.cmsg-av svg { width: 13px; height: 13px; }
.cmsg-bubble { background: var(--surface2); border: 1px solid var(--border); border-radius: 13px; border-bottom-left-radius: 3px; padding: 9px 13px; font-size: 13px; color: var(--text); line-height: 1.55; }
.cmsg.user .cmsg-bubble { background: var(--orange); color: #fff; border-color: transparent; border-radius: 13px; border-bottom-right-radius: 3px; }

.typing { display: flex; gap: 3px; align-items: center; padding: 10px 13px; }
.tdot { width: 5px; height: 5px; border-radius: 50%; background: var(--muted); animation: td 1.2s infinite; }
.tdot:nth-child(2) { animation-delay: .2s; }
.tdot:nth-child(3) { animation-delay: .4s; }
@keyframes td { 0%,60%,100% { transform: translateY(0); opacity:.4; } 30% { transform: translateY(-5px); opacity:1; } }

.chat-tools { padding: 10px 16px; border-top: 1px solid var(--border); display: flex; gap: 6px; flex-shrink: 0; }
.chat-tool-btn { height: 30px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--border); background: var(--tag-bg); color: var(--muted); font-family: var(--font); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: color 0.15s, border-color 0.15s; }
.chat-tool-btn:hover { color: var(--orange); border-color: var(--orange); }
.chat-tool-btn svg { width: 13px; height: 13px; }
.chat-file-input { display: none; }

.chat-input-row {
  padding: 12px 16px; border-top: 1px solid var(--border);
  display: flex; gap: 6px; align-items: center; flex-shrink: 0;
}
.chat-inp { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 9px 13px; font-family: var(--font); font-size: 13px; color: var(--text); outline: none; resize: none; height: 40px; line-height: 22px; transition: border-color 0.15s; }
.chat-inp:focus { border-color: var(--orange); }
.chat-inp::placeholder { color: var(--muted); }
.chat-send { width: 40px; height: 40px; border-radius: 9px; background: var(--orange); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s; }
.chat-send:hover { opacity: .88; }
.chat-send svg { width: 16px; height: 16px; }

/* FAB */
#fab {
  position: fixed; bottom: 24px; right: 24px; z-index: 400;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--orange); color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(249,115,22,0.4);
  transition: transform 0.2s;
}
#fab:hover { transform: scale(1.06); }
#fab svg { width: 22px; height: 22px; }

/* ================================
   MODAL CANDIDATURE DIRECTE
================================ */
.modal-overlay { position: fixed; inset: 0; background: var(--overlay); z-index: 700; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 18px; padding: 32px; width: 100%; max-width: 480px;
  transform: translateY(10px); transition: transform 0.2s;
}
.modal-overlay.open .modal { transform: translateY(0); }
.modal-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 12px; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text); }
.modal-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
.modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-close svg { width: 14px; height: 14px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.form-input { width: 100%; height: 40px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; font-family: var(--font); font-size: 14px; color: var(--text); outline: none; transition: border-color 0.15s; }
.form-input:focus { border-color: var(--orange); }
.form-textarea { width: 100%; min-height: 90px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; font-family: var(--font); font-size: 14px; color: var(--text); outline: none; resize: vertical; transition: border-color 0.15s; }
.form-textarea:focus { border-color: var(--orange); }
.form-file-row { display: flex; align-items: center; gap: 10px; }
.btn-file { height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--tag-bg); color: var(--text); font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.btn-file svg { width: 14px; height: 14px; }
.file-name { font-size: 13px; color: var(--muted); }
.modal-actions { display: flex; gap: 8px; margin-top: 24px; justify-content: flex-end; }

/* ================================
   RESPONSIVE
================================ */
@media (max-width: 960px) {
  header { padding: 0 16px; }
  nav { display: none; }
  .hero { grid-template-columns: 1fr; padding: 80px 16px 48px; gap: 28px; }
  .hero-collage { grid-template-rows: 130px 130px; }
  .features-grid, .tools-grid { grid-template-columns: 1fr 1fr; }
  .articles-grid { grid-template-columns: 1fr 1fr; }
  .pricing-grid { grid-template-columns: 1fr 1fr; }
  .cities-grid { grid-template-columns: repeat(3, 1fr); }
  .footer-top { grid-template-columns: 1fr 1fr; }
  .sec { padding: 48px 16px; }
  .companies-strip { padding: 16px; }
  .cta-banner { padding: 40px 24px; }
}
@media (max-width: 600px) {
  .features-grid, .tools-grid, .articles-grid, .pricing-grid { grid-template-columns: 1fr; }
  .cities-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-top { grid-template-columns: 1fr; }
  .job-actions { flex-wrap: wrap; }
  .drawer { width: 100vw; }
}
</style>
</head>
<body>

<!-- ACCESSIBILITÉ : Skip link -->
<a href="#main" id="skip-link">Passer au contenu principal</a>

<!-- ================================
     HEADER
================================ -->
<header role="banner">
  <a href="#" class="logo-wrap" aria-label="APEX — Accueil">
    <span class="logo-apex">APE<span>X</span></span>
    <span class="logo-by">by AVERS</span>
  </a>
  <nav aria-label="Navigation principale">
    <a href="#offres" class="nav-link">Offres</a>
    <a href="#entreprises" class="nav-link">Entreprises</a>
    <a href="#outils" class="nav-link">Outils</a>
    <a href="#conseils" class="nav-link">Conseils</a>
    <a href="#tarifs" class="nav-link">Tarifs</a>
  </nav>
  <div class="header-right">
    <!-- Accessibilité texte -->
    <button class="btn-a11y" onclick="toggleFontSize()" title="Ajuster la taille du texte" aria-label="Agrandir le texte">
      <i data-lucide="type"></i> A+
    </button>
    <button class="btn-icon-sm" onclick="toggleTheme()" id="theme-btn" title="Changer de thème" aria-label="Basculer mode sombre">
      <i data-lucide="moon"></i>
    </button>
    <div class="vr" aria-hidden="true"></div>
    <a href="#" class="btn-ghost">
      <i data-lucide="log-in"></i> Se connecter
    </a>
    <a href="#" class="btn-solid">
      <i data-lucide="user-plus"></i> Créer un compte
    </a>
  </div>
</header>

<!-- ================================
     HERO
================================ -->
<main id="main">
<section class="hero" aria-label="Recherche d'emploi">
  <div class="hero-left">
    <h1>Trouvez l'emploi<br>qui vous <em>ressemble</em><br><span class="blue-em">vraiment.</span></h1>
    <p class="hero-sub">Des milliers d'offres analysées pour vous. Postulez directement, suivez vos candidatures, et laissez votre carrière prendre son élan.</p>
    <form class="search-wrap" onsubmit="handleSearch(event)" role="search">
      <div class="search-field">
        <i data-lucide="search" aria-hidden="true"></i>
        <input type="text" id="sq-job" placeholder="Métier, compétence, entreprise…" aria-label="Métier recherché">
      </div>
      <div class="search-sep" aria-hidden="true"></div>
      <div class="search-field city">
        <i data-lucide="map-pin" aria-hidden="true"></i>
        <input type="text" id="sq-city" placeholder="Ville, code postal…" aria-label="Localisation">
      </div>
      <button type="submit" class="search-go">Rechercher</button>
    </form>
    <div class="quick-tags" role="list" aria-label="Filtres rapides">
      <a href="#" class="qtag active" role="listitem">Tous</a>
      <a href="#" class="qtag" role="listitem">CDI</a>
      <a href="#" class="qtag" role="listitem">CDD</a>
      <a href="#" class="qtag" role="listitem">Stage</a>
      <a href="#" class="qtag" role="listitem">Alternance</a>
      <a href="#" class="qtag" role="listitem">Intérim</a>
      <a href="#" class="qtag" role="listitem">Télétravail</a>
    </div>
  </div>
  <div class="hero-collage" aria-hidden="true">
    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=75" alt="">
    <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=75" alt="" class="span2">
    <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=400&q=75" alt="">
    <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=75" alt="">
    <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=75" alt="">
  </div>
</section>

<!-- ================================
     COMPANIES STRIP
================================ -->
<div class="companies-strip" id="entreprises" aria-label="Entreprises partenaires">
  <div class="companies-strip-inner">
    <span class="strip-label">Ils recrutent</span>
    <a href="#" class="company-logo-item" title="SFR">
      <img src="https://logo.clearbit.com/sfr.fr" alt="SFR" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">SFR</span>
    </a>
    <a href="#" class="company-logo-item" title="BNP Paribas">
      <img src="https://logo.clearbit.com/bnpparibas.com" alt="BNP Paribas" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">BNP</span>
    </a>
    <a href="#" class="company-logo-item" title="AXA">
      <img src="https://logo.clearbit.com/axa.fr" alt="AXA" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">AXA</span>
    </a>
    <a href="#" class="company-logo-item" title="Orange">
      <img src="https://logo.clearbit.com/orange.com" alt="Orange" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">Orange</span>
    </a>
    <a href="#" class="company-logo-item" title="Decathlon">
      <img src="https://logo.clearbit.com/decathlon.fr" alt="Decathlon" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">Deca</span>
    </a>
    <a href="#" class="company-logo-item" title="SNCF">
      <img src="https://logo.clearbit.com/sncf.com" alt="SNCF" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">SNCF</span>
    </a>
    <a href="#" class="company-logo-item" title="Société Générale">
      <img src="https://logo.clearbit.com/societegenerale.com" alt="Société Générale" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">SG</span>
    </a>
    <a href="#" class="company-logo-item" title="Renault">
      <img src="https://logo.clearbit.com/renault.fr" alt="Renault" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">Renault</span>
    </a>
    <a href="#" class="company-logo-item" title="Capgemini">
      <img src="https://logo.clearbit.com/capgemini.com" alt="Capgemini" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">Cap</span>
    </a>
    <a href="#" class="company-logo-item" title="Vinci">
      <img src="https://logo.clearbit.com/vinci.com" alt="Vinci" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="company-logo-fallback" style="display:none">Vinci</span>
    </a>
  </div>
</div>

<!-- ================================
     FEATURES
================================ -->
<section class="sec" aria-labelledby="feat-title">
  <div class="sec-inner">
    <div class="sec-hd">
      <div class="sec-eye">Pourquoi APEX ?</div>
      <h2 class="sec-title" id="feat-title">Votre carrière mérite mieux qu'un simple moteur de recherche</h2>
      <p class="sec-sub">APEX est votre partenaire de bout en bout : de la découverte à la signature de contrat.</p>
    </div>
    <div class="features-grid">
      <div class="feat-card">
        <div class="feat-icon orange"><i data-lucide="send"></i></div>
        <div class="feat-title">Postulez sans quitter APEX</div>
        <div class="feat-desc">Candidature directe intégrée — plus besoin d'ouvrir dix onglets. Envoyez votre CV et votre lettre en un clic depuis notre plateforme.</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon blue"><i data-lucide="clipboard-list"></i></div>
        <div class="feat-title">Suivez chaque étape en temps réel</div>
        <div class="feat-desc">Votre tableau de bord vous donne une vue claire de toutes vos candidatures : envoyée, relancée, entretien planifié, réponse reçue.</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon green"><i data-lucide="sparkles"></i></div>
        <div class="feat-title">APEX vous conseille, vous progresse</div>
        <div class="feat-desc">Préparez vos entretiens, améliorez votre CV, découvrez les certifications utiles dans votre domaine — tout ça sans jargon inutile.</div>
      </div>
    </div>
  </div>
</section>

<!-- ================================
     DÉPOSER UN CV — section mise en avant
================================ -->
<section class="sec sec-alt" aria-labelledby="cv-section-title">
  <div class="sec-inner">
    <div class="sec-hd" style="text-align:center">
      <div class="sec-eye">Votre profil, votre force</div>
      <h2 class="sec-title" id="cv-section-title">Déposez votre CV — les recruteurs viennent à vous</h2>
      <p class="sec-sub">Plus de 800 recruteurs consultent les profils chaque jour sur APEX.</p>
    </div>
    <label class="cv-upload-section" for="cv-file-main" role="button" aria-label="Déposer votre CV">
      <div class="cv-upload-icon"><i data-lucide="file-up"></i></div>
      <div class="cv-upload-title">Glissez votre CV ici, ou cliquez pour choisir</div>
      <div class="cv-upload-sub">PDF, Word, ou OpenDocument — votre CV reste privé jusqu'à ce que vous décidiez de le partager.</div>
      <button class="btn-solid" style="margin:0 auto" type="button" onclick="document.getElementById('cv-file-main').click()">
        <i data-lucide="upload"></i> Choisir un fichier
      </button>
      <input type="file" id="cv-file-main" accept=".pdf,.doc,.docx,.odt" aria-hidden="true">
    </label>
  </div>
</section>

<!-- ================================
     SECTEURS
================================ -->
<section class="sec" aria-labelledby="sectors-title">
  <div class="sec-inner">
    <div class="sec-hd sec-hd-row">
      <div>
        <div class="sec-eye">Explorez</div>
        <h2 class="sec-title" id="sectors-title">Chaque métier a sa place chez APEX</h2>
      </div>
      <a href="#" class="btn-ghost">Tous les secteurs <i data-lucide="arrow-right"></i></a>
    </div>
    <div class="sectors-scroll" role="list" aria-label="Secteurs d'activité">
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="monitor"></i></div><span class="sector-chip-name">Tech & IT</span><span class="sector-chip-count">9 400+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="heart"></i></div><span class="sector-chip-name">Santé</span><span class="sector-chip-count">7 300+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="hard-hat"></i></div><span class="sector-chip-name">BTP</span><span class="sector-chip-count">5 100+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="trending-up"></i></div><span class="sector-chip-name">Commerce</span><span class="sector-chip-count">6 200+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="landmark"></i></div><span class="sector-chip-name">Finance</span><span class="sector-chip-count">3 800+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="truck"></i></div><span class="sector-chip-name">Logistique</span><span class="sector-chip-count">4 500+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="utensils"></i></div><span class="sector-chip-name">Restauration</span><span class="sector-chip-count">3 200+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="megaphone"></i></div><span class="sector-chip-name">Marketing</span><span class="sector-chip-count">2 900+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="scale"></i></div><span class="sector-chip-name">Juridique</span><span class="sector-chip-count">1 600+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="graduation-cap"></i></div><span class="sector-chip-name">Éducation</span><span class="sector-chip-count">2 100+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="leaf"></i></div><span class="sector-chip-name">Environnement</span><span class="sector-chip-count">1 200+</span></a>
      <a href="#" class="sector-chip" role="listitem"><div class="sector-chip-icon"><i data-lucide="hotel"></i></div><span class="sector-chip-name">Hôtellerie</span><span class="sector-chip-count">2 400+</span></a>
    </div>
  </div>
</section>

<!-- ================================
     OFFRES DU MOMENT
================================ -->
<section class="sec sec-alt" id="offres" aria-labelledby="jobs-title">
  <div class="sec-inner">
    <div class="sec-hd sec-hd-row">
      <div>
        <div class="sec-eye">Fraîchement ajoutées</div>
        <h2 class="sec-title" id="jobs-title">Les offres du moment</h2>
      </div>
      <a href="#" class="btn-ghost">Voir tout <i data-lucide="arrow-right"></i></a>
    </div>
    <div class="jobs-list" id="jobs-list">

      <article class="job-card" aria-label="Offre : Développeur Full Stack — SFR">
        <div class="job-logo-wrap">
          <img src="https://logo.clearbit.com/sfr.fr" alt="SFR" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="initials" style="display:none">SFR</span>
        </div>
        <div class="job-body">
          <div class="job-title">Développeur Full Stack — React / .NET</div>
          <div class="job-meta">
            <span class="job-company">SFR Business · Paris 8e</span>
            <span class="job-tag contract">CDI</span>
            <span class="job-tag remote">Hybride</span>
            <span class="job-tag">42 000 – 52 000 €</span>
          </div>
        </div>
        <div class="job-actions">
          <a href="https://www.linkedin.com/search/results/companies/?keywords=SFR" target="_blank" rel="noopener" class="btn-linkedin" title="Voir SFR sur LinkedIn" aria-label="SFR sur LinkedIn">in</a>
          <button class="btn-analyze" onclick="analyzeJob(this)" aria-label="Analyser cette offre avec APEX">
            <i data-lucide="zap"></i> Analyser
          </button>
          <button class="btn-apply" onclick="openApplyModal('Développeur Full Stack — SFR Business', 'Paris 8e')" aria-label="Postuler directement">
            <i data-lucide="send"></i> Postuler
          </button>
        </div>
      </article>

      <article class="job-card">
        <div class="job-logo-wrap">
          <img src="https://logo.clearbit.com/bnpparibas.com" alt="BNP Paribas" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="initials" style="display:none">BNP</span>
        </div>
        <div class="job-body">
          <div class="job-title">Chargé(e) de clientèle professionnels</div>
          <div class="job-meta">
            <span class="job-company">BNP Paribas · Lyon 2e</span>
            <span class="job-tag contract">CDI</span>
            <span class="job-tag">Présentiel</span>
            <span class="job-tag">35 000 – 42 000 €</span>
          </div>
        </div>
        <div class="job-actions">
          <a href="https://www.linkedin.com/search/results/companies/?keywords=BNP+Paribas" target="_blank" rel="noopener" class="btn-linkedin" title="BNP Paribas sur LinkedIn">in</a>
          <button class="btn-analyze" onclick="analyzeJob(this)"><i data-lucide="zap"></i> Analyser</button>
          <button class="btn-apply" onclick="openApplyModal('Chargé(e) de clientèle — BNP Paribas', 'Lyon 2e')"><i data-lucide="send"></i> Postuler</button>
        </div>
      </article>

      <article class="job-card">
        <div class="job-logo-wrap">
          <img src="https://logo.clearbit.com/axa.fr" alt="AXA" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="initials" style="display:none">AXA</span>
        </div>
        <div class="job-body">
          <div class="job-title">Data Analyst — Actuariat & Assurance</div>
          <div class="job-meta">
            <span class="job-company">AXA France · Nanterre</span>
            <span class="job-tag contract">CDI</span>
            <span class="job-tag remote">Télétravail</span>
            <span class="job-tag">48 000 – 58 000 €</span>
          </div>
        </div>
        <div class="job-actions">
          <a href="https://www.linkedin.com/search/results/companies/?keywords=AXA" target="_blank" rel="noopener" class="btn-linkedin" title="AXA sur LinkedIn">in</a>
          <button class="btn-analyze" onclick="analyzeJob(this)"><i data-lucide="zap"></i> Analyser</button>
          <button class="btn-apply" onclick="openApplyModal('Data Analyst — AXA France', 'Nanterre')"><i data-lucide="send"></i> Postuler</button>
        </div>
      </article>

      <article class="job-card">
        <div class="job-logo-wrap">
          <img src="https://logo.clearbit.com/capgemini.com" alt="Capgemini" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="initials" style="display:none">CAP</span>
        </div>
        <div class="job-body">
          <div class="job-title">Infirmier(ère) coordinateur(trice)</div>
          <div class="job-meta">
            <span class="job-company">Capgemini Santé · Bordeaux</span>
            <span class="job-tag contract">CDI</span>
            <span class="job-tag">Présentiel</span>
            <span class="job-tag">38 000 – 45 000 €</span>
          </div>
        </div>
        <div class="job-actions">
          <a href="https://www.linkedin.com/search/results/companies/?keywords=Capgemini" target="_blank" rel="noopener" class="btn-linkedin" title="Capgemini sur LinkedIn">in</a>
          <button class="btn-analyze" onclick="analyzeJob(this)"><i data-lucide="zap"></i> Analyser</button>
          <button class="btn-apply" onclick="openApplyModal('Infirmier coordinateur — Capgemini Santé', 'Bordeaux')"><i data-lucide="send"></i> Postuler</button>
        </div>
      </article>

    </div>
  </div>
</section>

<!-- ================================
     OUTILS
================================ -->
<section class="sec" id="outils" aria-labelledby="tools-title">
  <div class="sec-inner">
    <div class="sec-hd">
      <div class="sec-eye">Votre boîte à outils</div>
      <h2 class="sec-title" id="tools-title">Tout ce qu'il faut pour décrocher votre poste</h2>
      <p class="sec-sub">Des outils concrets, simples, pensés pour tout le monde — pas que pour les pros de l'informatique.</p>
    </div>
    <div class="tools-grid">
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="file-text"></i></div>
        <div class="tool-title">Créez votre CV</div>
        <div class="tool-desc">Un outil simple pour composer un CV qui accroche, avec des modèles éprouvés.</div>
        <div class="tool-cta">Créer mon CV <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="mail"></i></div>
        <div class="tool-title">Lettre de motivation</div>
        <div class="tool-desc">Rédigez une lettre convaincante grâce à nos exemples et à l'aide d'APEX.</div>
        <div class="tool-cta">Rédiger ma lettre <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="calculator"></i></div>
        <div class="tool-title">Calculateur de salaire</div>
        <div class="tool-desc">Convertissez facilement votre salaire brut en net, mensuel ou annuel.</div>
        <div class="tool-cta">Calculer mon salaire <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="mic"></i></div>
        <div class="tool-title">Préparez votre entretien</div>
        <div class="tool-desc">Questions fréquentes par métier, exercices de mise en situation, conseils pratiques.</div>
        <div class="tool-cta">Me préparer <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="award"></i></div>
        <div class="tool-title">Certifications utiles</div>
        <div class="tool-desc">Les certifications gratuites et reconnues dans votre domaine, regroupées par métier.</div>
        <div class="tool-cta">Découvrir <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="git-merge"></i></div>
        <div class="tool-title">Projets pour progresser</div>
        <div class="tool-desc">Des idées de projets personnels pour booster votre profil et vos compétences.</div>
        <div class="tool-cta">Explorer les projets <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="repeat-2"></i></div>
        <div class="tool-title">Relances & suivi</div>
        <div class="tool-desc">Modèles de relance après candidature ou entretien, pour rester professionnel et mémorable.</div>
        <div class="tool-cta">Voir les modèles <i data-lucide="arrow-right"></i></div>
      </a>
      <a href="#" class="tool-card">
        <div class="tool-icon"><i data-lucide="bar-chart-2"></i></div>
        <div class="tool-title">Panoramas salaires</div>
        <div class="tool-desc">Les salaires réels par poste, par région et par expérience — pour négocier avec confiance.</div>
        <div class="tool-cta">Consulter <i data-lucide="arrow-right"></i></div>
      </a>
    </div>
  </div>
</section>

<!-- ================================
     ARTICLES & CONSEILS
================================ -->
<section class="sec sec-alt" id="conseils" aria-labelledby="articles-title">
  <div class="sec-inner">
    <div class="sec-hd sec-hd-row">
      <div>
        <div class="sec-eye">Savoir, c'est avancer</div>
        <h2 class="sec-title" id="articles-title">Le monde du travail sans langue de bois</h2>
      </div>
      <a href="#" class="btn-ghost">Toutes les actualités <i data-lucide="arrow-right"></i></a>
    </div>
    <div class="articles-grid">
      <a href="#" class="article-card">
        <img class="article-img" src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=75" alt="">
        <div class="article-body">
          <div class="article-cat">Entretien</div>
          <div class="article-title">Préparez-vous en conditions réelles grâce à notre simulateur d'entretien</div>
          <div class="article-date">9 avril 2026</div>
        </div>
      </a>
      <a href="#" class="article-card">
        <img class="article-img" src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=75" alt="">
        <div class="article-body">
          <div class="article-cat">IA & Emploi</div>
          <div class="article-title">IA vs soft skills : ce que disent vraiment les chiffres en 2026</div>
          <div class="article-date">7 avril 2026</div>
        </div>
      </a>
      <a href="#" class="article-card">
        <img class="article-img" src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=75" alt="">
        <div class="article-body">
          <div class="article-cat">Carrière</div>
          <div class="article-title">Comment se démarquer dans un marché de l'emploi prudent en 2026 ?</div>
          <div class="article-date">5 avril 2026</div>
        </div>
      </a>
    </div>
    <!-- Topics populaires -->
    <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:8px;">
      <span style="font-size:13px;font-weight:600;color:var(--muted);margin-right:8px;">Sujets :</span>
      <a href="#" class="cchip">Droit du travail</a><a href="#" class="cchip">Contrat de travail</a><a href="#" class="cchip">Alternance</a><a href="#" class="cchip">Salaire</a><a href="#" class="cchip">Entretien</a><a href="#" class="cchip">IA</a><a href="#" class="cchip">Stage</a><a href="#" class="cchip">Compétences</a><a href="#" class="cchip">Télétravail</a>
    </div>
  </div>
</section>

<!-- ================================
     STAGE / ALTERNANCE / INTÉRIM
================================ -->
<section class="sec" aria-labelledby="contract-types-title">
  <div class="sec-inner">
    <div class="sec-hd">
      <div class="sec-eye">Pour chaque situation</div>
      <h2 class="sec-title" id="contract-types-title">Stage, alternance, intérim — on a ce qu'il vous faut</h2>
    </div>
    <div class="contract-tabs" role="tablist">
      <button class="ct-tab active" role="tab" aria-selected="true" onclick="switchContractTab(this,'stage')">Stage</button>
      <button class="ct-tab" role="tab" aria-selected="false" onclick="switchContractTab(this,'alternance')">Alternance</button>
      <button class="ct-tab" role="tab" aria-selected="false" onclick="switchContractTab(this,'interim')">Intérim</button>
    </div>
    <div id="tab-stage" class="contract-chips">
      <a href="#" class="cchip">Stage Ingénieur</a>
      <a href="#" class="cchip">Stage Chargé de recrutement</a>
      <a href="#" class="cchip">Stage Communication</a>
      <a href="#" class="cchip">Stage Assistant chef de produit</a>
      <a href="#" class="cchip">Stage Commercial</a>
      <a href="#" class="cchip">Stage Chef de projet</a>
      <a href="#" class="cchip">Stage Data Analyst</a>
      <a href="#" class="cchip">Stage Développeur web</a>
      <a href="#" class="cchip">Stage Ressources humaines</a>
    </div>
    <div id="tab-alternance" class="contract-chips" style="display:none">
      <a href="#" class="cchip">Alternance Auxiliaire de vie</a>
      <a href="#" class="cchip">Alternance Conseiller de vente</a>
      <a href="#" class="cchip">Alternance Communication</a>
      <a href="#" class="cchip">Alternance Assistant manager</a>
      <a href="#" class="cchip">Alternance Employé de commerce</a>
      <a href="#" class="cchip">Alternance Ingénieur</a>
      <a href="#" class="cchip">Alternance Développeur</a>
      <a href="#" class="cchip">Alternance Comptabilité</a>
    </div>
    <div id="tab-interim" class="contract-chips" style="display:none">
      <a href="#" class="cchip">Intérim Paris</a>
      <a href="#" class="cchip">Intérim Lyon</a>
      <a href="#" class="cchip">Intérim Toulouse</a>
      <a href="#" class="cchip">Intérim Marseille</a>
      <a href="#" class="cchip">Intérim Nantes</a>
      <a href="#" class="cchip">Intérim Bordeaux</a>
      <a href="#" class="cchip">Intérim Reims</a>
    </div>
  </div>
</section>

<!-- ================================
     TARIFS
================================ -->
<section class="sec sec-alt" id="tarifs" aria-labelledby="pricing-title">
  <div class="sec-inner">
    <div class="sec-hd" style="text-align:center">
      <div class="sec-eye">Nos formules</div>
      <h2 class="sec-title" id="pricing-title">Commencez gratuitement, évoluez à votre rythme</h2>
      <p class="sec-sub">Pas de surprises, pas de carte requise pour démarrer.</p>
    </div>
    <div class="pricing-grid">
      <div class="plan-card">
        <div class="plan-name">Gratuit</div>
        <div class="plan-price">0 <small>€</small></div>
        <div class="plan-period">Pour toujours</div>
        <div class="plan-feats">
          <div class="plan-feat"><i data-lucide="check"></i> Recherche d'offres</div>
          <div class="plan-feat"><i data-lucide="check"></i> Alertes emploi</div>
          <div class="plan-feat"><i data-lucide="check"></i> Accès aux articles</div>
          <div class="plan-feat off"><i data-lucide="x"></i> Candidature directe</div>
          <div class="plan-feat off"><i data-lucide="x"></i> Analyse IA</div>
          <div class="plan-feat off"><i data-lucide="x"></i> Suivi candidatures</div>
        </div>
        <button class="plan-btn">Commencer</button>
      </div>
      <div class="plan-card">
        <div class="plan-name">Essentiel</div>
        <div class="plan-price">4,99 <small>€</small></div>
        <div class="plan-period">par mois</div>
        <div class="plan-feats">
          <div class="plan-feat"><i data-lucide="check"></i> Tout du plan Gratuit</div>
          <div class="plan-feat"><i data-lucide="check"></i> Candidature directe</div>
          <div class="plan-feat"><i data-lucide="check"></i> Suivi des candidatures</div>
          <div class="plan-feat"><i data-lucide="check"></i> Analyse IA basique</div>
          <div class="plan-feat off"><i data-lucide="x"></i> Coach entretien IA</div>
          <div class="plan-feat off"><i data-lucide="x"></i> CV builder avancé</div>
        </div>
        <button class="plan-btn">Choisir Essentiel</button>
      </div>
      <div class="plan-card featured">
        <div class="plan-badge">⭐ Le plus populaire</div>
        <div class="plan-name">Pro</div>
        <div class="plan-price">8,99 <small>€</small></div>
        <div class="plan-period">par mois</div>
        <div class="plan-feats">
          <div class="plan-feat"><i data-lucide="check"></i> Tout du plan Essentiel</div>
          <div class="plan-feat"><i data-lucide="check"></i> Coach entretien IA</div>
          <div class="plan-feat"><i data-lucide="check"></i> CV & lettre builder</div>
          <div class="plan-feat"><i data-lucide="check"></i> Analyse IA avancée</div>
          <div class="plan-feat"><i data-lucide="check"></i> Relances automatiques</div>
          <div class="plan-feat off"><i data-lucide="x"></i> Agent IA autonome</div>
        </div>
        <button class="plan-btn">Passer à Pro</button>
      </div>
      <div class="plan-card">
        <div class="plan-name">Ultra <span style="font-size:11px;background:var(--blue-light);color:var(--blue);padding:2px 6px;border-radius:4px;margin-left:4px;">Bêta</span></div>
        <div class="plan-price">11,99 <small>€</small></div>
        <div class="plan-period">par mois</div>
        <div class="plan-feats">
          <div class="plan-feat"><i data-lucide="check"></i> Tout du plan Pro</div>
          <div class="plan-feat"><i data-lucide="check"></i> Agent IA autonome</div>
          <div class="plan-feat"><i data-lucide="check"></i> Candidatures automatisées</div>
          <div class="plan-feat"><i data-lucide="check"></i> Support prioritaire</div>
          <div class="plan-feat"><i data-lucide="check"></i> Accès bêta anticipé</div>
          <div class="plan-feat"><i data-lucide="check"></i> Accompagnement personnalisé</div>
        </div>
        <button class="plan-btn">Rejoindre la bêta</button>
      </div>
    </div>
  </div>
</section>

<!-- ================================
     VILLES
================================ -->
<section class="sec" aria-labelledby="cities-title">
  <div class="sec-inner">
    <div class="sec-hd">
      <div class="sec-eye">Partout en France</div>
      <h2 class="sec-title" id="cities-title">Votre prochaine opportunité est peut-être à côté</h2>
    </div>
    <div class="cities-grid">
      <a href="#" class="city-chip"><span class="city-chip-name">Paris</span><span class="city-chip-count">12 400 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Lyon</span><span class="city-chip-count">5 800 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Toulouse</span><span class="city-chip-count">4 200 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Marseille</span><span class="city-chip-count">3 700 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Bordeaux</span><span class="city-chip-count">3 100 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Nantes</span><span class="city-chip-count">2 900 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Lille</span><span class="city-chip-count">2 600 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Strasbourg</span><span class="city-chip-count">1 900 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Rennes</span><span class="city-chip-count">1 800 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Nice</span><span class="city-chip-count">1 700 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Grenoble</span><span class="city-chip-count">1 500 offres</span></a>
      <a href="#" class="city-chip"><span class="city-chip-name">Montpellier</span><span class="city-chip-count">1 400 offres</span></a>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="#" class="btn-ghost">Toutes les villes <i data-lucide="arrow-right"></i></a>
    </div>
  </div>
</section>

<!-- ================================
     CTA BANNIÈRE
================================ -->
<section class="sec">
  <div class="sec-inner">
    <div class="cta-banner">
      <h2>Prêt à décrocher votre prochain poste ?</h2>
      <p>Créez votre profil gratuitement et laissez APEX faire le travail de tri pour vous.</p>
      <div class="cta-actions">
        <button class="cta-btn-primary">Créer mon compte</button>
        <button class="cta-btn-ghost">Explorer sans compte</button>
      </div>
    </div>
  </div>
</section>
</main>

<!-- ================================
     FOOTER
================================ -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="logo-apex">APE<span>X</span></span>
        <p>Le job board intelligent qui vous aide à trouver, postuler et progresser dans votre carrière.</p>
        <a href="mailto:aversreply@gmail.com">aversreply@gmail.com</a>
      </div>
      <div class="footer-col">
        <h5>Chercher un emploi</h5>
        <a href="#">Offres d'emploi</a>
        <a href="#">Entreprises</a>
        <a href="#">Suivi des candidatures</a>
        <a href="#">Déposer un CV</a>
        <a href="#">APEX (le bot)</a>
      </div>
      <div class="footer-col">
        <h5>Légal</h5>
        <a href="#">Mentions légales</a>
        <a href="#">Protection des données (CNIL)</a>
        <a href="#">Politique de confidentialité</a>
        <a href="#">CGU</a>
        <a href="#">Licence Etalab-2.0</a>
      </div>
      <div class="footer-col">
        <h5>Contact</h5>
        <a href="#">Nous contacter</a>
        <a href="#">Recruteurs — accès pro</a>
        <a href="#">Aide & FAQ</a>
        <a href="#">Signaler une erreur</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>
        Les offres d'emploi proviennent de l'API Offres d'emploi France Travail (Pôle emploi) v2, sous licence ouverte Etalab-2.0. APEX / AVERS n'est pas affilié à France Travail. Les analyses IA sont des aides à la décision — relisez avant d'envoyer. Données conformes au RGPD (UE 2016/679) et à l'AI Act. Les logos des entreprises sont la propriété de leurs titulaires respectifs. APEX n'est pas partenaire officiel de ces entreprises.
      </div>
      <div style="flex-shrink:0">© 2026 APEX — AVERS (Entrepreneur Individuel) · Hébergé par LWS, 10 rue de Penthièvre, 75008 Paris</div>
    </div>
  </div>
</footer>

<!-- ================================
     FAB APEX
================================ -->
<button id="fab" onclick="openDrawer()" aria-label="Ouvrir APEX, votre assistant emploi">
  <i data-lucide="message-square"></i>
</button>

<!-- DRAWER APEX -->
<div class="drawer-overlay" id="drawer-overlay" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer" role="dialog" aria-label="APEX — Assistant emploi" aria-modal="true">
  <div class="drawer-hd">
    <div class="drawer-hd-icon"><i data-lucide="bot"></i></div>
    <div>
      <div class="drawer-hd-name">APEX</div>
      <div class="drawer-hd-sub">Votre guide emploi personnel</div>
    </div>
    <button class="drawer-close" onclick="closeDrawer()" aria-label="Fermer"><i data-lucide="x"></i></button>
  </div>
  <div class="chat-msgs" id="chat-msgs">
    <div class="cmsg bot">
      <div class="cmsg-av"><i data-lucide="bot"></i></div>
      <div class="cmsg-bubble">Bonjour ! Je suis APEX, votre assistant emploi.<br>Je peux vous aider à trouver une offre, préparer un entretien, améliorer votre CV, ou vous orienter vers les bonnes certifications. Par où on commence ?</div>
    </div>
  </div>
  <!-- Outils rapides dans le bot -->
  <div class="chat-tools">
    <button class="chat-tool-btn" onclick="sendQuickMessage('Aide-moi à préparer mon entretien')"><i data-lucide="mic"></i> Entretien</button>
    <button class="chat-tool-btn" onclick="sendQuickMessage('Analyse mon CV')"><i data-lucide="file-text"></i> CV</button>
    <label class="chat-tool-btn" for="chat-file-upload" style="cursor:pointer">
      <i data-lucide="paperclip"></i> Document
      <input type="file" id="chat-file-upload" class="chat-file-input" accept=".pdf,.doc,.docx" onchange="handleChatFile(this)">
    </label>
    <button class="chat-tool-btn" onclick="sendQuickMessage('Quelles certifications gratuites recommandes-tu ?')"><i data-lucide="award"></i> Certifs</button>
  </div>
  <div class="chat-input-row">
    <textarea class="chat-inp" id="chat-inp" placeholder="Posez votre question…" onkeydown="chatKey(event)" aria-label="Message pour APEX"></textarea>
    <button class="chat-send" onclick="sendMsg()" aria-label="Envoyer"><i data-lucide="send"></i></button>
  </div>
</div>

<!-- ================================
     MODAL CANDIDATURE DIRECTE
================================ -->
<div class="modal-overlay" id="apply-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal">
    <div class="modal-hd">
      <div>
        <div class="modal-title" id="modal-title">Postuler directement</div>
        <div class="modal-sub" id="modal-offer-name">Offre sélectionnée</div>
      </div>
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer"><i data-lucide="x"></i></button>
    </div>
    <div class="form-group">
      <label class="form-label" for="apply-name">Prénom & Nom</label>
      <input type="text" id="apply-name" class="form-input" placeholder="Marie Dupont">
    </div>
    <div class="form-group">
      <label class="form-label" for="apply-email">Adresse e-mail</label>
      <input type="email" id="apply-email" class="form-input" placeholder="marie@email.fr">
    </div>
    <div class="form-group">
      <label class="form-label">Votre CV</label>
      <div class="form-file-row">
        <label class="btn-file" for="apply-cv" style="cursor:pointer">
          <i data-lucide="upload"></i> Choisir un fichier
          <input type="file" id="apply-cv" style="display:none" accept=".pdf,.doc,.docx">
        </label>
        <span class="file-name" id="apply-cv-name">Aucun fichier sélectionné</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="apply-msg">Message (optionnel)</label>
      <textarea id="apply-msg" class="form-textarea" placeholder="Quelques mots sur votre motivation…"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()" type="button">Annuler</button>
      <button class="btn-solid" onclick="submitApplication()" type="button"><i data-lucide="send"></i> Envoyer ma candidature</button>
    </div>
  </div>
</div>
</body>
</html>

