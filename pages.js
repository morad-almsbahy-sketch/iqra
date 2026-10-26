/* Info pages (about, FAQ, shipping and returns, contact) and the "my orders" list. */
(function () {
  const { $, $$, esc, icon, money, toast, book, cover } = RF;

  const FREE_FROM = 150, SHIPPING = 18;

  const PAGES = {
    about: {
      title: "قصة إقرأ",
      html: () =>
        '<p>أول كلمة نزلت في القرآن الكريم كانت «اقرأ». ومن هذه الكلمة جاء اسم إقرأ.</p>' +
        '<p>بدأت الفكرة من موقف يعرفه كل قارئ: كتاب أعجبك غلافه وعنوانه، فاشتريته وأنت لا تعرف إن كان سيشدّك من أول فصل. وكتب كثيرة بدأناها ثم نسينا أين وصلنا فيها، وكتب اشتريناها وبقيت على الرف.</p>' +
        '<p>لذلك بنينا إقرأ على ثلاثة أشياء: عينة تقرؤها قبل أن تقرر، وصفحات تُقلب كأنها بين يديك، ورفّ شخصي اسمه «كتبي» يحفظ ما تقرؤه الآن وما تنتظر أن تقرأه وما أنهيته.</p>' +
        '<p>وشعارنا ألف تخرج من كتاب مفتوح، لأن القراءة تبدأ بحرف واحد.</p>' +
        '<div class="stat"><div><b>' + window.BOOKS.length + '</b><span>كتاباً في الكتالوج</span></div><div><b>' + window.CATEGORIES.length + '</b><span>تصنيفات</span></div><div><b>عينة</b><span>لكل كتاب</span></div></div>' +
        "<h3>ما نقدمه</h3><ul><li>قارئ بصفحات تُقلب، بثلاثة ألوان للورق وإشارات مرجعية.</li><li>«كتبي»: تتبّع ما تقرؤه وما قرأته وما تريد قراءته، مع هدف سنوي.</li><li>سلة وطلب بسيطان، مع كوبونات خصم.</li></ul>" +
        '<p class="draft">كتبتُ هذه القصة من فكرة الموقع واسمه. إن كانت لك قصة شخصية مع المتجر أرسلها وأضيفها.</p>'
    },
    faq: {
      title: "الأسئلة الشائعة",
      html: () => {
        const q = [
          ["هل أستطيع قراءة الكتاب قبل شرائه؟", "نعم. زر «قراءة عينة» يفتح القارئ لكل كتاب. العينات في هذا المتجر التجريبي نصوص تعريفية قصيرة وليست الكتاب الكامل."],
          ["أين يُحفظ تقدّمي في القراءة؟", "على جهازك فقط، في متصفحك. إذا مسحت بيانات المتصفح أو غيّرت الجهاز فلن يظهر تقدّمك."],
          ["كيف أستخدم كود الخصم؟", "أضف الكتب إلى السلة، ثم اكتب الكود في خانة «كود الخصم» واضغط «تطبيق». جرّب IQRA10 أو READ25."],
          ["هل الدفع حقيقي؟", "لا. هذا متجر تجريبي، ولا يُسجَّل أي دفع ولا يُشحن أي كتاب."],
          ["كيف أتتبّع قراءتي؟", "افتح الكتاب واختر من «أضفه إلى كتبي» أحد الخيارات: أريد قراءته، أقرأه الآن، قرأته. ثم حدّث تقدّمك من صفحة «كتبي» بتحريك الشريط، وسجّل تقييمك بعد أن تنهي الكتاب."]
        ];
        return q.map((x) => "<details><summary>" + esc(x[0]) + "</summary><p>" + esc(x[1]) + "</p></details>").join("");
      }
    },
    policy: {
      title: "الشحن والإرجاع",
      html: () =>
        "<h3>الشحن</h3><ul><li>رسوم الشحن " + SHIPPING + " ر.س للطلب الواحد.</li><li>الشحن مجاني للطلبات من " + FREE_FROM + " ر.س بعد الخصم.</li></ul>" +
        "<h3>الإرجاع والاستبدال</h3><ul><li>يمكن إرجاع الكتاب خلال 7 أيام من الاستلام بحالته الأصلية.</li><li>الكتب التالفة أو الخاطئة تُستبدل دون رسوم.</li></ul>" +
        '<p class="draft">مدة الإرجاع ومناطق التوصيل وأسعار الشحن أمثلة. أرسل لي سياستك الفعلية وأحدّثها.</p>'
    },
    contact: {
      title: "تواصل معنا",
      html: () =>
        '<p>للتواصل المباشر اتصل على الجوال:</p>' +
        '<p class="phone-line"><a href="tel:+966564146686" dir="ltr">0564146686</a> <button class="btn small" type="button" data-copy="0564146686">نسخ الرقم</button></p>' +
        '<p>أو اكتب رسالتك هنا. في هذا المتجر التجريبي لا تُرسل الرسالة إلى أي جهة.</p>' +
        '<form class="contact-form" id="contact-form" novalidate>' +
        '<div class="field"><label for="c-name">الاسم</label><input id="c-name" name="name" autocomplete="name"></div>' +
        '<div class="field"><label for="c-msg">رسالتك</label><textarea id="c-msg" name="msg"></textarea><small class="err" id="c-err"></small></div>' +
        '<button class="btn primary" type="submit">إرسال</button></form>' +
        '<p class="draft">البريد الإلكتروني وساعات العمل تُضاف هنا عند الإطلاق.</p>'
    }
  };

  let lastFocus = null;
  function openInfo(key) {
    const p = PAGES[key];
    if (!p) return;
    lastFocus = document.activeElement;
    $("#info-h").textContent = p.title;
    $("#info-body").innerHTML = p.html();
    $("#info-ov").hidden = false;
    $("#info-close").focus();
    const f = $("#contact-form");
    if (f) f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (f.elements.msg.value.trim().length < 5) { $("#c-err").textContent = "اكتب رسالة من خمسة أحرف على الأقل."; return; }
      closeInfo();
      toast("تم تسجيل رسالتك (تجريبي)");
    });
  }
  function closeInfo() {
    $("#info-ov").hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- orders ---------- */
  const STAGES = ["قيد التجهيز", "تم الشحن", "تم التسليم"];
  function stageOf(o) {
    const min = (Date.now() - o.at) / 60000;   // demo timeline: minutes, not days
    return min < 2 ? 0 : min < 5 ? 1 : 2;
  }
  RF.ordersHTML = function () {
    const orders = RF.load("orders", []).slice().reverse();
    if (!orders.length) return null;
    const dt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short" });
    return '<div class="orders">' + orders.map((o) => {
      const s = stageOf(o);
      return '<article class="order"><div class="order-top"><div><b dir="ltr">' + esc(o.no) + '</b><div class="by">' + dt.format(new Date(o.at)) + "</div></div>" +
        '<div><span class="status ' + (s === 2 ? "ok" : "") + '">' + STAGES[s] + "</span></div></div>" +
        '<div class="steps" aria-hidden="true">' + STAGES.map((_, i) => '<i class="' + (i <= s ? "on" : "") + '"></i>').join("") + "</div>" +
        '<div class="steps-l" aria-hidden="true">' + STAGES.map((t) => "<span>" + t + "</span>").join("") + "</div>" +
        '<div class="order-items">' + o.items.map((it) => { const b = book(it.id); return b ? cover(b) : ""; }).join("") + "</div>" +
        '<div class="sum-row total"><span>الإجمالي</span><span>' + money(o.total) + "</span></div>" +
        '<p class="hint">حالة الطلب تتغيّر خلال دقائق لأغراض العرض التجريبي فقط.</p></article>';
    }).join("") + "</div>";
  };

  RF.initPages = function () {
    $("#info-close").innerHTML = icon("x");
    $("#info-close").addEventListener("click", closeInfo);
    $("#info-ov").addEventListener("click", (e) => { if (e.target.id === "info-ov") closeInfo(); });
    document.addEventListener("click", (e) => {
      const c = e.target.closest("[data-copy]");
      if (!c) return;
      const done = () => toast("تم نسخ الرقم");
      try { navigator.clipboard.writeText(c.dataset.copy).then(done, () => toast("انسخ الرقم يدوياً: " + c.dataset.copy)); }
      catch (err) { toast("انسخ الرقم يدوياً: " + c.dataset.copy); }
    });
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-info]");
      if (!a) return;
      e.preventDefault();
      openInfo(a.dataset.info);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#info-ov").hidden) { e.stopPropagation(); closeInfo(); }
    }, true);
  };
})();
