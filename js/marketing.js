/*
  UniBridge marketing and measurement
  - Cookie consent banner (Accept / Decline), remembered per visitor
  - Google Consent Mode v2: everything starts as "denied"
  - After consent: Google Tag Manager, Google Analytics 4, Google Ads, Microsoft Clarity, Meta Pixel, LinkedIn Insight
  - Lead events: enquiry and partner forms, event sign-ups, WhatsApp, phone, email and Enquire clicks
  - Campaign capture: utm_*, gclid and fbclid are saved and sent with every form
  - Social icons in the footer from UB_CONFIG.social
  IDs live in js/config.js.
*/
(function () {
  var C = window.UB_CONFIG || {};
  var KEY = "ub-consent";
  var w = window, d = document;

  /* ---------- Consent Mode defaults (before any tag) ---------- */
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  w.gtag = w.gtag || gtag;
  w.gtag("consent", "default", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500 });

  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---------- Loading tags ---------- */
  var loaded = false, queue = [];
  function script(src) { var s = d.createElement("script"); s.async = true; s.src = src; d.head.appendChild(s); return s; }

  function loadTags() {
    if (loaded) return; loaded = true;
    w.gtag("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });

    if (C.gtmId) {
      w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      script("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(C.gtmId));
    }
    var gid = C.ga4Id || C.googleAdsId;
    if (gid) {
      script("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gid));
      w.gtag("js", new Date());
      if (C.ga4Id) w.gtag("config", C.ga4Id);
      if (C.googleAdsId) w.gtag("config", C.googleAdsId);
    }
    if (C.clarityId) {
      /* Microsoft Clarity */
      (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(w, d, "clarity", "script", C.clarityId);
      w.clarity("consent");
    }
    if (C.metaPixelId) {
      /* Meta Pixel base code */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(w, d, "script", "https://connect.facebook.net/en_US/fbevents.js");
      w.fbq("init", C.metaPixelId);
      w.fbq("track", "PageView");
    }
    if (C.linkedinPartnerId) {
      w._linkedin_partner_id = C.linkedinPartnerId;
      w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
      w._linkedin_data_partner_ids.push(C.linkedinPartnerId);
      script("https://snap.licdn.com/li.lms-analytics/insight.min.js");
    }
    queue.splice(0).forEach(function (e) { send(e[0], e[1], e[2]); });
  }

  /* ---------- Events ---------- */
  var META = { generate_lead: "Lead", sign_up: "Subscribe", click_whatsapp: "Contact", click_phone: "Contact", click_email: "Contact" };
  function send(name, params, opts) {
    params = params || {};
    w.dataLayer.push(Object.assign({ event: name }, params));
    if (C.ga4Id) w.gtag("event", name, params);
    if (w.fbq && META[name]) w.fbq("track", META[name], params);
    if (opts && opts.adsConversion && C.googleAdsId && C.googleAdsLeadLabel) {
      w.gtag("event", "conversion", { send_to: C.googleAdsId + "/" + C.googleAdsLeadLabel });
    }
  }
  function track(name, params, opts) {
    if (loaded) send(name, params, opts);
    else queue.push([name, params, opts]);   // sent once, after the visitor accepts cookies
  }

  /* Clicks on contact options */
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^https:\/\/wa\.me\//.test(href)) track("click_whatsapp", { link_text: a.textContent.trim() });
    else if (/^tel:/.test(href)) track("click_phone", { link_text: a.textContent.trim() });
    else if (/^mailto:/.test(href)) track("click_email", { link_text: a.textContent.trim() });
    else if (a.classList.contains("nav-cta")) track("click_enquire", { location: "header" });
  });

  /* Event sign-ups (stay on the page) */
  w.addEventListener("ub:signup", function (e) { track("sign_up", { form_name: (e.detail && e.detail.form) || "notify" }); });

  /* Enquiries land on the thank-you page: count each one once */
  if (d.body && d.body.getAttribute("data-page") === "thank-you") {
    var form = (new URLSearchParams(location.search)).get("form") || "inquiry";
    var flag = "ub-lead-" + form + "-" + (new URLSearchParams(location.search)).get("t");
    var seen = false; try { seen = sessionStorage.getItem(flag) === "1"; sessionStorage.setItem(flag, "1"); } catch (err) {}
    if (!seen) track("generate_lead", { form_name: form }, { adsConversion: true });
  }

  /* ---------- Campaign capture (utm, gclid, fbclid) ---------- */
  var ATTR = "ub-attribution";
  (function captureAttribution() {
    var q = new URLSearchParams(location.search), keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"], found = {}, any = false;
    keys.forEach(function (k) { var v = q.get(k); if (v) { found[k] = v.slice(0, 200); any = true; } });
    try {
      if (any) { found.landing_page = location.pathname; found.referrer = d.referrer.slice(0, 200); sessionStorage.setItem(ATTR, JSON.stringify(found)); }
      else if (!sessionStorage.getItem(ATTR) && d.referrer && d.referrer.indexOf(location.host) === -1) sessionStorage.setItem(ATTR, JSON.stringify({ referrer: d.referrer.slice(0, 200), landing_page: location.pathname }));
    } catch (e) {}
  })();
  function attach(form) {
    var data = {}; try { data = JSON.parse(sessionStorage.getItem(ATTR) || "{}"); } catch (e) {}
    data.page = location.pathname;
    Object.keys(data).forEach(function (k) {
      var input = form.querySelector('input[name="' + k + '"]');
      if (!input) { input = d.createElement("input"); input.type = "hidden"; input.name = k; form.appendChild(input); }
      input.value = data[k];
    });
  }

  /* ---------- Cookie banner ---------- */
  function banner() {
    var old = d.querySelector(".cookie-bar"); if (old) old.remove();
    var bar = d.createElement("div");
    bar.className = "cookie-bar"; bar.setAttribute("role", "dialog"); bar.setAttribute("aria-label", "Cookie choices");
    bar.innerHTML = '<p>We use cookies to understand how visitors use our website and to measure our advertising. <a href="privacy.html">Privacy Policy</a></p>' +
      '<div class="cookie-actions"><button type="button" class="btn btn-line" data-c="denied">Decline</button><button type="button" class="btn btn-gold" data-c="granted">Accept</button></div>';
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-c]"); if (!b) return;
      var v = b.getAttribute("data-c"); setConsent(v); bar.remove();
      if (v === "granted") loadTags(); else if (loaded) location.reload();
    });
    d.body.appendChild(bar);
  }
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-cookie-settings]")) { e.preventDefault(); banner(); } });

  /* ---------- Social icons ---------- */
  var ICONS = {
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14.5 8.5H16V5.6c-.3 0-1.3-.1-2.4-.1-2.4 0-3.9 1.5-3.9 4.1v2.2H7v3.2h2.7V21h3.3v-6h2.6l.4-3.2h-3v-1.9c0-.9.3-1.4 1.5-1.4z"/>',
    linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 7.9v.1M11.5 16v-3.2c0-1.4.9-2.3 2-2.3s1.9.8 1.9 2.3V16M11.5 10.5V16"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.2 9.3l4.6 2.7-4.6 2.7z" fill="currentColor" stroke="none"/>',
    threads: '<path d="M16.6 11.2c-.3-2.9-2.1-4.3-4.8-4.3-2 0-3.5.9-4.3 2.4M16.6 11.2c-3.6-1-6.7-.2-6.6 2.2.1 1.5 1.5 2.3 3.2 2.1 2.2-.2 3.4-2 3.4-4.3zM16.6 11.2c2.3.8 3.3 2.6 2.6 4.7-.9 2.9-3.7 4.6-7.2 4.6-4.6 0-7.5-3.2-7.5-8.5S7.4 3.5 12 3.5c3.3 0 5.7 1.5 6.9 4.2"/>',
    x: '<path d="M4.5 4.5l15 15M19.5 4.5l-15 15"/>',
    tiktok: '<path d="M14 4v10.2a3.6 3.6 0 11-3.1-3.6"/><path d="M14 4c.4 2.3 2 3.8 4.5 4"/>'
  };
  var NAMES = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", threads: "Threads", youtube: "YouTube", x: "X", tiktok: "TikTok" };
  function renderSocial() {
    var s = C.social || {};
    d.querySelectorAll("[data-social]").forEach(function (box) {
      var html = "";
      Object.keys(ICONS).forEach(function (k) {
        if (!s[k]) return;
        html += '<a href="' + s[k].replace(/"/g, "") + '" target="_blank" rel="noopener" aria-label="UniBridge on ' + NAMES[k] + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[k] + "</svg></a>";
      });
      box.innerHTML = html; box.hidden = !html;
    });
  }

  /* ---------- Start ---------- */
  w.UBMarketing = { track: track, attach: attach, openCookieSettings: banner };
  function start() {
    renderSocial();
    var c = getConsent();
    if (c === "granted") loadTags();
    else if (c !== "denied") banner();
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start); else start();
})();
