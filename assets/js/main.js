/* Obuntu — interactions. Vanilla, no dependencies. Everything degrades gracefully without JS. */
(function () {
  "use strict";

  var WA_NUMBER = "256757803307";
  var EMAIL = "info@obuntubedsidenursing.com";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };

  /* ---------- Nav: scrolled state ---------- */
  var nav = $("[data-nav]");
  function onScrollNav() { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8); }

  /* ---------- Mobile menu ---------- */
  var burger = $(".burger");
  var menu = $("#menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    if (open) menu.removeAttribute("inert"); else menu.setAttribute("inert", "");
    document.body.classList.toggle("is-locked", open);
    if (open) { var first = $("a", menu); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60); }
    else { burger.focus({ preventScroll: true }); }
  }
  if (burger && menu) {
    menu.setAttribute("inert", "");
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { document.body.classList.remove("is-locked"); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false); });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches && menu.classList.contains("is-open")) setMenu(false); });
  }

  /* ---------- Reveal on scroll (stagger within a group) ---------- */
  $$("[data-stagger]").forEach(function (group) {
    $$("[data-reveal]", group).forEach(function (el, i) { el.style.setProperty("--d", i); });
  });
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("is-in"); io.unobserve(el);
        // once played, hand the element back to its own hover/press transitions
        var d = parseFloat(el.style.getPropertyValue("--d")) || 0;
        setTimeout(function () { el.removeAttribute("data-reveal"); el.classList.remove("is-in"); el.style.removeProperty("--d"); }, 760 + d * 70);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Statement: words light up with scroll ---------- */
  var statement = $("[data-statement]");
  var words = [];
  var lit = -1;
  if (statement) {
    var raw = statement.textContent.trim().replace(/\s+/g, " ").split(" ");
    statement.setAttribute("aria-label", raw.join(" "));
    statement.innerHTML = raw.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    words = $$(".w", statement);
  }
  function updateStatement() {
    if (!words.length) return;
    if (reduceMotion) { if (lit !== words.length) { words.forEach(function (w) { w.classList.add("is-lit"); }); lit = words.length; } return; }
    var r = statement.getBoundingClientRect(), vh = window.innerHeight;
    var p = clamp((0.85 * vh - r.top) / (0.25 * vh + r.height), 0, 1);
    var n = Math.round(p * words.length);
    if (n === lit) return;
    lit = n;
    words.forEach(function (w, i) { w.classList.toggle("is-lit", i < n); });
  }

  /* ---------- Hero: glass-chip pointer spring ---------- */
  var chips = $$("[data-chip]");
  if (chips.length && finePointer && !reduceMotion) {
    var hero = $(".hero"), tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var tick = function () {
      cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
      chips.forEach(function (c, i) {
        var k = i % 2 ? -1 : 1;
        c.style.transform = "translate3d(" + (cx * 14 * k).toFixed(2) + "px," + (cy * 10 * k).toFixed(2) + "px,0)";
      });
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(tick) : 0;
    };
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  /* ---------- Hero photo slideshow: the active progress bar's CSS animation drives the timing, so pausing is pure CSS ---------- */
  var heroCard = $(".hero-card");
  var slides = heroCard ? $$(".slide", heroCard) : [];
  if (slides.length > 1) {
    var dots = $$(".hero-dot", heroCard), cur = 0;
    // The other photos are lazy in the HTML so they don't compete with the first one; once the page is loaded, fetch them
    // ourselves rather than waiting on the browser's lazy-load heuristics, so the show can't stall on an unloaded slide.
    var preload = function () { slides.forEach(function (s) { s.loading = "eager"; }); };
    if (document.readyState === "complete") preload(); else window.addEventListener("load", preload);
    var show = function (i) {
      i = (i + slides.length) % slides.length;
      if (i === cur) return;
      var next = slides[i];
      var go = function () {
        slides[cur].classList.remove("is-active"); slides[cur].setAttribute("aria-hidden", "true");
        next.classList.add("is-active"); next.removeAttribute("aria-hidden");
        cur = i;
        dots.forEach(function (d, k) {
          d.classList.toggle("is-active", k === i); d.classList.toggle("is-done", k < i);
          if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
        });
      };
      if (next.complete) go(); else next.addEventListener("load", go, { once: true }); // lazy photo not in yet: wait for it
    };
    heroCard.addEventListener("animationend", function (e) { if (e.animationName === "heroFill") show(cur + 1); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); }); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { heroCard.classList.toggle("is-paused", !en[0].isIntersecting); }, { threshold: 0.25 }).observe(heroCard);
    }
    var sx = 0, sy = 0, sid = -1; // swipe on touch
    heroCard.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { sx = e.clientX; sy = e.clientY; sid = e.pointerId; } });
    heroCard.addEventListener("pointerup", function (e) {
      if (e.pointerId !== sid) return;
      sid = -1;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- Process timeline: progress line + active steps ---------- */
  var timeline = $("[data-timeline]");
  var fill = timeline && $(".timeline-fill", timeline);
  var tsteps = timeline ? $$(".tstep", timeline) : [];
  function updateTimeline() {
    if (!timeline) return;
    var r = timeline.getBoundingClientRect(), vh = window.innerHeight, mid = vh * 0.55;
    var p = clamp((mid - r.top) / r.height, 0, 1);
    if (fill) fill.style.transform = "scaleY(" + p.toFixed(4) + ")";
    tsteps.forEach(function (s) {
      var sr = s.getBoundingClientRect();
      s.classList.toggle("is-active", sr.top + 24 < mid);
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq-item").forEach(function (item) {
    var btn = $(".faq-q", item);
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Floating contact buttons: always on, except they step aside once the footer is in view ---------- */
  var fab = $("[data-fab]"), footerEl = $(".footer");
  if (fab && footerEl && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { fab.classList.toggle("is-hidden", en[0].isIntersecting); }).observe(footerEl);
  }

  /* ---------- Footer "Back to top": scroll up without leaving #top in the URL ---------- */
  var toTop = $(".to-top");
  if (toTop) toTop.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (e.detail === 0) { var skip = $(".skip"); if (skip) skip.focus({ preventScroll: true }); } // keyboard users land at the top of the page
  });

  /* ---------- Scroll loop (single rAF-throttled handler) ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScrollNav(); updateStatement(); updateTimeline(); ticking = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);

  /* ---------- Contact form: validate inline, hand off to WhatsApp (or email) ---------- */
  var form = $("[data-contact-form]");
  if (form) {
    var nameEl = $("#name", form), contactEl = $("#contact", form), aboutEl = $("#about", form);
    var okBox = $("[data-form-ok]"), okLink = $("[data-ok-link]");
    var emailLink = $("[data-email-link]", form);

    var validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    var validPhone = function (v) { return v.replace(/\D/g, "").length >= 9; };
    var setErr = function (el, msg) {
      var f = el.closest(".field"); if (!f) return;
      f.classList.toggle("has-error", !!msg);
      var e = $(".err", f); if (e) e.textContent = msg || "";
      el.setAttribute("aria-invalid", msg ? "true" : "false");
    };
    var checkName = function () { var ok = nameEl.value.trim().length > 1; setErr(nameEl, ok ? "" : "Please tell us your name."); return ok; };
    var checkContact = function () {
      var v = contactEl.value.trim(), ok = validEmail(v) || validPhone(v);
      setErr(contactEl, ok ? "" : "Enter a phone / WhatsApp number or an email so we can reach you."); return ok;
    };
    nameEl.addEventListener("blur", checkName);
    contactEl.addEventListener("blur", checkContact);
    [nameEl, contactEl].forEach(function (el) { el.addEventListener("input", function () { if (el.closest(".field").classList.contains("has-error")) (el === nameEl ? checkName : checkContact)(); }); });

    var compose = function () {
      var care = form.elements["care"] ? form.elements["care"].value : "";
      var lines = ["Hello Obuntu Bedside Services,", "My name is " + nameEl.value.trim() + "."];
      if (care) lines.push("I would like to ask about: " + care + ".");
      if (aboutEl.value.trim()) lines.push("About the patient: " + aboutEl.value.trim());
      lines.push("You can reach me on: " + contactEl.value.trim());
      return lines.join("\n");
    };
    if (emailLink) emailLink.addEventListener("click", function (e) {
      if (!(checkName() & checkContact())) { e.preventDefault(); return; }
      emailLink.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Care enquiry — " + nameEl.value.trim()) + "&body=" + encodeURIComponent(compose());
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var a = checkName(), b = checkContact();
      if (!(a && b)) { (a ? contactEl : nameEl).focus(); return; }
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(compose());
      if (okLink) okLink.href = url;
      form.hidden = true; if (okBox) { okBox.classList.add("is-visible"); okBox.focus(); }
      window.open(url, "_blank", "noopener");
    });
  }
})();
