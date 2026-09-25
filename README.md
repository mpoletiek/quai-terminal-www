# quai-terminal-www

The coming-soon site for [Quai Terminal](https://github.com/mpoletiek/quai-terminal). It's a single static page built with Vite: no framework, no runtime dependencies, and no third-party requests.

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
npm run preview   # serve dist/
```

## Deploy (Vercel)

Production is **https://quaiterminal.org** (`www.` redirects to the apex). DNS lives at Cloudflare: an `A @ 76.76.21.21` record and a `CNAME www cname.vercel-dns.com` record, both DNS-only (grey cloud).

**Installer URLs.** `quaiterminal.org/install.sh` and `/uninstall.sh` are rewrites that proxy the scripts from the wallet repo's `main` branch, so the site never holds a stale copy. They're served as `text/plain` with a 5-minute cache. `curl -fsSL https://quaiterminal.org/install.sh | sh` gets the script directly, with no redirect to follow.


Import the repo in Vercel. It detects Vite on its own, and `vercel.json` pins the build (`npm run build` → `dist`). It also sets these headers:

- long-lived caching for `/assets/*`
- a strict CSP: self only, plus the hash of the one inline script. If you change that script in `index.html`, regenerate the hash with `printf '%s' '<script body>' | openssl dgst -sha256 -binary | base64`.
- `Referrer-Policy: no-referrer`, `nosniff` and a locked-down `Permissions-Policy`

You can also deploy from the CLI: `npx vercel` (preview) or `npx vercel --prod`.

## Layout

```
index.html            all copy and markup
src/style.css         styles; colour roles mirror the TUI's semantic roles
src/main.js           theme engine, wordmark, rain, review demo, palette, keys, lock screen
public/assets/video   teaser (QuaiTeaser-v5-X) + silent feature loops cut from teaser/selects3
public/assets/img     posters, favicon
public/assets/fonts   JetBrains Mono, subset to woff2 (OFL)
```

## Where things come from

- **Themes:** the palettes are copied from `crates/quai-terminal/src/tui/themes.rs`. The Konami code gives the session-only Genesis theme, as in the app.
- **Wordmark:** `WORDMARK` from `crates/quai-terminal/src/tui/fx.rs`, drawn as SVG cells. As `ui/lock.rs` does, the top two rows use the QUAI colour and the rest use Qi's.
- **Claims:** every feature claim is from the wallet README and docs. Keep it honest, as the teaser plan says: no moon talk, "fastest", "audited", APY or PnL.
- **Video:** only clips already vetted for the teaser. The Pepe NFTs, receive QR codes, the LAN node IP and the GNOME bar are left out.

## Keys on the page

`j`/`k` scroll · `1`–`7` `0` sections · `[` `]` prev/next · `:` or `ctrl-k` palette · `T` next theme · `L` lock · `?` help · `g g` top · `g h` repo · `enter` plays the teaser from the top.
