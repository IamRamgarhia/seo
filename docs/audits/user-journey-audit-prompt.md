# User-Journey End-to-End Audit Prompt

Use this prompt with any code reviewer (human or AI) to find install-time
and runtime bugs from a real-user perspective. Re-run periodically before
major releases.

---

## The prompt

Audit this self-hosted SEO platform (Next.js 16 + React 19 + Drizzle ORM
+ better-sqlite3 + Playwright) from the perspective of real users trying
to install and use it. Repo root: `c:\Users\princ\Downloads\Claude\seo`.

**Find bugs, broken paths, and friction points that would cause an install
failure, runtime error, or confusing UX moment for ANY of these personas.**

### Personas

**A. Windows + Node 22 LTS + no admin + no C++ tools.**
Runs `iwr ... | iex` in regular PowerShell. Expects 2-min install. Find
anything requiring admin, anything that fails on plain Node 22, anything
that secretly assumes Visual Studio or Python.

**B. Windows + Node 24 (cutting-edge) + dev system, multiple servers on
3000/3001/4000.**
Already has pnpm globally. Has other Node apps holding ports. Find port
conflicts, pnpm version-skew bugs, file-lock issues, anything that
crashes when other dev tools are running. The user IS this persona.

**C. macOS + Node 22 via Homebrew + no Docker.**
Runs `curl ... | bash`. Find bash-specific syntax errors, missing macOS
handling, .command launcher issues, Apple silicon vs Intel quirks.

**D. Ubuntu + Node 20 LTS + Docker installed.**
Same curl command. Docker auto-detected. Find Dockerfile/compose issues,
.npmrc not respected by Docker build, volume permission issues, missing
container-side env vars.

**E. Re-installer (existing user with live data).**
Has `~/seo/data.db`, `.env.local`, `.seo-encryption-key`, a running dev
server. Re-runs the installer. Find: data loss, locked files, port
chaos, half-applied migrations, lost encryption key.

**F. First-time user after a successful install.**
Opens `localhost:3000`. Tries to add first client, run first audit,
view dashboard. Has no AI key, no Google connection, no Playwright
warmed. Find empty-state crashes, "undefined is not a function",
null-deref errors, missing-API friction.

### Specific surfaces to audit

1. **Install scripts** (`install.ps1`, `install.sh`):
   - All here-strings closed at column 0 with no leading whitespace?
   - All `Die`/`die` calls trigger Save-LogAndExit / on_exit?
   - Strategy escalation actually escalates (not silently failing)?
   - Output captured to console AND log (no `2>&1 | Out-Null` blackholes)?
   - Non-ASCII chars (em-dashes, arrows) that break Windows-1252 decoding?
   - Port detection works when multiple ports are occupied?
   - Existing-install detection + dev-server kill ordering correct?
   - Env vars set BEFORE the commands that read them?

2. **Launchers** (`START.cmd`, `START.sh`, `STOP.cmd`, `STOP.sh`,
   `seo.cmd`, `seo.sh`):
   - Path with spaces (`C:\Users\John Doe\seo`) handled?
   - Port fallback works when saved port is taken by another process?
   - Kill-existing-server works without admin?
   - Exit codes propagate?
   - Output visible to a double-click user (not just a console session)?

3. **Database layer** (`src/db/client.ts`, `scripts/migrate.cjs`,
   `src/lib/data-dir.ts`):
   - Cold start with no `data.db` works?
   - `SEO_DATA_DIR` / `SEO_DB_PATH` / cwd-fallback resolution correct?
   - Migration script idempotent on re-run AND on partial-apply?
   - Migration error messages surface the failing SQL?

4. **First-run pages**:
   - Dashboard with 0 clients doesn't crash?
   - `/clients/new` submit works?
   - `/audits`, `/tasks`, `/keywords` with no data don't crash?
   - All `/settings/*` pages render without errors?
   - Pick 5 random `/tools/*` — do any blow up with no setup?

5. **API routes** (`src/app/api/**`):
   - `/api/v1/health` responds correctly?
   - `/api/restart`, `/api/shutdown` work?
   - `/api/backup`, `/api/restore` properly auth-gated?
   - `/api/update` handles non-git installs?
   - Any unauthenticated route that mutates state?

6. **AI flows with no key set**:
   - SEO Chat renders without crashing?
   - "Fix it for me" wizards degrade gracefully?
   - Daily agent jobs skip with informative log entries (not crashes)?

7. **Edge cases**:
   - Running both `START.cmd` and the in-app server simultaneously?
   - `PORT` env var overriding `.seo-port` file?
   - `SEO_BIND_HOST=0.0.0.0` without `APP_PASSWORD` (security)?
   - Multiple desktop shortcuts from repeated installs?

8. **Build + runtime**:
   - `pnpm build` succeeds in production mode?
   - `pnpm start:daily` works without falling back to dev?
   - SQLite WAL mode survives a hard kill?

### Reporting format

For each issue:
- **Severity:** Critical (blocks install/launch) / High (data
  corruption or hidden errors) / Medium (UX friction, will confuse
  users) / Low (cosmetic)
- **Persona affected:** which of A-F
- **File:line where the bug lives**
- **Reproduction:** exact steps a user would take
- **Root cause:** 1-2 sentences
- **Fix:** specific code change — show the patch, don't just describe

Skip:
- Style/nit issues
- "Code quality" not manifesting as a user-visible problem
- Anything below 80% confidence — false positives waste the
  maintainer's debugging time

End the report with a **prioritized fix list** (top 10) the maintainer
can ship in order: Critical first, High after, etc.

---

## Last run

(populated after each audit run)
