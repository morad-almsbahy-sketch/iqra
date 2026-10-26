/* Store, library, detail modal, cart and checkout. */
(function () {
  const { $, $$, esc, money, icon, cover, stars, toast, load, save, book } = RF;

  const S = (RF.state = {
    cart: load("cart", []),            // [{id, qty}]
    coupon: load("coupon", ""),
    favs: load("favs", []),            // [id]
    reading: load("reading", {}),      // {id: {page, total, at}}
    done: load("done", []),
    shelf: load("shelf", null),   // {id: {st, pct, at, started, finished, rate}}            // [id]
    cat: "الكل", q: "", sort: "sales", libTab: "reading", view: "home"
  });
  if (S.shelf === null) {      // carry over books the user had marked as finished before the shelf existed
    S.shelf = {};
    S.done.forEach((id) => { S.shelf[id] = { st: "done", pct: 100, at: Date.now(), finished: Date.now() }; });
    save("shelf", S.shelf);
  }
  const persist = {
    cart: () => save("cart", S.cart), coupon: () => save("coupon", S.coupon),
    favs: () => save("favs", S.favs), shelf: () => save("shelf", S.shelf), reading: () => save("reading", S.reading), done: () => save("done", S.done)
  };
  RF.persist = persist;

  const SHIPPING = 18, FREE_FROM = 150;

  /* ---------- totals ---------- */
  function totals() {
    const sub = S.cart.reduce((s, l) => s + book(l.id).price * l.qty, 0);
    const c = window.COUPONS[S.coupon];
    let disc = 0;
    if (c) disc = c.type === "pct" ? Math.round(sub * c.value) / 100 : Math.min(c.value, sub);
    const after = sub - disc;
    const ship = S.cart.length === 0 ? 0 : after >= FREE_FROM ? 0 : SHIPPING;
    return { sub, disc, ship, total: after + ship, count: S.cart.reduce((n, l) => n + l.qty, 0) };
  }
  RF.totals = totals;

  /* ---------- header bits ---------- */
  function refreshBadges() {
    const t = totals();
    const btn = $("#cart-btn");
    btn.innerHTML = icon("cart") + (t.count ? '<span class="badge">' + t.count + "</span>" : "");
    const libN = new Set([...S.favs, ...Object.keys(S.shelf)]).size;
    const c = $("#lib-count");
    c.hidden = !libN;
    c.textContent = libN;
  }
  RF.refreshBadges = refreshBadges;

  /* ---------- theme ---------- */
  function effectiveTheme() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function paintThemeBtn() {
    const dark = effectiveTheme() === "dark";
    $("#theme-btn").innerHTML = icon(dark ? "sun" : "moon");
    $("#theme-btn").setAttribute("aria-label", dark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن");
  }
  function initTheme() {
    const saved = load("theme", "");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    paintThemeBtn();
    $("#theme-btn").addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      save("theme", next);
      paintThemeBtn();
    });
    try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintThemeBtn); } catch (e) {}
  }

  /* ---------- cards ---------- */
  function shelfChip(id) {
    const e = S.shelf[id];
    return e ? '<span class="shelf-chip st-' + e.st + '">' + RF.ST[e.st] + "</span>" : "";
  }
  function cardHTML(b, mode) {
    const fav = S.favs.includes(b.id);
    const rd = S.reading[b.id];
    const isDone = S.done.includes(b.id);
    let foot;
    if (mode === "reading" || mode === "done") {
      const pct = rd ? Math.round(((rd.page + 1) / rd.total) * 100) : 0;
      foot =
        '<div><div class="prog-label"><span>' + (isDone ? "اكتملت القراءة" : "تقدّم القراءة") + "</span><span>" + (isDone ? "100" : pct) + '%</span></div><div class="progress"><i style="width:' + (isDone ? 100 : pct) + '%"></i></div></div>' +
        '<div class="btn-row"><button class="btn primary" data-act="read" data-id="' + b.id + '">' + icon("book") + (isDone ? "إعادة القراءة" : "متابعة القراءة") + "</button>" +
        '<button class="btn heart ' + (fav ? "on" : "") + '" data-act="fav" data-id="' + b.id + '" aria-pressed="' + fav + '" aria-label="المفضلة">' + icon("heart") + "</button></div>";
    } else if (mode === "fav") {
      foot =
        '<div class="price-row"><span class="price">' + RF.num(b.price) + " <small>ر.س</small></span></div>" +
        '<div class="btn-row"><button class="btn primary" data-act="read" data-id="' + b.id + '">' + icon("book") + "قراءة عينة</button>" +
        '<button class="btn" data-act="cart" data-id="' + b.id + '">' + icon("cart") + "للسلة</button>" +
        '<button class="btn heart on" data-act="fav" data-id="' + b.id + '" aria-pressed="true" aria-label="إزالة من المفضلة">' + icon("heart") + "</button></div>";
    } else {
      foot =
        '<div class="price-row"><span class="price">' + RF.num(b.price) + " <small>ر.س</small></span>" + (b.old ? '<span class="old">' + RF.num(b.old) + "</span>" : "") + "</div>" +
        '<div class="btn-row"><button class="btn navy" data-act="read" data-id="' + b.id + '">' + icon("book") + (rd ? "متابعة العينة" : "قراءة عينة") + "</button>" +
        '<button class="btn heart ' + (fav ? "on" : "") + '" data-act="fav" data-id="' + b.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? "إزالة من المفضلة" : "إضافة إلى المفضلة") + '">' + icon("heart") + "</button></div>" +
        '<button class="btn primary block" data-act="cart" data-id="' + b.id + '">' + icon("cart") + "أضف إلى السلة</button>";
    }
    return '<article class="card"><button class="card-cover" data-act="detail" data-id="' + b.id + '" aria-label="تفاصيل ' + esc(b.title) + '">' + (b.tag ? '<span class="tag">' + esc(b.tag) + "</span>" : "") + cover(b) + "</button>" +
      '<h3><button data-act="detail" data-id="' + b.id + '">' + esc(b.title) + "</button></h3>" +
      '<p class="by">' + esc(b.author) + " · " + esc(b.cat) + "</p>" +
      '<div class="rate">' + stars(b.rating) + "<span>" + b.rating + " (" + RF.num(b.votes) + ")</span>" + shelfChip(b.id) + "</div>" +
      '<p class="blurb">' + esc(b.about) + "</p>" +
      '<div class="card-foot">' + foot + "</div></article>";
  }

  /* ---------- store view ---------- */
  function filtered() {
    const q = RF.norm(S.q.trim());
    let list = window.BOOKS.filter((b) => (S.cat === "الكل" || b.cat === S.cat) && (!q || RF.norm(b.title).includes(q) || RF.norm(b.author).includes(q)));
    const by = { sales: (a, b) => b.sales - a.sales, rating: (a, b) => b.rating - a.rating || b.votes - a.votes, new: (a, b) => b.added - a.added };
    return list.sort(by[S.sort]);
  }
  function renderChips() {
    $("#chips").innerHTML = ["الكل"].concat(window.CATEGORIES).map((c) =>
      '<button class="chip ' + (S.cat === c ? "is-active" : "") + '" data-cat="' + esc(c) + '" aria-pressed="' + (S.cat === c) + '">' + esc(c) + "</button>").join("");
  }
  function renderStore() {
    const list = filtered();
    $("#grid").innerHTML = list.map((b) => cardHTML(b, "store")).join("");
    $("#empty").hidden = list.length > 0;
    $("#result-note").textContent = list.length ? "عدد الكتب: " + list.length : "";
  }
  function renderHero() {
    const ids = ["mohat", "atomic", "zikola", "ababeel", "richdad", "money", "uqdak"];   // centre book is on top
    const mid = (ids.length - 1) / 2;
    const st = $("#hero-stack");
    st.innerHTML = ids.map((id, k) => {
      const b = book(id), i = k - mid, a = Math.abs(i);
      const style = "--i:" + i + ";--r:" + (i * 4.5).toFixed(1) + ";--y:" + (i * i * 3).toFixed(1) + ";--d:" + (8 + (mid - a) * 5) + ";--n:" + Math.round(a * 1.5) + ";--z:" + Math.round(10 - a * 2);
      return '<button class="hero-book" data-act="detail" data-id="' + id + '" aria-label="تفاصيل ' + esc(b.title) + '" style="' + style + '"><span class="hero-float">' + cover(b) + "</span></button>";
    }).join("");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    st.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = st.getBoundingClientRect();
      st.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      st.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    });
    st.addEventListener("pointerleave", () => { st.style.setProperty("--px", 0); st.style.setProperty("--py", 0); });
    // touch screens have no hover, so each book lifts in turn
    if (matchMedia("(hover: none)").matches) {
      const books = $$(".hero-book", st);
      let cur = 0;
      setInterval(() => {
        if (document.hidden || $("#view-home").hidden) return;
        books.forEach((el, n) => el.classList.toggle("pop", n === cur));
        cur = (cur + 1) % books.length;
      }, 2200);
    }
  }



  /* ---------- library view ---------- */
  function renderLibrary() {
    $$(".lib-tab").forEach((t) => { const on = t.dataset.lib === S.libTab; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    RF.renderShelfStats();
    const empty = $("#lib-empty");
    if (S.libTab === "orders") {
      const oh = RF.ordersHTML();
      $("#lib-grid").innerHTML = oh || "";
      empty.hidden = !!oh;
      empty.innerHTML = '<p>لا توجد طلبات بعد. أتمم طلباً من السلة وسيظهر هنا.</p><button class="btn primary" data-nav="home">تصفّح المتجر</button>';
      return;
    }
    let ids;
    if (S.libTab === "fav") ids = S.favs;
    else ids = Object.keys(S.shelf).filter((id) => S.shelf[id].st === S.libTab).sort((a, b) => S.shelf[b].at - S.shelf[a].at);
    const list = ids.map(book).filter(Boolean);
    $("#lib-grid").innerHTML = list.map((b) => (S.libTab === "fav" ? cardHTML(b, "fav") : RF.shelfCard(b))).join("");
    empty.hidden = list.length > 0;
    const msg = {
      reading: "لا تقرأ كتاباً الآن. افتح أي كتاب من المتجر واختر «أقرأه الآن» ليظهر هنا مع تقدّمك.",
      want: "قائمتك فارغة. اختر «أريد قراءته» في أي كتاب لتحفظه لوقت لاحق.",
      done: "لم تسجّل كتباً مقروءة بعد. عند إنهاء كتاب اضغط «أكملت الكتاب».",
      fav: "لا توجد كتب في المفضلة. اضغط على القلب في أي كتاب لإضافته."
    };
    empty.innerHTML = "<p>" + msg[S.libTab] + '</p><button class="btn primary" data-nav="home">تصفّح المتجر</button>';
  }

  function show(view) {
    S.view = view;
    $("#view-home").hidden = view !== "home";
    $("#view-library").hidden = view !== "library";
    $("#tab-home").classList.toggle("is-active", view === "home");
    $("#tab-library").classList.toggle("is-active", view === "library");
    if (view === "library") renderLibrary();
    window.scrollTo({ top: 0 });
  }
  RF.show = show;
  RF.rerender = function () {
    refreshBadges();
    if (S.view === "home") renderStore(); else renderLibrary();
    if (!$("#cart-ov").hidden) renderCart();
    if (!$("#detail-ov").hidden && RF.detailId) openDetail(RF.detailId, true);
  };

  /* ---------- actions ---------- */
  function addToCart(id) {
    const l = S.cart.find((x) => x.id === id);
    if (l) l.qty = Math.min(l.qty + 1, 9); else S.cart.push({ id, qty: 1 });
    persist.cart(); refreshBadges();
    toast("أُضيف «" + book(id).title + "» إلى السلة");
    if (!$("#cart-ov").hidden) renderCart();
  }
  function toggleFav(id) {
    const i = S.favs.indexOf(id);
    if (i >= 0) { S.favs.splice(i, 1); toast("أُزيل من المفضلة"); } else { S.favs.push(id); toast("أُضيف «" + book(id).title + "» إلى المفضلة"); }
    persist.favs(); RF.rerender();
  }
  function addToReadingList(id) {
    if (!S.reading[id]) { S.reading[id] = { page: 0, total: 1, at: Date.now() }; persist.reading(); toast("أُضيف إلى قائمة القراءة"); RF.rerender(); }
    else toast("الكتاب موجود في قائمة القراءة");
  }

  /* ---------- detail modal ---------- */
  function openDetail(id, silent) {
    const b = book(id);
    RF.detailId = id;
    const fav = S.favs.includes(id);
    const rd = S.reading[id];
    $("#detail").innerHTML =
      '<button class="icon-btn close" data-act="close-detail" aria-label="إغلاق">' + icon("x") + "</button>" +
      "<div>" + cover(b) + "</div>" +
      "<div><p class=\"by\">" + esc(b.cat) + '</p><h2 id="d-title">' + esc(b.title) + "</h2><p class=\"by\">" + esc(b.author) + "</p>" +
      '<div class="rate" style="margin-top:8px">' + stars(b.rating) + "<span>" + b.rating + " (" + RF.num(b.votes) + " تقييم)</span></div>" +
      '<div class="meta-line">' + metaLine(b) + "</div>" +
      '<p class="about">' + esc(b.about) + "</p>" +
      '<div class="price-row"><span class="price">' + RF.num(b.price) + " <small>ر.س</small></span>" + (b.old ? '<span class="old">' + RF.num(b.old) + "</span>" : "") + "</div>" +
      '<div class="btn-row"><button class="btn navy" data-act="read" data-id="' + id + '">' + icon("book") + (rd ? "متابعة العينة" : "قراءة عينة") + "</button>" +
      '<button class="btn primary" data-act="cart" data-id="' + id + '">' + icon("cart") + "أضف إلى السلة</button>" +
      '<button class="btn" data-act="fav" data-id="' + id + '" aria-pressed="' + fav + '">' + icon("heart") + (fav ? "في المفضلة" : "للمفضلة") + "</button>" +
      "</div>" +
      "<h4>أضفه إلى كتبي</h4>" + RF.shelfControl(id) +
      "<h4>آراء القراء</h4><div class=\"reviews\">" + b.reviews.map((r) => '<div class="review"><b>قارئ</b>' + esc(r) + "</div>").join("") + "</div>" +
      similarHTML(b) +
      '<p class="demo-note">التقييمات والآراء في هذا المتجر التجريبي أمثلة توضيحية وليست مراجعات حقيقية.</p></div>';
    $("#detail-ov").hidden = false;
    if (!silent) { const c = $(".close", $("#detail")); if (c) c.focus(); }
  }
  function metaLine(b) {
    const m = [];
    if (b.pages) m.push(b.pages + " صفحة");
    if (b.year) m.push("سنة النشر: " + b.year + "م");
    if (b.publisher) m.push("الناشر: " + esc(b.publisher));
    if (b.translator) m.push("ترجمة: " + esc(b.translator));
    return m.map((x) => "<span>" + x + "</span>").join("");
  }
  function similarHTML(b) {
    const list = window.BOOKS.filter((x) => x.cat === b.cat && x.id !== b.id).concat(window.BOOKS.filter((x) => x.cat !== b.cat && x.id !== b.id)).slice(0, 4);
    return "<h4>كتب مشابهة</h4><div class=\"similar\">" + list.map((x) => '<button data-act="detail" data-id="' + x.id + '">' + cover(x) + "<span>" + esc(x.title) + "</span></button>").join("") + "</div>";
  }
  function closeDetail() { $("#detail-ov").hidden = true; RF.detailId = null; }
  RF.closeDetail = closeDetail;

  /* ---------- cart ---------- */
  function renderCart() {
    const body = $("#cart-body"), foot = $("#cart-foot");
    if (!S.cart.length) {
      body.innerHTML = '<div class="cart-empty"><p>سلتك فارغة.</p></div>';
      foot.innerHTML = '<button class="btn primary block" data-act="close-cart" data-nav="home">تصفّح الكتب</button>';
      return;
    }
    body.innerHTML = S.cart.map((l) => {
      const b = book(l.id);
      return '<div class="line">' + cover(b) +
        "<div><h4>" + esc(b.title) + '</h4><div class="by">' + esc(b.author) + "</div>" +
        '<div class="qty"><button data-act="dec" data-id="' + l.id + '" aria-label="إنقاص الكمية">−</button><span>' + l.qty + '</span><button data-act="inc" data-id="' + l.id + '" aria-label="زيادة الكمية">+</button></div></div>' +
        '<div class="lp"><span>' + money(b.price * l.qty) + '</span><button class="rm" data-act="rm" data-id="' + l.id + '">حذف</button></div></div>';
    }).join("");
    const t = totals();
    const c = window.COUPONS[S.coupon];
    foot.innerHTML =
      '<form class="coupon" id="coupon-form"><label class="sr" for="coupon-in">كود الخصم</label><input id="coupon-in" placeholder="كود الخصم" value="' + esc(S.coupon) + '" dir="ltr" autocomplete="off"><button class="btn" type="submit">تطبيق</button></form>' +
      '<p class="hint">' + (c ? "تم تطبيق الكود: " + esc(c.label) : "جرّب الكود IQRA10 أو READ25") + "</p>" +
      '<div class="sum-row"><span>المجموع الفرعي</span><span>' + money(t.sub) + "</span></div>" +
      (t.disc ? '<div class="sum-row disc"><span>الخصم</span><span>− ' + money(t.disc) + "</span></div>" : "") +
      '<div class="sum-row"><span>الشحن</span><span>' + (t.ship ? money(t.ship) : "مجاني") + "</span></div>" +
      '<p class="hint">' + (t.ship ? "الشحن مجاني للطلبات من " + FREE_FROM + " ر.س." : "") + "</p>" +
      '<div class="sum-row total"><span>الإجمالي</span><span>' + money(t.total) + "</span></div>" +
      '<button class="btn primary block" data-act="checkout">إتمام الطلب</button>';
  }
  function openCart() { renderCart(); $("#cart-ov").hidden = false; }
  function closeCart() { $("#cart-ov").hidden = true; }

  function applyCoupon(code) {
    const k = code.trim().toUpperCase();
    if (!k) { S.coupon = ""; persist.coupon(); renderCart(); return; }
    if (window.COUPONS[k]) { S.coupon = k; persist.coupon(); renderCart(); toast("تم تطبيق كود الخصم"); }
    else { toast("كود الخصم غير صحيح"); }
  }

  /* ---------- checkout ---------- */
  const coForm = () => $("#co-form");
  function openCheckout() {
    const t = totals();
    $("#co-sum").innerHTML = '<div class="sum-row"><span>عدد الكتب</span><span>' + t.count + "</span></div>" +
      (t.disc ? '<div class="sum-row disc"><span>الخصم</span><span>− ' + money(t.disc) + "</span></div>" : "") +
      '<div class="sum-row total"><span>الإجمالي</span><span>' + money(t.total) + "</span></div>";
    $$(".field").forEach((f) => { f.classList.remove("bad"); $(".err", f).textContent = ""; });
    closeCart();
    $("#co-ov").hidden = false;
    $("#f-name").focus();
  }
  function validate() {
    const f = coForm();
    let ok = true;
    const rules = {
      name: (v) => (v.trim().length >= 3 ? "" : "اكتب الاسم الكامل."),
      phone: (v) => (/^(\+?966|0)?5\d{8}$/.test(v.replace(/[\s-]/g, "")) ? "" : "اكتب رقم جوال صحيحاً مثل 0501234567."),
      city: (v) => (v.trim() ? "" : "اكتب اسم المدينة."),
      district: (v) => (v.trim() ? "" : "اكتب اسم الحي."),
      addr: (v) => (v.trim().length >= 6 ? "" : "اكتب عنواناً أوضح.")
    };
    Object.keys(rules).forEach((k) => {
      const input = f.elements[k], wrap = input.closest(".field");
      const m = rules[k](input.value);
      wrap.classList.toggle("bad", !!m);
      $(".err", wrap).textContent = m;
      if (m) ok = false;
    });
    return ok;
  }
  function submitOrder(e) {
    e.preventDefault();
    if (!validate()) return;
    const t = totals();
    const no = "RF-" + Math.floor(100000 + Math.random() * 900000);
    const name = coForm().elements.name.value.trim();
    const orders = load("orders", []);
    orders.push({ no, at: Date.now(), total: t.total, items: S.cart.map((l) => ({ id: l.id, qty: l.qty })) });
    save("orders", orders);
    S.cart = []; S.coupon = ""; persist.cart(); persist.coupon();
    $(".checkout").innerHTML =
      '<div class="done-box"><div class="okc">' + icon("check") + "</div><h2>تم استلام طلبك التجريبي</h2>" +
      "<p>شكراً " + esc(name) + ". رقم الطلب: <b dir=\"ltr\">" + no + "</b></p>" +
      '<p class="fine">لم يتم أي دفع أو شحن فعلي، فهذا متجر تجريبي.</p>' +
      '<button class="btn primary" data-act="co-done">متابعة التصفّح</button></div>';
    toast("تم تأكيد الطلب بنجاح");
    refreshBadges();
  }
  function closeCheckout(rebuild) {
    $("#co-ov").hidden = true;
    if (rebuild) rebuildCheckoutShell();
  }
  const shell = () => $(".checkout").outerHTML;
  let shellHTML = null;
  function rebuildCheckoutShell() {
    const m = $(".checkout");
    if (shellHTML && !$("#co-form")) {
      const tmp = document.createElement("div");
      tmp.innerHTML = shellHTML;
      m.replaceWith(tmp.firstElementChild);
      bindCheckout();
    }
  }
  function bindCheckout() {
    $("#co-close").addEventListener("click", () => closeCheckout(false));
    coForm().addEventListener("submit", submitOrder);
  }

  /* ---------- wiring ---------- */
  RF.initShop = function () {
    initTheme();
    renderHero();
    renderChips();
    $("#search-ico").innerHTML = icon("search");
    $("#cart-close").innerHTML = icon("x");
    $("#co-close").innerHTML = icon("x");
    shellHTML = shell();
    bindCheckout();
    refreshBadges();
    renderStore();

    let timer;
    $("#search").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => { S.q = e.target.value; renderStore(); }, 120); });
    $("#sort").addEventListener("change", (e) => { S.sort = e.target.value; renderStore(); });
    $("#reset-filters").addEventListener("click", () => { S.q = ""; S.cat = "الكل"; $("#search").value = ""; renderChips(); renderStore(); });
    $("#chips").addEventListener("click", (e) => { const c = e.target.closest("[data-cat]"); if (!c) return; S.cat = c.dataset.cat; renderChips(); renderStore(); });
    $("#lib-tabs").addEventListener("click", (e) => { const t = e.target.closest("[data-lib]"); if (!t) return; S.libTab = t.dataset.lib; renderLibrary(); });
    $("#cart-btn").addEventListener("click", openCart);
    $("#cart-close").addEventListener("click", closeCart);
    $("#cart-ov").addEventListener("click", (e) => { if (e.target.id === "cart-ov") closeCart(); });
    $("#detail-ov").addEventListener("click", (e) => { if (e.target.id === "detail-ov") closeDetail(); });
    $("#co-ov").addEventListener("click", (e) => { if (e.target.id === "co-ov") closeCheckout(!$("#co-form")); });
    $("#cart-foot").addEventListener("submit", (e) => { if (e.target.id === "coupon-form") { e.preventDefault(); applyCoupon($("#coupon-in").value); } });

    document.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav && !nav.dataset.act) { e.preventDefault(); if (nav.dataset.libgo) S.libTab = nav.dataset.libgo; show(nav.dataset.nav); return; }
      const el = e.target.closest("[data-act]");
      if (!el) return;
      const id = el.dataset.id, act = el.dataset.act;
      if (act === "detail") openDetail(id);
      else if (act === "close-detail") closeDetail();
      else if (act === "read") { closeDetail(); RF.openReader(id); }
      else if (act === "cart") addToCart(id);
      else if (act === "fav") toggleFav(id);
      else if (act === "inc") { S.cart.find((l) => l.id === id).qty = Math.min(9, S.cart.find((l) => l.id === id).qty + 1); persist.cart(); refreshBadges(); renderCart(); }
      else if (act === "dec") { const l = S.cart.find((x) => x.id === id); l.qty -= 1; if (l.qty <= 0) S.cart = S.cart.filter((x) => x.id !== id); persist.cart(); refreshBadges(); renderCart(); }
      else if (act === "rm") { S.cart = S.cart.filter((x) => x.id !== id); persist.cart(); refreshBadges(); renderCart(); }
      else if (act === "checkout") openCheckout();
      else if (act === "close-cart") { closeCart(); if (nav) show(nav.dataset.nav); }
      else if (act === "co-done") { closeCheckout(true); show("home"); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#reader").hidden) return;
      if (!$("#co-ov").hidden) closeCheckout(!$("#co-form"));
      else if (!$("#cart-ov").hidden) closeCart();
      else if (!$("#detail-ov").hidden) closeDetail();
    });
  };
})();
