/* Shared helpers: storage, icons, generated covers, formatting. Everything hangs off window.RF. */
(function () {
  const RF = (window.RF = {});

  /* ---------- storage (localStorage with in-memory fallback) ---------- */
  const mem = {};
  RF.load = function (key, fallback) {
    try {
      const raw = localStorage.getItem("rafouf:" + key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {}
    return key in mem ? mem[key] : fallback;
  };
  RF.save = function (key, value) {
    mem[key] = value;
    try { localStorage.setItem("rafouf:" + key, JSON.stringify(value)); } catch (e) {}
  };

  /* ---------- small utils ---------- */
  RF.$ = (s, r) => (r || document).querySelector(s);
  RF.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  RF.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  RF.num = (n) => Number(n).toLocaleString("ar-SA-u-nu-latn", { maximumFractionDigits: 2 });
  RF.money = (n) => RF.num(n) + " ر.س";
  RF.book = (id) => window.BOOKS.find((b) => b.id === id);
  RF.norm = (s) => String(s).toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
  RF.yearLabel = (y) => (y < 1000 ? "القرن الثاني الميلادي" : y + "م");

  /* ---------- icons (Lucide-style paths, drawn inline) ---------- */
  const P = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    zin: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    zout: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/>',
    max: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    min: '<path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41m11.32-11.32 1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    plus: '<path d="M5 12h14M12 5v14"/>'
  };
  RF.icon = (name) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + P[name] + "</svg>";
  RF.stars = function (rating) {
    let out = '<span class="stars" role="img" aria-label="تقييم ' + rating + ' من 5">';
    for (let i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 24 24"' + (rating >= i - 0.25 ? "" : ' class="off"') + '><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg>';
    }
    return out + "</span>";
  };

  /* ---------- generated covers (original abstract artwork per title) ---------- */
  function motif(kind, c) {
    const a = c[0];
    switch (kind) {
      case "rings":
        return [0, 1, 2, 3, 4].map((i) => '<circle cx="100" cy="112" r="' + (22 + i * 16) + '" fill="none" stroke="' + a + '" stroke-width="' + (i % 2 ? 2 : 5) + '" opacity="' + (1 - i * 0.14) + '"/>').join("");
      case "stripes":
        return [0, 1, 2, 3, 4, 5, 6].map((i) => '<rect x="' + (20 + i * 26) + '" y="' + (60 + (i % 3) * 14) + '" width="14" height="' + (90 - (i % 3) * 14) + '" fill="' + a + '" opacity="' + (0.5 + (i % 3) * 0.25) + '"/>').join("");
      case "sun":
        return '<circle cx="100" cy="125" r="46" fill="' + a + '"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => '<rect x="97" y="52" width="6" height="16" rx="3" fill="' + a + '" transform="rotate(' + i * 45 + ' 100 125)"/>').join("") + '<rect x="0" y="150" width="200" height="40" fill="' + c[1] + '" opacity=".55"/>';
      case "waves":
        return [0, 1, 2, 3, 4].map((i) => '<path d="M0 ' + (70 + i * 22) + ' Q 25 ' + (50 + i * 22) + ' 50 ' + (70 + i * 22) + ' T 100 ' + (70 + i * 22) + ' T 150 ' + (70 + i * 22) + ' T 200 ' + (70 + i * 22) + '" fill="none" stroke="' + a + '" stroke-width="5" opacity="' + (1 - i * 0.15) + '"/>').join("");
      case "tri":
        return '<polygon points="100,52 168,172 32,172" fill="none" stroke="' + a + '" stroke-width="5"/><polygon points="100,86 146,162 54,162" fill="' + a + '" opacity=".55"/><polygon points="100,120 126,160 74,160" fill="' + a + '"/>';
      case "star":
        return [0, 1].map((i) => '<rect x="62" y="62" width="76" height="76" fill="' + (i ? "none" : a) + '" stroke="' + a + '" stroke-width="3" opacity="' + (i ? 1 : 0.4) + '" transform="rotate(' + i * 45 + ' 100 100) translate(0 12)"/>').join("") + '<circle cx="100" cy="112" r="10" fill="' + a + '"/>';
      case "circles":
        return '<circle cx="78" cy="104" r="42" fill="' + a + '" opacity=".75"/><circle cx="124" cy="124" r="32" fill="none" stroke="' + a + '" stroke-width="4"/><circle cx="150" cy="70" r="7" fill="' + a + '"/><circle cx="46" cy="164" r="4" fill="' + a + '"/>';
      case "grid":
        return [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((q) => '<rect x="' + (44 + q * 28) + '" y="' + (62 + r * 28) + '" width="22" height="22" fill="' + a + '" opacity="' + ((r + q) % 2 ? 0.9 : 0.3) + '"/>').join("")).join("");
      case "dots":
        return [0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((q) => '<circle cx="' + (44 + q * 28) + '" cy="' + (66 + r * 26) + '" r="' + (3 + ((r * 5 + q * 3) % 5)) + '" fill="' + a + '"/>').join("")).join("");
    }
    return "";
  }

  function wrapTitle(title) {
    const words = title.split(" ");
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > 11 && cur) { lines.push(cur); cur = w; } else { cur = (cur + " " + w).trim(); }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  RF.cover = function (b, cls) {
    if (b.img) return '<img class="cover cover-img ' + (cls || "") + '" src="' + b.img + '" alt="غلاف ' + RF.esc(b.title) + '" loading="lazy" decoding="async">';
    const lines = wrapTitle(b.title);
    const startY = 218 - (lines.length - 1) * 11;
    const t = lines.map((l, i) => '<text x="100" y="' + (startY + i * 24) + '" text-anchor="middle" direction="rtl" font-family="Cairo, Tahoma, sans-serif" font-weight="900" font-size="21" fill="#fff">' + RF.esc(l) + "</text>").join("");
    return '<svg class="cover ' + (cls || "") + '" viewBox="0 0 200 300" role="img" aria-label="غلاف ' + RF.esc(b.title) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="200" height="300" fill="' + b.colors[1] + '"/>' +
      motif(b.motif, b.colors) +
      '<rect x="0" y="0" width="9" height="300" fill="#000" opacity=".22"/>' +
      '<line x1="20" y1="196" x2="180" y2="196" stroke="' + b.colors[0] + '" stroke-width="2"/>' +
      t +
      '<text x="100" y="283" text-anchor="middle" direction="rtl" font-family="Cairo, Tahoma, sans-serif" font-size="12" fill="#fff" opacity=".8">' + RF.esc(b.author) + "</text></svg>";
  };

  /* ---------- toasts ---------- */
  RF.toast = function (msg) {
    const box = RF.$("#toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.style.transition = "opacity .3s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 320); }, 2400);
  };
})();
