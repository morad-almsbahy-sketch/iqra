/* "كتبي": the reader's personal shelf. Status per book (want / reading / done), progress, rating and a yearly goal. */
(function () {
  const { $, $$, esc, icon, toast, book, cover, stars, load, save } = RF;
  const S = RF.state;
  const ST = (RF.ST = { want: "أريد قراءته", reading: "أقرأه الآن", done: "قرأته" });
  const fmtDate = (ts) => new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "long" }).format(new Date(ts));
  const persist = () => save("shelf", S.shelf);
  const pageText = (b, pct) => (b.pages ? " · صفحة " + RF.num(Math.round((pct / 100) * b.pages)) + " من " + RF.num(b.pages) : "");

  /* ---------- state changes ---------- */
  RF.shelfSet = function (id, st, silent) {
    const e = S.shelf[id] || {};
    const now = Date.now();
    e.st = st; e.at = now;
    if (st === "reading") { if (e.pct == null || e.pct >= 100) e.pct = 0; e.started = e.started || now; delete e.finished; }
    else if (st === "want") { e.pct = 0; delete e.finished; }
    else if (st === "done") { e.pct = 100; e.finished = now; e.started = e.started || now; }
    S.shelf[id] = e;
    persist();
    if (!silent) toast("«" + book(id).title + "»: " + ST[st]);
    RF.rerender();
  };
  function remove(id) {
    delete S.shelf[id];
    persist();
    toast("أُزيل من كتبي");
    RF.rerender();
  }

  /* ---------- views ---------- */
  RF.shelfControl = function (id) {
    const cur = (S.shelf[id] || {}).st;
    return '<div class="seg" role="group" aria-label="حالة الكتاب في كتبي">' +
      ["want", "reading", "done"].map((k) => '<button class="seg-b ' + (cur === k ? "on" : "") + '" data-act="shelf-set" data-st="' + k + '" data-id="' + id + '" aria-pressed="' + (cur === k) + '">' + ST[k] + "</button>").join("") +
      (cur ? '<button class="seg-b rm" data-act="shelf-remove" data-id="' + id + '">إزالة</button>' : "") + "</div>";
  };

  RF.shelfCard = function (b) {
    const e = S.shelf[b.id];
    const head =
      '<article class="card"><button class="card-cover" data-act="detail" data-id="' + b.id + '" aria-label="تفاصيل ' + esc(b.title) + '">' + cover(b) + "</button>" +
      '<h3><button data-act="detail" data-id="' + b.id + '">' + esc(b.title) + "</button></h3>" +
      '<p class="by">' + esc(b.author) + "</p>";
    let body;
    if (e.st === "reading") {
      body =
        '<div class="prog" data-pages="' + (b.pages || 0) + '"><div class="prog-label"><span>تقدّمي</span><span class="prog-val">' + e.pct + "%" + pageText(b, e.pct) + '</span></div>' +
        '<div class="progress"><i style="width:' + e.pct + '%"></i></div>' +
        '<input class="pr-range" type="range" min="0" max="100" step="1" value="' + e.pct + '" data-id="' + b.id + '" aria-label="تقدّمي في ' + esc(b.title) + '"></div>' +
        (e.started ? '<p class="hint">بدأت في ' + fmtDate(e.started) + "</p>" : "") +
        '<div class="card-foot"><button class="btn primary block" data-act="shelf-done" data-id="' + b.id + '">' + icon("check") + "أكملت الكتاب</button>" +
        '<div class="btn-row"><button class="btn" data-act="read" data-id="' + b.id + '">' + icon("book") + "العينة</button>" +
        '<button class="btn ghost" data-act="shelf-remove" data-id="' + b.id + '">إزالة</button></div></div>';
    } else if (e.st === "want") {
      body =
        '<div class="card-foot"><button class="btn primary block" data-act="shelf-start" data-id="' + b.id + '">ابدأ القراءة</button>' +
        '<div class="btn-row"><button class="btn" data-act="read" data-id="' + b.id + '">' + icon("book") + "عينة</button>" +
        '<button class="btn" data-act="cart" data-id="' + b.id + '">' + icon("cart") + "للسلة</button>" +
        '<button class="btn ghost" data-act="shelf-remove" data-id="' + b.id + '">إزالة</button></div></div>';
    } else {
      const r = e.rate || 0;
      body =
        '<p class="hint">أنهيته في ' + fmtDate(e.finished || e.at) + "</p>" +
        '<div class="rate-set" role="group" aria-label="تقييمك للكتاب"><span>تقييمك</span>' +
        [1, 2, 3, 4, 5].map((v) => '<button data-act="rate" data-id="' + b.id + '" data-v="' + v + '" aria-label="' + v + ' من 5" aria-pressed="' + (r === v) + '" class="' + (v <= r ? "on" : "") + '"><svg viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg></button>').join("") + "</div>" +
        '<div class="card-foot"><div class="btn-row"><button class="btn" data-act="shelf-start" data-id="' + b.id + '">قراءة ثانية</button>' +
        '<button class="btn" data-act="read" data-id="' + b.id + '">' + icon("book") + "عينة</button>" +
        '<button class="btn ghost" data-act="shelf-remove" data-id="' + b.id + '">إزالة</button></div></div>';
    }
    return head + body + "</article>";
  };

  RF.renderShelfStats = function () {
    const box = $("#shelf-stats");
    if (!box) return;
    const entries = Object.values(S.shelf);
    const n = (st) => entries.filter((v) => v.st === st).length;
    const year = new Date().getFullYear();
    const thisYear = entries.filter((v) => v.st === "done" && new Date(v.finished || v.at).getFullYear() === year).length;
    const goal = load("goal", 12);
    const pct = Math.min(100, Math.round((thisYear / goal) * 100));
    box.innerHTML =
      '<div class="stat-row"><div class="stat-c"><b>' + n("reading") + "</b><span>أقرأها الآن</span></div>" +
      '<div class="stat-c"><b>' + n("want") + "</b><span>أريد قراءتها</span></div>" +
      '<div class="stat-c"><b>' + n("done") + "</b><span>قرأتها</span></div></div>" +
      '<div class="goal"><div class="goal-top"><label for="goal-in">هدفي لهذا العام</label>' +
      '<span><input id="goal-in" type="number" min="1" max="365" inputmode="numeric" value="' + goal + '"> كتاب</span></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + thisYear + '"><i style="width:' + pct + '%"></i></div>' +
      '<p class="hint">' + (thisYear >= goal ? "حققت هدفك لهذا العام. " : "") + "قرأت " + thisYear + " من " + goal + " في " + year + "</p></div>";
  };

  /* ---------- wiring ---------- */
  RF.initShelf = function () {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-act]");
      if (!el) return;
      const act = el.dataset.act, id = el.dataset.id;
      if (act === "shelf-set") RF.shelfSet(id, el.dataset.st);
      else if (act === "shelf-remove") remove(id);
      else if (act === "shelf-start") RF.shelfSet(id, "reading");
      else if (act === "shelf-done") RF.shelfSet(id, "done");
      else if (act === "rate") {
        const en = S.shelf[id];
        if (!en) return;
        const v = Number(el.dataset.v);
        en.rate = en.rate === v ? 0 : v;
        persist();
        RF.rerender();
      }
    });

    // live progress while dragging, saved when released
    document.addEventListener("input", (e) => {
      const r = e.target.closest && e.target.closest(".pr-range");
      if (!r) return;
      const card = r.closest(".prog"), b = book(r.dataset.id), v = Number(r.value);
      $(".progress i", card).style.width = v + "%";
      $(".prog-val", card).textContent = v + "%" + pageText(b, v);
    });
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t.classList && t.classList.contains("pr-range")) {
        const id = t.dataset.id, v = Number(t.value);
        if (!S.shelf[id]) return;
        if (v >= 100) { RF.shelfSet(id, "done", true); toast("أحسنت! أنهيت «" + book(id).title + "»"); return; }
        S.shelf[id].pct = v; S.shelf[id].at = Date.now();
        persist();
      } else if (t.id === "goal-in") {
        const g = Math.max(1, Math.min(365, parseInt(t.value, 10) || 12));
        save("goal", g);
        RF.renderShelfStats();
        toast("حُفظ هدفك: " + g + " كتاب");
      }
    });
  };
})();
