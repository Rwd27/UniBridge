/* UniBridge v3. Original vanilla JS: loader, reveal system, parallax, tilt, tabs, rail, accordion, lightbox, forms. */
(function () {
  "use strict";
  var d = document, w = window;
  var reduce = w.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = w.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var visible = function (el) { return el.getClientRects().length > 0; };

  /* Loader */
  var loader = $(".loader");
  var hideLoader = function () { if (loader) setTimeout(function () { loader.classList.add("done"); }, reduce ? 0 : 650); };
  if (d.readyState === "complete") hideLoader(); else w.addEventListener("load", hideLoader);

  /* Mobile menu + header state */
  var burger = $(".burger"), links = $("#primary-nav"), nav = $(".nav");
  if (burger && links) {
    var setOpen = function (o) { links.classList.toggle("open", o); burger.setAttribute("aria-expanded", o ? "true" : "false"); burger.setAttribute("aria-label", o ? "Close menu" : "Open menu"); };
    burger.addEventListener("click", function () { setOpen(burger.getAttribute("aria-expanded") !== "true"); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  }
  var bar = $(".progress");

  /* Reveal on scroll */
  var stag = $$("[data-stagger]");
  stag.forEach(function (box) {
    var step = parseInt(box.getAttribute("data-stagger"), 10) || 90;
    Array.prototype.forEach.call(box.children, function (c, i) { if (!c.hasAttribute("data-a")) c.setAttribute("data-a", "up"); c.style.setProperty("--d", (i * step) + "ms"); });
  });
  $$("[data-d]").forEach(function (e) { e.style.setProperty("--d", e.getAttribute("data-d") + "ms"); });
  var targets = $$("[data-a], .hl, .ov, .scribble, .draw");
  if (reduce || !("IntersectionObserver" in w)) {
    targets.forEach(function (t) { t.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* Scroll-linked effects */
  var plx = $$("[data-speed]"), slides = $$("[data-slide]"), cols = $$(".gcol");
  var ticking = false;
  var update = function () {
    ticking = false;
    var vh = w.innerHeight, y = w.scrollY, h = d.documentElement.scrollHeight - vh;
    if (nav) nav.classList.toggle("is-scrolled", y > 10);
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? clamp(y / h, 0, 1) : 0).toFixed(4) + ")";
    if (reduce) return;
    plx.forEach(function (el) {
      if (!visible(el)) return;
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = "translate3d(0," + (-p * (parseFloat(el.getAttribute("data-speed")) || 0) * 100).toFixed(1) + "px,0)";
    });
    slides.forEach(function (el) {
      if (!visible(el)) return;
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh, dir = parseFloat(el.getAttribute("data-slide")) || 1;
      el.style.transform = "translate3d(" + (p * dir * 360).toFixed(1) + "px,0,0)";
    });
    cols.forEach(function (el, i) {
      if (!visible(el)) return;
      var r = el.getBoundingClientRect(); if (r.bottom < -300 || r.top > vh + 300) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = "translate3d(0," + (-p * (i % 2 ? 70 : 34)).toFixed(1) + "px,0)";
    });
  };
  var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  w.addEventListener("scroll", req, { passive: true }); w.addEventListener("resize", req); update();

  /* Hero slides */
  $$(".slides").forEach(function (box) {
    var items = $$(".photo", box), dots = $$(".dots-nav button", box.parentElement), i = 0, timer;
    if (items.length < 2) { if (items[0]) items[0].classList.add("on"); return; }
    var show = function (n) { i = (n + items.length) % items.length; items.forEach(function (e, k) { e.classList.toggle("on", k === i); }); dots.forEach(function (e, k) { e.classList.toggle("on", k === i); }); };
    dots.forEach(function (b, k) { b.addEventListener("click", function () { show(k); restart(); }); });
    var restart = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { show(i + 1); }, 4800); };
    show(0); restart();
  });

  /* Hero mouse parallax and tilt */
  if (fine && !reduce) {
    $$("[data-depth-root]").forEach(function (root) {
      var kids = $$("[data-depth]", root);
      root.addEventListener("pointermove", function (e) {
        var r = root.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
        kids.forEach(function (k) { var dp = parseFloat(k.getAttribute("data-depth")); k.style.translate = (x * dp).toFixed(1) + "px " + (yy * dp).toFixed(1) + "px"; });
      });
      root.addEventListener("pointerleave", function () { kids.forEach(function (k) { k.style.translate = ""; }); });
    });
    $$(".svc, .tilt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg) translateY(-6px)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
    $$(".mag").forEach(function (b) {
      b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px " + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px"; });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }

  /* Tabs */
  var placeInd = function (box) {
    var ind = $(".ind", box), sel = $('[aria-selected="true"]', box);
    if (!ind || !sel || !visible(box)) return;
    ind.style.width = sel.offsetWidth + "px"; ind.style.transform = "translateX(" + sel.offsetLeft + "px)";
  };
  $$(".tabs3").forEach(function (box) {
    var tabs = $$("button[role=tab]", box), scope = box.closest("[data-tabs]") || d;
    var pick = function (t) {
      tabs.forEach(function (b) { var on = b === t; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
      $$(".tabpanel", scope).forEach(function (p) { p.classList.toggle("on", p.id === t.getAttribute("aria-controls")); });
      placeInd(box);
    };
    tabs.forEach(function (b) { b.addEventListener("click", function () { pick(b); }); });
    box.addEventListener("keydown", function (e) {
      var k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!k) return;
      var i = tabs.indexOf(d.activeElement); if (i < 0) return; var n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); pick(n);
    });
    w.addEventListener("resize", function () { placeInd(box); }); setTimeout(function () { placeInd(box); }, 300); w.addEventListener("load", function () { placeInd(box); });
    box._place = function () { placeInd(box); };
  });
  w.addEventListener("ub:page", function () { $$(".tabs3").forEach(function (b) { if (b._place) b._place(); }); req(); });

  /* Draggable rail */
  $$(".rail-wrap").forEach(function (wrap) {
    var rail = $(".rail3", wrap), down = false, sx = 0, sl = 0, moved = false;
    if (!rail) return;
    rail.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    w.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; rail.classList.add("drag"); } rail.scrollLeft = sl - dx; });
    w.addEventListener("pointerup", function () { down = false; rail.classList.remove("drag"); });
    rail.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    $$("[data-rail]", wrap.parentElement).forEach(function (b) { b.addEventListener("click", function () { rail.scrollBy({ left: parseInt(b.getAttribute("data-rail"), 10) * 360, behavior: reduce ? "auto" : "smooth" }); }); });
  });

  /* Accordion */
  $$(".acc-item").forEach(function (it) {
    var q = $(".acc-q", it);
    q.addEventListener("click", function () {
      var open = !it.classList.contains("open");
      $$(".acc-item", it.parentElement).forEach(function (o) { o.classList.remove("open"); $(".acc-q", o).setAttribute("aria-expanded", "false"); });
      if (open) { it.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
    });
  });

  /* Lightbox */
  var lb = $(".lightbox");
  if (lb) {
    var lbi = $("img", lb), lbp = $("p", lb);
    var close = function () { lb.classList.remove("on"); };
    $$(".gitem").forEach(function (g) {
      g.addEventListener("click", function () { var im = $("img", g); if (!im) return; lbi.src = im.src.replace(/w=\d+/, "w=1800"); lbi.alt = im.alt; lbp.textContent = g.getAttribute("data-cap") || ""; lb.classList.add("on"); });
    });
    lb.addEventListener("click", function (e) { if (e.target !== lbi) close(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* Toast */
  var toast = $(".toast");
  if (toast) {
    var seen = false; try { seen = sessionStorage.getItem("ub-toast") === "1"; } catch (e) {}
    var showToast = function () { if (d.querySelector(".cookie-bar")) { setTimeout(showToast, 3000); return; } toast.classList.add("on"); };
    if (!seen) setTimeout(showToast, 10000);
    $(".x", toast).addEventListener("click", function () { toast.classList.remove("on"); try { sessionStorage.setItem("ub-toast", "1"); } catch (e) {} });
    $$("a", toast).forEach(function (a) { a.addEventListener("click", function () { toast.classList.remove("on"); try { sessionStorage.setItem("ub-toast", "1"); } catch (e) {} }); });
  }

  /* Forms: sent to the site's form handler (contact.php); enquiries then open the thank-you page */
  var isPreview = location.protocol === "file:" || /claudeusercontent\.com$|claude\.ai$/.test(location.hostname);
  var endpoint = (w.UB_CONFIG && w.UB_CONFIG.formEndpoint) || "contact.php";
  $$("form[data-form]").forEach(function (form) {
    var note = $(".notice", form);
    var say = function (msg) { if (note) { note.textContent = msg; note.hidden = false; } };
    var btn = $("button[type=submit]", form);
    var busy = function (on) { if (!btn) return; if (on) { btn.disabled = true; btn.dataset.l = btn.innerHTML; btn.textContent = "Sending…"; } else { btn.disabled = false; if (btn.dataset.l) btn.innerHTML = btn.dataset.l; } };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (isPreview) { say("Preview mode: forms switch on once the site is live. For now, please email info@unibridge.ae or call +971 50 753 5875."); return; }
      if (w.UBMarketing) w.UBMarketing.attach(form);
      busy(true);
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }).then(function (j) { if (!r.ok || !j.ok) throw 0; }); })
        .then(function () {
          var name = form.getAttribute("name") || "form";
          if (name === "notify") {
            form.reset(); busy(false);
            say("Thank you. We will let you know as soon as dates are announced.");
            w.dispatchEvent(new CustomEvent("ub:signup", { detail: { form: name } }));
          } else {
            location.href = "thank-you.html?form=" + encodeURIComponent(name) + "&t=" + Date.now();
          }
        })
        .catch(function () { busy(false); say("Sorry, that did not send. Please try again, or email info@unibridge.ae."); });
    });
  });
  var topic = (new URLSearchParams(location.search)).get("who");
  if (topic) $$('select[name=audience]').forEach(function (s) { s.value = topic; });

  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
