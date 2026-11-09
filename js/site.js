/* UniBridge: "Our services" dropdown in the menu */
(function () {
  var dd = document.querySelector(".dd"), btn = dd && dd.querySelector(".dd-btn");
  if (!btn) return;
  function setDD(open) { dd.classList.toggle("open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); }
  btn.addEventListener("click", function (e) { e.stopPropagation(); setDD(!dd.classList.contains("open")); });
  document.addEventListener("click", function (e) { if (!dd.contains(e.target)) setDD(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDD(false); });
})();
