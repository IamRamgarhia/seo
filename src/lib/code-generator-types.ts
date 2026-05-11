/**
 * SEO Code Generator — types + per-target prompt scaffolding.
 *
 * Each "target" is a concrete output format with its own system prompt,
 * file extension, syntax highlight language, and install-instruction
 * template. The generator's job is to produce ready-to-paste code, NOT
 * documentation about code.
 */

export type GeneratorTarget =
  | "wp-plugin-simple"
  | "wp-plugin-advanced"
  | "wp-functions"
  | "html-snippet"
  | "elementor-html"
  | "shopify-liquid"
  | "schema-jsonld"
  | "htaccess"
  | "nginx-config"
  | "robots-txt"
  | "tracking-js"
  | "react-component"
  | "nextjs-route"
  | "drupal-twig"
  | "ghost-injection"
  | "webflow-embed"
  | "csv-redirects";

export type CodeGenSpec = {
  target: GeneratorTarget;
  label: string;
  description: string;
  fileExt: string;
  language: string;
  /** How users install / use the generated code. Rendered after generation. */
  installSteps: string[];
  /** System prompt for the AI generator. */
  systemPrompt: string;
  /** Whether to render an iframe preview of the result (HTML-ish targets). */
  preview: "iframe" | "syntax" | "none";
  /** Whether the target needs careful trust review before applying. */
  warning?: string;
};

export const TARGETS: Record<GeneratorTarget, CodeGenSpec> = {
  "wp-plugin-simple": {
    target: "wp-plugin-simple",
    label: "WordPress plugin — single file",
    description:
      "A self-contained plugin file (.php) that drops into wp-content/plugins/. Best for one focused job: SEO meta auto-fill, redirect rules, custom schema, etc.",
    fileExt: "php",
    language: "php",
    preview: "syntax",
    installSteps: [
      "Save the generated code as a .php file (use the filename in the plugin header).",
      "Upload it to wp-content/plugins/ on your server (FTP, cPanel, or SSH).",
      "Go to WordPress admin → Plugins → Activate the new plugin.",
      "Visit the plugin's settings page (if it has one) or check the front-end.",
    ],
    warning:
      "Plugins run with full WordPress privileges. Review the code before activating on production.",
    systemPrompt: `You are a WordPress plugin author. Generate a SINGLE-FILE WordPress plugin (PHP) that solves the user's task.

Output requirements:
- Start with a valid plugin header docblock (Plugin Name, Description, Version, Author, License).
- No external dependencies. Use only WordPress core APIs.
- Hook into the right action/filter (wp_head, the_content, init, save_post, etc.).
- Sanitize all input (esc_html, esc_attr, sanitize_text_field).
- Escape all output.
- Add an admin notice on activation if a settings page exists.
- 200-400 lines max — keep it tight.
- Output ONLY the PHP code, including the <?php opener. No prose, no markdown fences.`,
  },

  "wp-plugin-advanced": {
    target: "wp-plugin-advanced",
    label: "WordPress plugin — full structure",
    description:
      "A multi-file plugin with admin settings page, options API, and proper WP conventions. Suitable for more complex SEO automation.",
    fileExt: "zip",
    language: "php",
    preview: "syntax",
    installSteps: [
      "Create a folder named after the plugin slug.",
      "Save each file the AI generates into that folder.",
      "Zip the folder.",
      "WordPress admin → Plugins → Add New → Upload Plugin → Activate.",
    ],
    warning:
      "Advanced plugins touch many WP internals. Test on staging before production.",
    systemPrompt: `You are a WordPress plugin author. Generate a multi-file plugin structure.

Output a single markdown response with each file inside its own code block, prefixed with the relative file path as a comment:

\`\`\`php
// FILE: my-plugin/my-plugin.php
<?php
/**
 * Plugin Name: ...
 */
\`\`\`

Files to include:
- Main plugin file with header docblock
- includes/class-main.php (main class)
- includes/class-admin.php (admin settings if needed)
- admin/views/settings.php (settings page view if needed)
- assets/css/admin.css (admin styles if needed)
- readme.txt (WordPress.org-compatible)

Conventions:
- WordPress coding standards.
- Singleton pattern for the main class.
- Nonces on every form.
- Use Options API or Settings API for stored options.
- Capability checks before any admin action.
- Output ONLY the code blocks with FILE: comments, no other prose.`,
  },

  "wp-functions": {
    target: "wp-functions",
    label: "WordPress functions.php snippet",
    description:
      "A standalone snippet you can paste into your theme's functions.php (or use a Code Snippets plugin). Use for quick SEO tweaks without packaging a plugin.",
    fileExt: "php",
    language: "php",
    preview: "syntax",
    installSteps: [
      "Open your active theme's functions.php OR install the free 'Code Snippets' plugin.",
      "Paste the snippet at the bottom (before the closing ?> if present).",
      "Save. WordPress applies it immediately.",
    ],
    warning:
      "A syntax error in functions.php can white-screen your site. Use Code Snippets plugin which validates before saving.",
    systemPrompt: `You are a WordPress developer. Output a clean functions.php snippet that solves the user's task.

Rules:
- Wrap functions in a unique prefix to avoid collisions.
- Use WordPress hooks (add_action, add_filter).
- Sanitize input, escape output.
- Add a 1-line comment explaining what the snippet does.
- 5-80 lines.
- Output ONLY the PHP snippet (no <?php opener — assume it's pasted into existing file). No prose, no markdown fences.`,
  },

  "html-snippet": {
    target: "html-snippet",
    label: "HTML snippet (any platform)",
    description:
      "Raw HTML + inline CSS you can paste into any CMS HTML field, custom code block, or anywhere on a page.",
    fileExt: "html",
    language: "html",
    preview: "iframe",
    installSteps: [
      "Copy the entire snippet.",
      "Open your page editor.",
      "Find the HTML / Custom Code / Embed block (most builders have one).",
      "Paste + save.",
    ],
    systemPrompt: `You are an SEO-focused front-end developer. Output a self-contained HTML snippet.

Rules:
- HTML5 valid.
- Inline CSS (no external stylesheets) so it works in any CMS HTML field.
- No external JavaScript unless the user explicitly asks.
- Semantic markup (<section>, <article>, <h2>, <h3>, etc.).
- Add schema.org microdata or JSON-LD inline if the topic benefits from it.
- Accessible (ARIA where needed, alt on images, contrast-safe colors).
- Mobile-responsive via CSS media queries or fluid units.
- 30-200 lines.
- Output ONLY the HTML — no prose, no fences, no <html>/<head>/<body> wrapper.`,
  },

  "elementor-html": {
    target: "elementor-html",
    label: "Elementor HTML widget",
    description:
      "Optimized for pasting into Elementor's HTML widget. Includes the styles Elementor strips by default.",
    fileExt: "html",
    language: "html",
    preview: "iframe",
    installSteps: [
      "Edit your page in Elementor.",
      "Drag in the 'HTML' widget.",
      "Paste the entire snippet.",
      "Click Update. Elementor renders it as-is.",
    ],
    systemPrompt: `You are an Elementor + WordPress developer. Output an HTML widget snippet.

Rules:
- Elementor strips <script> tags in some plans — prefer CSS animations.
- Inline all styles (Elementor sanitizes external CSS in some setups).
- Use unique class names with a prefix to avoid conflicting with theme/Elementor styles.
- Wrap top-level in a single <div> for clean Elementor handling.
- Add schema.org JSON-LD inline if relevant.
- Mobile responsive via inline media queries inside <style>.
- Output ONLY the HTML, no prose, no fences.`,
  },

  "shopify-liquid": {
    target: "shopify-liquid",
    label: "Shopify Liquid template",
    description:
      "A Liquid snippet for Shopify themes — adds custom meta, schema, or layout to product/collection pages.",
    fileExt: "liquid",
    language: "liquid",
    preview: "syntax",
    installSteps: [
      "Shopify admin → Online Store → Themes → Actions → Edit code.",
      "Find the right template (product.liquid, collection.liquid, theme.liquid).",
      "Paste the snippet where the comment block tells you to.",
      "Save. Changes apply immediately.",
    ],
    warning:
      "Always Duplicate the theme first. Liquid errors can break the storefront.",
    systemPrompt: `You are a Shopify theme developer. Output a Liquid snippet.

Rules:
- Use Liquid syntax ({{ ... }} for output, {% ... %} for logic).
- Reference Shopify objects correctly (product, collection, shop, cart).
- Add a header comment block saying which template file + which line to paste at.
- Escape output with proper filters (| escape, | url_encode).
- Output ONLY the Liquid code with the header comment, no prose, no fences.`,
  },

  "schema-jsonld": {
    target: "schema-jsonld",
    label: "Schema.org JSON-LD",
    description:
      "Structured data block to paste in the page's <head>. Works on any platform.",
    fileExt: "html",
    language: "html",
    preview: "syntax",
    installSteps: [
      "Copy the entire <script type=\"application/ld+json\"> block.",
      "Paste inside the <head> of your page (any platform).",
      "Validate with Google's Rich Results Test before publishing.",
    ],
    systemPrompt: `You are a structured data expert. Output a single <script type="application/ld+json"> block containing valid schema.org JSON.

Rules:
- Always include "@context": "https://schema.org" and a valid "@type".
- Fill ALL required fields for the chosen @type.
- Use the data the user provided. Use null for unknown values; don't invent.
- Match the exact format Google validates against (Rich Results Test).
- Output ONLY the <script>...</script> block. No prose, no fences.`,
  },

  htaccess: {
    target: "htaccess",
    label: ".htaccess rules (Apache)",
    description:
      "Server-level redirect rules, security headers, cache controls — works on Apache hosts (most shared hosting, cPanel).",
    fileExt: "htaccess",
    language: "apache",
    preview: "syntax",
    installSteps: [
      "Connect to your server via FTP or cPanel File Manager.",
      "Navigate to the site root (where wp-config.php or index.html lives).",
      "Open .htaccess (enable 'show hidden files' if you don't see it).",
      "Paste the rules at the top, save.",
      "Test immediately — bad rules can lock you out of the site.",
    ],
    warning:
      "A broken .htaccess breaks your entire site. ALWAYS back up the existing file first.",
    systemPrompt: `You are an Apache config expert. Output .htaccess rules.

Rules:
- Wrap rules in <IfModule> guards (e.g. <IfModule mod_rewrite.c>).
- Add a comment above each rule block explaining what it does.
- Order rules safely (rewrites before redirects, etc.).
- Test for common foot-guns: don't break /wp-admin, don't create redirect loops.
- Output ONLY the .htaccess directives + comments. No prose, no fences.`,
  },

  "nginx-config": {
    target: "nginx-config",
    label: "Nginx config snippet",
    description:
      "Server block rules for Nginx — redirects, headers, caching.",
    fileExt: "conf",
    language: "nginx",
    preview: "syntax",
    installSteps: [
      "SSH into your server (or open the Nginx config in your hosting panel).",
      "Edit /etc/nginx/sites-available/yoursite (or the relevant config).",
      "Paste inside the server { } block where indicated.",
      "Run `nginx -t` to test config syntax.",
      "If OK: `sudo systemctl reload nginx`.",
    ],
    warning: "Run `nginx -t` BEFORE reloading. A bad config takes the site offline.",
    systemPrompt: `You are an Nginx config expert. Output a server-block snippet.

Rules:
- Use proper Nginx directives (return, rewrite, add_header, location).
- Place inside server { } block — output starts as if dropped in.
- Comment above each block.
- Output ONLY the Nginx config + comments. No prose, no fences.`,
  },

  "robots-txt": {
    target: "robots-txt",
    label: "robots.txt",
    description: "Crawl rules for search engines + AI bots.",
    fileExt: "txt",
    language: "text",
    preview: "syntax",
    installSteps: [
      "Save as 'robots.txt'.",
      "Upload to your site root (yoursite.com/robots.txt).",
      "Verify by visiting that URL.",
      "Submit in Google Search Console under 'Settings → robots.txt'.",
    ],
    systemPrompt: `You are an SEO crawler-rules expert. Output a robots.txt file.

Rules:
- Standard syntax (User-agent, Allow, Disallow, Sitemap, Crawl-delay).
- Include AI bot rules per user request (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.).
- Add a Sitemap: line at the end.
- Comments with # prefix for clarity.
- Output ONLY the robots.txt contents. No prose, no fences.`,
  },

  "tracking-js": {
    target: "tracking-js",
    label: "Tracking / analytics JS",
    description:
      "JavaScript snippet for event tracking, conversion pixels, or custom analytics. Pastes into <head> or <body>.",
    fileExt: "html",
    language: "javascript",
    preview: "syntax",
    installSteps: [
      "Copy the <script> block.",
      "Paste in the page's <head> (most platforms have a 'custom code' or 'head injection' field).",
      "For WordPress: install Insert Headers and Footers, paste in the Head section.",
      "Test by inspecting the page + checking network tab for the analytics call.",
    ],
    systemPrompt: `You are a JS analytics expert. Output a tracking script.

Rules:
- Wrap in a self-executing IIFE so vars don't pollute the global namespace.
- Defer execution until DOMContentLoaded.
- Sanitize anything that becomes a URL parameter (encodeURIComponent).
- Output as a single <script>...</script> block.
- No external dependencies.
- Output ONLY the <script> block. No prose, no fences.`,
  },

  "react-component": {
    target: "react-component",
    label: "React / Next.js component (.tsx)",
    description:
      "Drop-in React component (TypeScript) — useful for headless / Next.js / Astro sites.",
    fileExt: "tsx",
    language: "tsx",
    preview: "syntax",
    installSteps: [
      "Save as .tsx in your project (e.g. components/).",
      "Import where needed: import { ComponentName } from \"@/components/...\";",
      "Render in your page/layout.",
    ],
    systemPrompt: `You are a React + TypeScript expert. Output a single self-contained component.

Rules:
- TypeScript strict (no any).
- Server-component-safe unless interactivity is required (then "use client" at top).
- Tailwind classes for styling.
- Accessible (ARIA, semantic tags).
- No external state libraries.
- Output ONLY the .tsx code. No prose, no fences.`,
  },

  "nextjs-route": {
    target: "nextjs-route",
    label: "Next.js App Router route",
    description:
      "A new route file (page.tsx) for Next.js 13+ App Router — useful for SEO landing pages, programmatic pages, sitemaps, etc.",
    fileExt: "tsx",
    language: "tsx",
    preview: "syntax",
    installSteps: [
      "Pick the URL path (e.g. /pricing → src/app/pricing/page.tsx).",
      "Save the generated file at that path.",
      "Next.js auto-routes — no config needed.",
    ],
    systemPrompt: `You are a Next.js 14+ App Router expert. Output a page.tsx (Server Component by default).

Rules:
- export default async function unless interactivity required.
- Include export const metadata = {...} for SEO.
- TypeScript strict.
- Use Tailwind classes.
- If dynamic, add export const dynamic = "force-dynamic" or revalidate.
- Output ONLY the .tsx code. No prose, no fences.`,
  },

  "drupal-twig": {
    target: "drupal-twig",
    label: "Drupal Twig template",
    description: "Drupal 9/10 Twig template snippet for theming.",
    fileExt: "twig",
    language: "twig",
    preview: "syntax",
    installSteps: [
      "Save in your theme's templates/ directory using Drupal naming.",
      "Clear cache (drush cr or admin → Performance → Clear cache).",
    ],
    systemPrompt: `You are a Drupal Twig expert. Output a template snippet using Twig + Drupal-specific functions.

Rules:
- Use Drupal Twig filters/functions (|t for translation, render(), drupal_url()).
- Add comment block at top stating which entity / view mode this applies to.
- Output ONLY the Twig code with comment header. No prose, no fences.`,
  },

  "ghost-injection": {
    target: "ghost-injection",
    label: "Ghost code injection (header/footer)",
    description:
      "Code injection block for Ghost CMS — pastes into Settings → Code injection (header or footer).",
    fileExt: "html",
    language: "html",
    preview: "syntax",
    installSteps: [
      "Ghost admin → Settings → Code injection.",
      "Paste in Site Header or Site Footer (per the snippet's comment).",
      "Save. Applies site-wide.",
    ],
    systemPrompt: `You are a Ghost CMS theming expert. Output a code injection snippet.

Rules:
- Top comment line: "<!-- PASTE IN: Site Header --> " or "<!-- PASTE IN: Site Footer -->".
- Self-contained HTML + inline CSS + optional <script>.
- Output ONLY the snippet. No prose, no fences.`,
  },

  "webflow-embed": {
    target: "webflow-embed",
    label: "Webflow HTML Embed",
    description:
      "Snippet for Webflow's Embed component — works on the free plan.",
    fileExt: "html",
    language: "html",
    preview: "iframe",
    installSteps: [
      "In Webflow Designer, drag an 'Embed' element where needed.",
      "Paste the entire snippet.",
      "Publish.",
    ],
    systemPrompt: `You are a Webflow expert. Output an HTML embed snippet.

Rules:
- Self-contained HTML + inline CSS.
- Note in a comment that Webflow's free plan limits external scripts.
- Output ONLY the snippet. No prose, no fences.`,
  },

  "csv-redirects": {
    target: "csv-redirects",
    label: "Bulk redirects CSV",
    description:
      "CSV of old-URL → new-URL pairs. Import into Redirection plugin (WP), Yoast, or any redirect manager.",
    fileExt: "csv",
    language: "text",
    preview: "syntax",
    installSteps: [
      "Save as redirects.csv.",
      "Import in your redirect manager (Redirection plugin: Tools → Import).",
      "Verify a few redirects with curl -I before going live.",
    ],
    systemPrompt: `You are an SEO migration expert. Output a CSV.

Rules:
- Header row: source,target,status
- One redirect per line.
- Status defaults to 301 unless user says otherwise.
- Group related URLs with adjacent rows.
- Output ONLY the CSV. No prose, no fences.`,
  },
};

export const TARGET_GROUPS = [
  {
    label: "WordPress",
    targets: ["wp-plugin-simple", "wp-plugin-advanced", "wp-functions"] as GeneratorTarget[],
  },
  {
    label: "Universal HTML / Embed",
    targets: ["html-snippet", "elementor-html", "webflow-embed", "ghost-injection"] as GeneratorTarget[],
  },
  {
    label: "Shopify",
    targets: ["shopify-liquid"] as GeneratorTarget[],
  },
  {
    label: "Structured data + crawl",
    targets: ["schema-jsonld", "robots-txt"] as GeneratorTarget[],
  },
  {
    label: "Server config",
    targets: ["htaccess", "nginx-config"] as GeneratorTarget[],
  },
  {
    label: "JS / tracking",
    targets: ["tracking-js"] as GeneratorTarget[],
  },
  {
    label: "Headless / dev",
    targets: ["react-component", "nextjs-route", "drupal-twig"] as GeneratorTarget[],
  },
  {
    label: "Migration",
    targets: ["csv-redirects"] as GeneratorTarget[],
  },
];
