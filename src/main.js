/* Quai Terminal — site behaviour.
   No dependencies, no network calls, no trackers. Everything degrades to a readable static page. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  root.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode: fine */ } },
  };

  /* ─── toast ─────────────────────────────────────────────────────────── */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg, ms = 2600) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  /* ─── themes: the same palettes the TUI ships (crates/quai-terminal/src/tui/themes.rs) ───
     fields: id, name, family, accent, selection, muted, background, lighter_background,
             foreground, red, orange, green, cyan, blue(=quai), magenta(=qi) */
  const THEMES = [
    ["quai-red", "Quai Red", "quai", "#ff3a14", "#3d120b", "#8f817d", "#080606", "#151010", "#efe6e3", "#ff4f8b", "#ffb000", "#5fd38d", "#6cb6ff", "#ff5a2e", "#b48cff"],
    ["quai-dark", "Quai Dark", "quai", "#4fd1c5", "#23394a", "#7a8699", "#0f141a", "#161d26", "#d7dde5", "#f0626d", "#f39a4a", "#7bd88f", "#5ccfe6", "#6ea8fe", "#c792ea"],
    ["quai-light", "Quai Light", "quai", "#0f766e", "#cfe8e5", "#5b6675", "#fbfbf8", "#f0f1ec", "#1f2933", "#c0343f", "#b75a0b", "#2f7d3a", "#0b7285", "#1d4ed8", "#8b3dbf"],
    ["high-contrast", "High Contrast", "access", "#00ffff", "#003a4d", "#bbbbbb", "#000000", "#101010", "#ffffff", "#ff5555", "#ffaa00", "#55ff55", "#55ffff", "#8888ff", "#ff77ff"],
    ["colorblind-safe", "Colorblind safe", "access", "#e69f00", "#243447", "#8a93a0", "#0d1117", "#161b22", "#e6edf3", "#ff7a33", "#e69f00", "#56b4e9", "#a6d8f5", "#3a9bdc", "#cc79a7"],
    ["tokyo-night", "Tokyo Night", "tokyo night", "#7aa2f7", "#283457", "#737aa2", "#1a1b26", "#1f2335", "#c0caf5", "#f7768e", "#ff9e64", "#9ece6a", "#7dcfff", "#7aa2f7", "#bb9af7"],
    ["tokyo-night-storm", "Tokyo Night Storm", "tokyo night", "#7aa2f7", "#2e3c64", "#737aa2", "#24283b", "#292e42", "#c0caf5", "#f7768e", "#ff9e64", "#9ece6a", "#7dcfff", "#7aa2f7", "#bb9af7"],
    ["tokyo-night-moon", "Tokyo Night Moon", "tokyo night", "#82aaff", "#2d3f76", "#828bb8", "#222436", "#2f334d", "#c8d3f5", "#ff757f", "#ff966c", "#c3e88d", "#86e1fc", "#82aaff", "#c099ff"],
    ["tokyo-night-day", "Tokyo Night Day", "tokyo night", "#2e7de9", "#b6bfe2", "#6172b0", "#e1e2e7", "#d0d5e3", "#3760bf", "#c51f4f", "#a14f00", "#4a6630", "#006a8e", "#2e62c9", "#8440e0"],
    ["catppuccin-mocha", "Catppuccin Mocha", "catppuccin", "#b4befe", "#45475a", "#9399b2", "#1e1e2e", "#313244", "#cdd6f4", "#f38ba8", "#fab387", "#a6e3a1", "#94e2d5", "#89b4fa", "#cba6f7"],
    ["catppuccin-macchiato", "Catppuccin Macchiato", "catppuccin", "#b7bdf8", "#494d64", "#939ab7", "#24273a", "#363a4f", "#cad3f5", "#ed8796", "#f5a97f", "#a6da95", "#8bd5ca", "#8aadf4", "#c6a0f6"],
    ["gruvbox-dark", "Gruvbox Dark", "gruvbox", "#fabd2f", "#504945", "#a89984", "#282828", "#3c3836", "#ebdbb2", "#fb4934", "#fe8019", "#b8bb26", "#8ec07c", "#83a598", "#d3869b"],
    ["gruvbox-light", "Gruvbox Light", "gruvbox", "#076678", "#d5c4a1", "#665c54", "#fbf1c7", "#ebdbb2", "#3c3836", "#9d0006", "#af3a03", "#5f5c0a", "#427b58", "#076678", "#8f3f71"],
    ["nord", "Nord", "nord", "#88c0d0", "#434c5e", "#8a93a6", "#2e3440", "#3b4252", "#d8dee9", "#bf616a", "#d08770", "#a3be8c", "#8fbcbb", "#81a1c1", "#b48ead"],
    ["dracula", "Dracula", "dracula", "#bd93f9", "#44475a", "#7f8bbd", "#282a36", "#343746", "#f8f8f2", "#ff5555", "#ffb86c", "#50fa7b", "#8be9fd", "#8be9fd", "#ff79c6"],
    ["rose-pine", "Rosé Pine", "rosé pine", "#ebbcba", "#403d52", "#908caa", "#191724", "#1f1d2e", "#e0def4", "#eb6f92", "#ebbcba", "#9ccfd8", "#9ccfd8", "#5ba3c0", "#c4a7e7"],
    ["rose-pine-moon", "Rosé Pine Moon", "rosé pine", "#ea9a97", "#44415a", "#908caa", "#232136", "#2a273f", "#e0def4", "#eb6f92", "#ea9a97", "#9ccfd8", "#9ccfd8", "#5aa7cb", "#c4a7e7"],
    ["kanagawa-wave", "Kanagawa Wave", "kanagawa", "#7e9cd8", "#2d4f67", "#8a8980", "#1f1f28", "#2a2a37", "#dcd7ba", "#e46876", "#ffa066", "#98bb6c", "#7aa89f", "#7e9cd8", "#957fb8"],
    ["kanagawa-dragon", "Kanagawa Dragon", "kanagawa", "#8ba4b0", "#2d4f67", "#8a9189", "#181616", "#282727", "#c5c9c5", "#c4746e", "#b6927b", "#8a9a7b", "#8ea4a2", "#8ba4b0", "#a292a3"],
    ["everforest-dark", "Everforest Dark", "everforest", "#a7c080", "#475258", "#9da9a0", "#2d353b", "#343f44", "#d3c6aa", "#e67e80", "#e69875", "#a7c080", "#83c092", "#7fbbb3", "#d699b6"],
    ["everforest-light", "Everforest Light", "everforest", "#6b8a26", "#e6e2cc", "#707b74", "#fdf6e3", "#f4f0d9", "#5c6a72", "#d13d3d", "#b75d15", "#5f7a14", "#2f7d5a", "#2f7390", "#b04f84"],
    ["solarized-dark", "Solarized Dark", "solarized", "#268bd2", "#073642", "#7c8f91", "#002b36", "#073642", "#93a1a1", "#dc322f", "#cb4b16", "#859900", "#2aa198", "#268bd2", "#d33682"],
    ["solarized-light", "Solarized Light", "solarized", "#1f6fae", "#eee8d5", "#5f7178", "#fdf6e3", "#eee8d5", "#4f6068", "#c42b28", "#a93c10", "#5f6e00", "#1d7a73", "#1f6fae", "#b02a6b"],
    ["monokai-pro", "Monokai Pro", "monokai", "#ffd866", "#403e41", "#939293", "#2d2a2e", "#363337", "#fcfcfa", "#ff6188", "#fc9867", "#a9dc76", "#78dce8", "#78dce8", "#ab9df2"],
    ["ayu-mirage", "Ayu Mirage", "ayu", "#ffcc66", "#33415e", "#8a9199", "#1f2430", "#242936", "#cccac2", "#f28779", "#ffad66", "#d5ff80", "#95e6cb", "#73d0ff", "#dfbfff"],
  ];

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lum = (h) => {
    const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

  function roles(t) {
    const [, , , accent, sel, muted, bg, raised, fg, red, orange, green, cyan, blue, magenta] = t;
    const light = lum(bg) > 0.4;
    return {
      light,
      vars: {
        "--bg": bg, "--raised": raised, "--fg": fg,
        "--strong": t[0] === "quai-red" ? "#ffffff" : mix(fg, light ? "#000000" : "#ffffff", 0.35),
        "--dim": muted, "--accent": accent, "--sel": sel,
        "--line": mix(bg, fg, light ? 0.2 : 0.17), "--line2": mix(bg, fg, light ? 0.36 : 0.3),
        "--quai": blue, "--qi": magenta, "--ok": green, "--down": red, "--warn": orange,
        "--pend": mix(orange, light ? "#000000" : "#ffffff", 0.3), "--link": cyan,
        "--on-accent": contrast(accent, "#000000") >= contrast(accent, "#ffffff") ? "#000000" : "#ffffff",
      },
    };
  }

  const GENESIS = { "--bg": "#000000", "--raised": "#0e0407", "--sel": "#340a16", "--line": "#4a1220", "--line2": "#7a1c34" };
  let themeId = "quai-red";

  function applyTheme(id, { save = true, announce = false } = {}) {
    const genesis = id === "genesis";
    const t = THEMES.find((x) => x[0] === (genesis ? "quai-red" : id)) || THEMES[0];
    const r = roles(t);
    const vars = genesis ? { ...r.vars, ...GENESIS } : r.vars;
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    root.dataset.theme = genesis ? "genesis" : t[0];
    root.dataset.mode = r.light ? "light" : "dark";
    root.style.colorScheme = r.light ? "light" : "dark";
    $('meta[name="theme-color"]').setAttribute("content", vars["--bg"]);
    themeId = genesis ? "genesis" : t[0];
    if (save && !genesis) store.set("qt-theme", t[0]);
    rain.recolor();
    lockRain.recolor();
    renderThemeList();
    if (announce) toast(genesis ? "◆ Genesis · session only. The next visit is your chosen theme again." : `theme · ${t[1]}`);
  }

  /* ─── wordmark: the TUI's own block art, drawn as crisp SVG cells ───── */
  const WORDMARK = [
    " ███  ██ ██  ███  ████   ██████ █████ ████  ██   ██ ████ ██   ██  ███  ██   ",
    "██ ██ ██ ██ ██ ██  ██      ██   ██    ██ ██ ███ ███  ██  ███  ██ ██ ██ ██   ",
    "██ ██ ██ ██ █████  ██      ██   ████  ████  ██ █ ██  ██  ██ █ ██ █████ ██   ",
    "██ ██ ██ ██ ██ ██  ██      ██   ██    ██ ██ ██   ██  ██  ██  ███ ██ ██ ██   ",
    " ██▄█  ███  ██ ██ ████     ██   █████ ██ ██ ██   ██ ████ ██   ██ ██ ██ █████",
  ];
  function buildWordmark(el, animate) {
    const CW = 10, CH = 20;
    const cols = Math.max(...WORDMARK.map((l) => [...l].length));
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${cols * CW} ${WORDMARK.length * CH}`);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("shape-rendering", "crispEdges");
    WORDMARK.forEach((line, row) => {
      [...line].forEach((ch, col) => {
        if (ch !== "█" && ch !== "▄") return;
        const r = document.createElementNS(svgNS, "rect");
        const half = ch === "▄";
        r.setAttribute("x", col * CW);
        r.setAttribute("y", row * CH + (half ? CH / 2 : 0));
        r.setAttribute("width", CW + 0.4);
        r.setAttribute("height", (half ? CH / 2 : CH) + 0.4);
        // Top two rows in the QUAI colour, the rest in Qi's — as ui/lock.rs draws it.
        r.style.fill = row < 2 ? "var(--quai)" : "var(--qi)";
        r.style.setProperty("--d", (col * 0.011 + Math.random() * 0.4).toFixed(3) + "s");
        svg.appendChild(r);
      });
    });
    el.replaceChildren(svg);
    el.classList.toggle("still", !animate);
    if (animate) requestAnimationFrame(() => el.classList.add("on"));
  }

  /* ─── digital rain (after the lock screen's matrix effect) ──────────── */
  function makeRain(canvas) {
    const ctx = canvas.getContext("2d");
    const GLYPHS = "01234567890ABCDEFabcdef░▒▓█▄▀ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ$#%&*+=<>";
    let cols = 0, drops = [], size = 16, raf = 0, last = 0, running = false;
    let head = "#fff", body = "#ff3a14", bg = "#080606";
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = canvas.clientWidth < 600 ? 13 : 16;
      cols = Math.ceil(canvas.clientWidth / size);
      drops = Array.from({ length: cols }, () => Math.random() * -60);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
    function frame(ts) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (ts - last < 55) return;
      last = ts;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.fillStyle = bg + "22";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${size}px JBM, monospace`;
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * size;
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        ctx.fillStyle = Math.random() < 0.08 ? head : body;
        ctx.fillText(ch, i * size, y);
        if (y > h && Math.random() > 0.975) drops[i] = Math.random() * -20;
        drops[i] += 0.55 + (i % 3) * 0.12;
      }
    }
    return {
      start() { if (reduced || running) return; running = true; if (!cols) resize(); raf = requestAnimationFrame(frame); },
      stop() { running = false; cancelAnimationFrame(raf); },
      resize() { if (canvas.clientWidth) resize(); },
      recolor() {
        const cs = getComputedStyle(root);
        body = cs.getPropertyValue("--accent").trim() || body;
        head = cs.getPropertyValue("--strong").trim() || head;
        bg = cs.getPropertyValue("--bg").trim() || bg;
        if (cols) { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight); }
      },
    };
  }
  const rain = makeRain($("#rain"));
  const lockRain = makeRain($("#lock-rain"));
  addEventListener("resize", () => { rain.resize(); lockRain.resize(); });

  /* ─── hero sequence: type the command, decrypt the wordmark ─────────── */
  const hero = $("#home");
  function heroIntro() {
    const typed = $("#typed");
    const cmd = "quai-terminal";
    const wm = $("#wordmark");
    if (reduced) {
      typed.textContent = cmd;
      buildWordmark(wm, false);
      hero.classList.add("ready");
      return;
    }
    let i = 0;
    const tick = () => {
      typed.textContent = cmd.slice(0, ++i);
      if (i < cmd.length) setTimeout(tick, 55 + Math.random() * 70);
      else setTimeout(() => {
        buildWordmark(wm, true);
        setTimeout(() => hero.classList.add("ready"), 650);
      }, 260);
    };
    setTimeout(tick, 350);
    // Hover glitch, like the lock screen's tear.
    wm.addEventListener("mouseenter", () => {
      wm.classList.remove("glitch"); void wm.offsetWidth; wm.classList.add("glitch");
    });
  }

  new IntersectionObserver(([e]) => (e.isIntersecting ? rain.start() : rain.stop()), { threshold: 0.05 }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { rain.stop(); lockRain.stop(); } });

  /* ─── teaser ────────────────────────────────────────────────────────── */
  const player = $("#player");
  const teaser = $("#teaser-video");
  function playTeaser() {
    player.classList.add("playing");
    teaser.controls = true;
    teaser.muted = false;
    teaser.play().catch(() => { teaser.muted = true; teaser.play().catch(() => {}); });
    player.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }
  $("#play-teaser").addEventListener("click", playTeaser);
  $$('[data-action="play-teaser"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); playTeaser(); }));
  teaser.addEventListener("ended", () => { player.classList.remove("playing"); teaser.controls = false; teaser.load(); });

  /* ─── loops play only while on screen ───────────────────────────────── */
  const loops = $$("video.loop");
  if (reduced) loops.forEach((v) => { v.controls = true; });
  else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); }
        else v.pause();
      }
    }, { threshold: 0.35 });
    loops.forEach((v) => io.observe(v));
  }

  /* ─── reveal the manifesto ──────────────────────────────────────────── */
  const manifesto = $(".manifesto");
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { manifesto.classList.add("in"); o.disconnect(); } }, { threshold: 0.4 }).observe(manifesto);

  /* ─── rail + header follow the section in view ──────────────────────── */
  const sections = $$("main > section[data-n]");
  const railLinks = $$(".rail a");
  const nowEl = $("#now-section");
  let current = "1";
  const secObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const n = e.target.dataset.n;
      current = n;
      railLinks.forEach((a) => a.classList.toggle("on", a.dataset.n === n));
      nowEl.textContent = `${n} ${e.target.dataset.name}`;
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => secObs.observe(s));
  const ORDER = ["1", "2", "3", "4", "5", "6", "7", "0"];
  function goSection(n) {
    const s = $(`main > section[data-n="${n}"]`);
    if (s) s.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  /* ─── the review: approve only after reading to the end ─────────────── */
  const rBody = $("#review-body"), rApprove = $("#r-approve"), rReject = $("#r-reject");
  const rBar = $("#r-bar"), rPct = $("#r-pct"), rOut = $("#r-out");
  let armed = false, done = false;
  function readProgress() {
    const max = rBody.scrollHeight - rBody.clientHeight;
    const p = max <= 0 ? 1 : rBody.scrollTop / max;
    const pct = Math.min(100, Math.round(p * 100));
    rBar.style.width = pct + "%";
    rPct.textContent = pct + "% read";
    if (pct >= 99 && rApprove.disabled && !done) {
      rApprove.disabled = false;
      rApprove.removeAttribute("aria-disabled");
      rApprove.textContent = "Approve & sign";
    }
  }
  rBody.addEventListener("scroll", readProgress, { passive: true });
  function resetReview() {
    done = false; armed = false;
    rApprove.disabled = true; rApprove.setAttribute("aria-disabled", "true");
    rApprove.classList.remove("armed");
    rApprove.textContent = "Approve & sign · read to enable";
    rBody.scrollTop = 0;
    readProgress();
  }
  function finish(html, ms = 7000) {
    done = true;
    rOut.innerHTML = html;
    rApprove.disabled = true;
    setTimeout(() => { rOut.textContent = ""; resetReview(); }, ms);
  }
  function sign() {
    finish('<span class="ok">✓ nothing was signed.</span> This page has no keys. It\'s a website. But you read to the end first, which is the whole point.', 9000);
  }
  function reject() {
    if (done) return;
    finish('<span class="down">✗ rejected.</span> Nothing signed · nonce 97 released for the next transaction.');
  }
  rReject.addEventListener("click", reject);
  rApprove.addEventListener("click", () => {
    if (rApprove.disabled) return;
    if (armed && coarse) return sign(); // touch has no Enter key: a second tap signs
    armed = true;
    rApprove.classList.add("armed");
    rApprove.textContent = coarse ? "Armed · tap again to sign" : "Armed · enter to sign";
    rOut.innerHTML = '<span class="dim">a click only arms Approve. You sign with a key.</span>';
    rApprove.focus();
  });
  rApprove.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !rApprove.disabled) { e.preventDefault(); e.stopPropagation(); armed ? sign() : rApprove.click(); }
  });
  $("#review-demo").addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); reject(); } });
  readProgress();

  /* ─── shell: a typed session, only while visible ────────────────────── */
  const SESSION = [
    ["quai-terminal balance", ""],
    ["quai-terminal swap quote QUAI USDT 100", "route, minimum out, price impact"],
    ["quai-terminal convert quote quai-to-qi 100", "protocol vs market route, side by side"],
    ["quai-terminal contract read 0x00… balanceOf 0x00…", "a node simulation: nothing signed, nothing sent"],
    ["quai-terminal send batch payroll.csv --dry-run", "shows every send, signs nothing"],
    ["quai-terminal order create quai usdt 1 --target +5%", "the wallet waits; you still sign"],
    ["quai-terminal config set proxy socks5h://127.0.0.1:9050", "Tor, fail-closed"],
    ["quai-terminal nft list --json | jq length", "ownership re-checked on-chain"],
    ["quai-terminal status --format waybar", ""],
    ["quai-terminal", "the TUI"],
  ];
  const term = $("#term");
  let termRun = false, termTimer = 0, termLine = 0;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function termStatic() {
    term.innerHTML = SESSION.map(([c, n]) => `<span class="p">$</span> ${esc(c)}${n ? `\n<span class="c">  # ${esc(n)}</span>` : ""}`).join("\n");
  }
  function termType() {
    if (!termRun) return;
    if (termLine >= SESSION.length) { termLine = 0; termTimer = setTimeout(() => { term.innerHTML = ""; termType(); }, 2600); return; }
    const [cmd, note] = SESSION[termLine];
    const pre = term.innerHTML + (term.innerHTML ? "\n" : "") + '<span class="p">$</span> ';
    let i = 0;
    const step = () => {
      if (!termRun) return;
      term.innerHTML = pre + esc(cmd.slice(0, ++i)) + '<span class="cur"></span>';
      if (i < cmd.length) termTimer = setTimeout(step, 22 + Math.random() * 45);
      else termTimer = setTimeout(() => {
        term.innerHTML = pre + esc(cmd) + (note ? `\n<span class="c">  # ${esc(note)}</span>` : "");
        while (term.scrollHeight > term.clientHeight + 4 && term.innerHTML.includes("\n")) {
          term.innerHTML = term.innerHTML.slice(term.innerHTML.indexOf("\n") + 1);
        }
        termLine++;
        termTimer = setTimeout(termType, 700);
      }, 380);
    };
    step();
  }
  if (reduced) termStatic();
  else new IntersectionObserver(([e]) => {
    termRun = e.isIntersecting;
    clearTimeout(termTimer);
    if (termRun) termType();
  }, { threshold: 0.25 }).observe(term);

  /* ─── theme showroom ────────────────────────────────────────────────── */
  const tList = $("#theme-list"), tFilter = $("#theme-filter");
  let tCursor = -1;
  function renderThemeList() {
    const q = (tFilter.value || "").toLowerCase();
    const shown = THEMES.filter((t) => !q || t[1].toLowerCase().includes(q) || t[2].includes(q));
    tList.innerHTML = shown.map((t, i) => {
      const sw = [t[6], t[3], t[13], t[14], t[11]].map((c) => `<i style="background:${c}"></i>`).join("");
      return `<li role="option" data-id="${t[0]}" aria-selected="${t[0] === themeId}" class="${i === tCursor ? "cursor" : ""}">${t[1]} <span class="fam">${t[2]}</span><span class="sw" aria-hidden="true">${sw}</span></li>`;
    }).join("") || '<li class="dim">no theme matches. 31 ship in the app.</li>';
  }
  tList.addEventListener("click", (e) => { const li = e.target.closest("li[data-id]"); if (li) applyTheme(li.dataset.id, { announce: true }); });
  tFilter.addEventListener("input", () => { tCursor = 0; renderThemeList(); });
  tFilter.addEventListener("keydown", (e) => {
    const items = $$("li[data-id]", tList);
    if (e.key === "ArrowDown") { e.preventDefault(); tCursor = Math.min(items.length - 1, tCursor + 1); renderThemeList(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); tCursor = Math.max(0, tCursor - 1); renderThemeList(); }
    else if (e.key === "Enter" && items[Math.max(0, tCursor)]) { applyTheme(items[Math.max(0, tCursor)].dataset.id, { announce: true }); }
    else if (e.key === "Escape") tFilter.blur();
  });
  function nextTheme() {
    const i = THEMES.findIndex((t) => t[0] === themeId);
    applyTheme(THEMES[(i + 1) % THEMES.length][0], { announce: true });
  }

  /* ─── copy install ──────────────────────────────────────────────────── */
  async function copyInstall() {
    const txt = $("#install-cmd").textContent;
    try { await navigator.clipboard.writeText(txt); toast("✓ copied. Read install.sh before you pipe it to sh."); }
    catch { toast("copy failed: select the command by hand"); }
  }
  $("#copy-install").addEventListener("click", copyInstall);

  /* ─── lock screen ───────────────────────────────────────────────────── */
  const lockEl = $("#lock");
  let lockedAt = 0;
  function lock() {
    if (!lockEl.hidden) return;
    closeOverlays();
    teaser.pause();
    const d = new Date();
    $("#lock-meta").textContent = `zone cyprus-1 · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · keys: none on this page`;
    lockEl.hidden = false;
    buildWordmark($("#lock-wordmark"), !reduced);
    lockRain.resize(); lockRain.recolor(); lockRain.start();
    lockedAt = Date.now();
  }
  function unlock() {
    if (lockEl.hidden || Date.now() - lockedAt < 350) return;
    lockEl.hidden = true;
    lockRain.stop();
  }
  lockEl.addEventListener("click", unlock);
  $("#do-lock").addEventListener("click", lock);

  /* ─── overlays: palette + help ──────────────────────────────────────── */
  const pal = $("#palette"), palIn = $("#pal-input"), palList = $("#pal-list"), help = $("#help");
  let lastFocus = null;
  const GH = "https://github.com/mpoletiek/quai-terminal";
  const COMMANDS = [
    ...[["1", "home"], ["2", "markets & trade"], ["3", "the review"], ["4", "qi & privacy"], ["5", "vault & spec"], ["6", "tui + cli"], ["7", "themes"], ["0", "status"]]
      .map(([n, name]) => ({ label: `go ${name}`, kind: `section ${n}`, run: () => goSection(n) })),
    { label: "play the teaser", kind: "action", run: playTeaser },
    { label: "lock", kind: "action · L", run: lock },
    { label: "copy install command", kind: "action", run: copyInstall },
    { label: "open the repo", kind: "link · g h", run: () => open(GH, "_blank", "noopener") },
    { label: "keys", kind: "help · ?", run: () => openOverlay(help) },
    { label: "top", kind: "g g", run: () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }) },
    ...THEMES.map((t) => ({ label: `theme ${t[1]}`, kind: "theme", run: () => applyTheme(t[0], { announce: true }) })),
  ];
  let palCursor = 0, palShown = COMMANDS;
  function fuzzy(label, q) {
    // subsequence match, highlighting the hits
    if (!q) return { ok: true, html: esc(label), score: 0 };
    let j = 0, html = "", score = 0, prev = -2;
    for (let i = 0; i < label.length; i++) {
      if (j < q.length && label[i].toLowerCase() === q[j]) { html += `<mark>${esc(label[i])}</mark>`; score += i === prev + 1 ? 2 : 1; prev = i; j++; }
      else html += esc(label[i]);
    }
    return { ok: j === q.length, html, score };
  }
  function renderPalette() {
    const q = palIn.value.trim().toLowerCase();
    const res = COMMANDS.map((c) => ({ c, m: fuzzy(c.label, q) })).filter((x) => x.m.ok);
    if (q) res.sort((a, b) => b.m.score - a.m.score);
    palShown = res.map((x) => x.c);
    palCursor = Math.min(palCursor, Math.max(0, palShown.length - 1));
    palList.innerHTML = res.map((x, i) => `<li role="option" data-i="${i}" class="${i === palCursor ? "cursor" : ""}"><span>${x.m.html}</span><span class="kind">${esc(x.c.kind)}</span></li>`).join("")
      || '<li class="dim">nothing matches</li>';
    const cur = palList.querySelector(".cursor");
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  function runPalette(i) {
    const c = palShown[i];
    if (!c) return;
    closeOverlays();
    c.run();
  }
  palIn.addEventListener("input", () => { palCursor = 0; renderPalette(); });
  palIn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) { e.preventDefault(); palCursor = Math.min(palShown.length - 1, palCursor + 1); renderPalette(); }
    else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) { e.preventDefault(); palCursor = Math.max(0, palCursor - 1); renderPalette(); }
    else if (e.key === "Enter") { e.preventDefault(); runPalette(palCursor); }
  });
  palList.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) runPalette(+li.dataset.i); });
  function openOverlay(el) {
    closeOverlays();
    lastFocus = document.activeElement;
    el.hidden = false;
    if (el === pal) { palIn.value = ""; palCursor = 0; renderPalette(); palIn.focus(); }
    else {
      const modal = el.querySelector(".modal");
      modal.setAttribute("tabindex", "-1");
      modal.focus();
    }
  }
  function closeOverlays() {
    const wasOpen = !pal.hidden || !help.hidden;
    pal.hidden = true; help.hidden = true;
    if (wasOpen && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  [pal, help].forEach((o) => o.addEventListener("click", (e) => { if (e.target === o) closeOverlays(); }));
  $("#open-palette").addEventListener("click", () => openOverlay(pal));

  /* ─── keyboard: one meaning per key ─────────────────────────────────── */
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konami = 0, gPending = 0;
  document.addEventListener("keydown", (e) => {
    // The lock screen takes every key, as the app's does.
    if (!lockEl.hidden) { e.preventDefault(); unlock(); return; }

    // Konami → Genesis (session only), tracked before anything else consumes the keys.
    konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (konami === KONAMI.length) { konami = 0; applyTheme("genesis", { save: false, announce: true }); return; }

    const tag = (e.target.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    const overlayOpen = !pal.hidden || !help.hidden;

    if (e.key === "Escape" && overlayOpen) { e.preventDefault(); closeOverlays(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openOverlay(pal); return; }
    if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); lock(); return; }
    if (typing || overlayOpen || e.altKey || e.ctrlKey || e.metaKey) return;

    const k = e.key;
    if (gPending && Date.now() - gPending < 900) {
      gPending = 0;
      if (k === "g") { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); return; }
      if (k === "h") { e.preventDefault(); open(GH, "_blank", "noopener"); return; }
    }
    switch (k) {
      case "j": scrollBy({ top: 90, behavior: "auto" }); break;
      case "k": scrollBy({ top: -90, behavior: "auto" }); break;
      case "d": scrollBy({ top: innerHeight * 0.5, behavior: reduced ? "auto" : "smooth" }); break;
      case "u": scrollBy({ top: -innerHeight * 0.5, behavior: reduced ? "auto" : "smooth" }); break;
      case "g": gPending = Date.now(); break;
      case "G": scrollTo({ top: document.body.scrollHeight, behavior: reduced ? "auto" : "smooth" }); break;
      case ":": e.preventDefault(); openOverlay(pal); break;
      case "?": e.preventDefault(); openOverlay(help); break;
      case "T": nextTheme(); break;
      case "L": lock(); break;
      case "[": case "]": {
        const i = ORDER.indexOf(current);
        goSection(ORDER[Math.max(0, Math.min(ORDER.length - 1, i + (k === "]" ? 1 : -1)))]);
        break;
      }
      case "Enter":
        if (scrollY < innerHeight * 0.6 && (e.target === document.body || e.target === root)) { e.preventDefault(); playTeaser(); }
        break;
      default:
        if (/^[0-7]$/.test(k)) goSection(k);
    }
  });

  /* ─── boot ──────────────────────────────────────────────────────────── */
  const saved = store.get("qt-theme");
  applyTheme(THEMES.some((t) => t[0] === saved) ? saved : "quai-red", { save: false });
  heroIntro();
  rain.resize();
})();
