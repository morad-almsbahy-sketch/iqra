/* Flipbook reader: CSS 3D leaves that turn around the spine. Two-page spread on wide screens, single page on narrow ones. */
(function () {
  const { $, $$, esc, icon, cover, toast, book } = RF;
  const S = RF.state;

  let b = null;        // current book
  let pages = [];      // [{html, num}]
  let mode = "double"; // double | single
  let f = 0;           // number of flipped leaves
  let maxF = 0;
  let leaves = [];
  let zoom = RF.load("zoom", 1);
  let busy = false;
  let rt = RF.load("rtheme", "paper");
  let marks = RF.load("marks", {});
  const RT_NAMES = { paper: "ورق فاتح", sepia: "ورق دافئ", night: "ورق ليلي" };

  /* ---------- page content ---------- */
  function buildPages() {
    const out = [];
    out.push({ html: '<div class="pg cover-pg">' + cover(b) + "</div>", num: null });
    out.push({
      html: '<div class="pg"><h3>' + esc(b.title) + "</h3><p><b>" + esc(b.author) + "</b></p><p>" + esc(b.about) + '</p><p class="note">هذه عينة تعريفية أُعدّت لهذا المتجر التجريبي لتلخّص أفكار الكتاب، وهي ليست مقتطفاً من نصّه الأصلي.</p></div>'
    });
    out.push({
      html: '<div class="pg"><h3>الفهرس</h3><ol>' + b.chapters.map((c, i) => '<li><button data-goto="' + (3 + i) + '">' + esc(c.t) + "</button></li>").join("") + "</ol></div>"
    });
    b.chapters.forEach((c) => out.push({ html: '<div class="pg"><h3>' + esc(c.t) + "</h3>" + c.p.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>" }));
    out.push({
      html: '<div class="pg"><h3>انتهت العينة</h3><p>إذا أعجبتك الفكرة العامة، يمكنك إضافة الكتاب كاملاً إلى سلتك أو إلى قائمة المفضلة.</p><p class="pull">' + esc(b.title) + " · " + RF.num(b.price) + ' ر.س</p><p><button class="btn small primary" data-act="cart" data-id="' + b.id + '" style="color:#fff">أضف إلى السلة</button></p></div>'
    });
    out.forEach((p, i) => (p.num = p.num === null ? null : i + 1));
    return out;
  }
  const face = (p, cls) => '<div class="face ' + cls + '">' + (p ? p.html + (p.num ? '<div class="pn">' + p.num + "</div>" : "") : '<div class="pg blank">' + icon("book") + "</div>") + "</div>";

  /* ---------- building the book ---------- */
  function build(keepIndex) {
    mode = wide() ? "double" : "single";
    const el = $("#book");
    el.classList.toggle("single", mode === "single");
    let html = "";
    if (mode === "double") {
      const L = Math.ceil(pages.length / 2);
      html += '<div class="endpaper"></div>';
      for (let k = 0; k < L; k++) html += '<div class="leaf" data-k="' + k + '">' + face(pages[2 * k], "front") + face(pages[2 * k + 1], "back") + "</div>";
      maxF = L;
    } else {
      for (let k = 0; k < pages.length; k++) html += '<div class="leaf" data-k="' + k + '">' + face(pages[k], "front") + face(null, "back") + "</div>";
      maxF = pages.length - 1;
    }
    el.innerHTML = html;
    leaves = $$(".leaf", el);
    setState(fOf(keepIndex || 0), false);
  }
  const fOf = (i) => (mode === "double" ? (i === 0 ? 0 : Math.min(Math.floor((i + 1) / 2), maxF)) : Math.min(i, maxF));
  const pageIndex = () => (mode === "double" ? (f === 0 ? 0 : Math.min(2 * f - 1, pages.length - 1)) : f);

  function zIndexes(movingK) {
    const n = leaves.length;
    leaves.forEach((lf, k) => {
      const flipped = k < f;
      lf.classList.toggle("flipped", flipped);
      lf.style.zIndex = k === movingK ? 1000 : flipped ? k + 1 : n - k;
    });
  }

  function setState(next, animate) {
    const prev = f;
    next = Math.max(0, Math.min(maxF, next));
    const jump = Math.abs(next - prev);
    f = next;
    if (!animate || jump !== 1) {
      leaves.forEach((l) => l.classList.add("instant"));
      zIndexes(-1);
      void $("#book").offsetWidth;
      leaves.forEach((l) => l.classList.remove("instant"));
    } else {
      const k = next > prev ? prev : next;
      busy = true;
      zIndexes(k);
      setTimeout(() => { zIndexes(-1); busy = false; }, 780);
    }
    updateUI();
  }

  /* ---------- bookmarks and paper color ---------- */
  const myMarks = () => (b && marks[b.id]) || [];
  function faceOf(i) {
    if (mode === "double") { const lf = leaves[Math.floor(i / 2)]; return lf && $(i % 2 ? ".face.back" : ".face.front", lf); }
    const lf = leaves[i]; return lf && $(".face.front", lf);
  }
  function paintMarks() {
    $$(".mark-ribbon").forEach((r) => r.remove());
    myMarks().forEach((i) => { const fc = faceOf(i); if (fc) { const r = document.createElement("i"); r.className = "mark-ribbon"; fc.appendChild(r); } });
    const on = myMarks().includes(pageIndex());
    $("#r-mark").setAttribute("aria-pressed", on);
    $("#r-mark").setAttribute("aria-label", on ? "إزالة الإشارة المرجعية" : "إضافة إشارة مرجعية");
    const list = $("#marks-list");
    const ms = myMarks().slice().sort((x, y) => x - y);
    list.innerHTML = ms.length ? ms.map((i) => '<li><button data-goto="' + i + '">صفحة ' + (i + 1) + "</button></li>").join("") : '<li class="none">لم تضف إشارات بعد.</li>';
  }
  function toggleMark() {
    if (!b) return;
    const i = pageIndex(), a = (marks[b.id] = marks[b.id] || []);
    const at = a.indexOf(i);
    if (at >= 0) { a.splice(at, 1); toast("أُزيلت الإشارة"); } else { a.push(i); toast("أُضيفت إشارة في الصفحة " + (i + 1)); }
    RF.save("marks", marks);
    paintMarks();
  }
  function applyTheme() {
    $("#reader").setAttribute("data-rt", rt);
    $("#r-theme").setAttribute("aria-label", "لون الورق: " + RT_NAMES[rt] + ". اضغط للتبديل");
    $("#r-theme").title = RT_NAMES[rt];
    $("#r-theme").innerHTML = icon(rt === "night" ? "moon" : "sun");
    RF.save("rtheme", rt);
  }
  function cycleTheme() { rt = rt === "paper" ? "sepia" : rt === "sepia" ? "night" : "paper"; applyTheme(); }

  function updateUI() {
    const pi = pageIndex();
    $("#r-pos").textContent = "صفحة " + (pi + 1) + " / " + pages.length;
    const r = $("#r-range");
    r.max = pages.length; r.value = pi + 1;
    $("#r-page-in").max = pages.length;
    paintMarks();
    $("#r-next").disabled = f >= maxF;
    $("#r-prev").disabled = f <= 0;
    if (b) {
      const old = S.reading[b.id] || {};
      S.reading[b.id] = { page: pi, total: pages.length, at: Date.now() };
      RF.persist.reading();
      void old;
    }
  }

  const wide = () => window.innerWidth >= 820 && window.innerHeight >= 430;
  const next = () => { if (!busy && f < maxF) setState(f + 1, true); };
  const prev = () => { if (!busy && f > 0) setState(f - 1, true); };
  function goto(i) {
    i = Math.max(0, Math.min(pages.length - 1, i));
    $("#toc").hidden = true;
    setState(fOf(i), true);
  }

  /* ---------- zoom / fullscreen ---------- */
  function applyZoom() { $("#reader").style.setProperty("--z", zoom); RF.save("zoom", zoom); }
  function setZoom(d) { zoom = Math.max(0.8, Math.min(1.8, Math.round((zoom + d) * 100) / 100)); applyZoom(); }
  function paintFull() { $("#r-full").innerHTML = icon(document.fullscreenElement ? "min" : "max"); }
  function toggleFull() {
    try {
      if (document.fullscreenElement) { const p = document.exitFullscreen(); if (p && p.catch) p.catch(() => {}); }
      else { const p = $("#reader").requestFullscreen(); if (p && p.catch) p.catch(() => toast("المتصفح لا يسمح بملء الشاشة هنا")); }
    } catch (e) { toast("المتصفح لا يسمح بملء الشاشة هنا"); }
  }

  /* ---------- open / close ---------- */
  RF.openReader = function (id) {
    b = book(id);
    pages = buildPages();
    $("#r-name").textContent = b.title;
    $("#r-author").textContent = b.author;
    const rd = S.reading[id];
    const start = rd ? Math.min(rd.page, pages.length - 1) : 0;
    $("#reader").hidden = false;
    $("#toc").hidden = true;
    document.body.style.overflow = "hidden";
    applyZoom();
    build(start);
    $("#toc-list").innerHTML = b.chapters.map((c, i) => '<li><button data-goto="' + (3 + i) + '">' + esc(c.t) + "</button></li>").join("");
    $("#r-close").focus();
    RF.refreshBadges();
  };
  function close() {
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
    $("#reader").hidden = true;
    document.body.style.overflow = "";
    b = null;
    RF.rerender();
  }
  function finish() {
    if (!b) return;
    if (S.shelf[b.id]) { toast("«" + b.title + "» موجود في كتبي: " + RF.ST[S.shelf[b.id].st]); return; }
    RF.shelfSet(b.id, "reading", true);
    toast("أُضيف «" + b.title + "» إلى كتبي: أقرأه الآن");
  }

  /* ---------- wiring ---------- */
  RF.initReader = function () {
    $("#r-close").innerHTML = icon("x");
    $("#r-toc").innerHTML = icon("list");
    $("#r-zin").innerHTML = icon("zin");
    $("#r-zout").innerHTML = icon("zout");
    $("#r-next").innerHTML = icon("left");
    $("#r-prev").innerHTML = icon("right");
    $("#r-mark").innerHTML = icon("heart");
    applyTheme();
    paintFull();
    $("#r-mark").addEventListener("click", toggleMark);
    $("#r-theme").addEventListener("click", cycleTheme);

    $("#r-close").addEventListener("click", close);
    $("#r-next").addEventListener("click", next);
    $("#r-prev").addEventListener("click", prev);
    $("#r-zin").addEventListener("click", () => setZoom(0.15));
    $("#r-zout").addEventListener("click", () => setZoom(-0.15));
    $("#r-full").addEventListener("click", toggleFull);
    $("#r-toc").addEventListener("click", () => { $("#toc").hidden = !$("#toc").hidden; });
    $("#r-finish").addEventListener("click", finish);
    $("#r-range").addEventListener("input", (e) => goto(Number(e.target.value) - 1));
    $("#r-go").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = parseInt($("#r-page-in").value, 10);
      if (!v) return;
      goto(v - 1);
      $("#r-page-in").value = "";
    });
    document.addEventListener("fullscreenchange", paintFull);
    $("#reader").addEventListener("click", (e) => {
      const g = e.target.closest("[data-goto]");
      if (g) goto(Number(g.dataset.goto));
    });

    /* swipe and click on the book */
    const bookEl = $("#book");
    let sx = 0, sy = 0, down = false;
    bookEl.addEventListener("pointerdown", (e) => { down = true; sx = e.clientX; sy = e.clientY; });
    bookEl.addEventListener("pointerup", (e) => {
      if (!down) return;
      down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { dx > 0 ? next() : prev(); return; }
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) return;
      if (e.target.closest("button, a, input")) return;
      const sel = window.getSelection && window.getSelection().toString();
      if (sel) return;
      const r = bookEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      if (mode === "double") { x < 0.5 ? next() : prev(); }
      else if (x < 0.4) next();
      else if (x > 0.6) prev();
    });
    bookEl.addEventListener("pointercancel", () => { down = false; });

    document.addEventListener("keydown", (e) => {
      if ($("#reader").hidden) return;
      if (e.target.matches && e.target.matches("input")) { if (e.key === "Escape") e.target.blur(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); next(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") { if (!$("#toc").hidden) $("#toc").hidden = true; else close(); }
      else if (e.key === "+" || e.key === "=") setZoom(0.15);
      else if (e.key === "-") setZoom(-0.15);
    });

    let rt;
    window.addEventListener("resize", () => {
      if ($("#reader").hidden || !b) return;
      clearTimeout(rt);
      rt = setTimeout(() => {
        const m = wide() ? "double" : "single";
        if (m !== mode) build(pageIndex());
      }, 150);
    });
  };
})();
