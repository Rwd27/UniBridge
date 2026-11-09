/* Career fair booking form: checks the answers, sends them to booking.php, then opens the thank-you page */
(function () {
  var form = document.getElementById("booking-form");
  if (!form) return;
  var note = form.querySelector(".notice");
  var btn = form.querySelector("button[type=submit]");
  var say = function (msg) { note.textContent = msg; note.hidden = false; };

  // Dates can't be in the past; the backup date can't be before the first choice
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var min = today.toISOString().slice(0, 10);
  var d1 = form.elements.date1, d2 = form.elements.date2;
  d1.min = min; d2.min = min;
  d1.addEventListener("change", function () { d2.min = d1.value || min; });

  // "All of the above" clears the single choices, and the other way round
  form.querySelectorAll("[data-all]").forEach(function (all) {
    var group = form.querySelectorAll('input[name="' + all.name + '"]');
    group.forEach(function (box) {
      box.addEventListener("change", function () {
        if (!box.checked) return;
        group.forEach(function (o) { if (box === all ? o !== all : o === all) o.checked = false; });
      });
    });
  });

  // Required tick-box groups need at least one answer
  function groupsOk() {
    var bad = null;
    form.querySelectorAll("fieldset[data-required]").forEach(function (fs) {
      var any = fs.querySelector("input:checked");
      fs.classList.toggle("invalid", !any);
      if (!any && !bad) bad = fs;
    });
    if (bad) { bad.scrollIntoView({ behavior: "smooth", block: "center" }); say("Please answer: " + bad.querySelector("legend").textContent.replace(" *", "") + "."); }
    return !bad;
  }
  form.addEventListener("change", function (e) {
    var fs = e.target.closest("fieldset.invalid");
    if (fs && fs.querySelector("input:checked")) fs.classList.remove("invalid");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    note.hidden = true;
    if (!groupsOk()) return;
    if (location.protocol === "file:") { say("Preview mode: this form works once the page is on unibridge.ae."); return; }
    if (window.UBMarketing) window.UBMarketing.attach(form);
    btn.disabled = true; var label = btn.innerHTML; btn.textContent = "Sending…";
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw j; }); })
      .then(function () { location.href = "thank-you.html?form=booking&t=" + Date.now(); })
      .catch(function (j) {
        btn.disabled = false; btn.innerHTML = label;
        if (j && j.missing) say("Please fill in every question marked with *.");
        else say("Sorry, that did not send. Please try again, or email info@unibridge.ae or WhatsApp +971 50 753 5875.");
      });
  });
})();
