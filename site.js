/* ============================================================================
   SETTINGS - the only part you need to edit
   1. Create a free account at https://cal.com and note your username
      (your booking page is cal.com/<username>).
   2. In Cal.com create one event type per session below; the "slug" is the last
      part of its link, e.g. cal.com/<username>/discovery-call -> "discovery-call".
   3. Put them here, save, and publish.
   ========================================================================== */
const CAL_USERNAME = "clara-tjy";   // cal.com/clara-tjy
const SESSIONS = {
  preview: "preview",               // 10 min, free
  planning: "planning",             // 40 min
  review: "review",                  // 30 min
};
const DEFAULT_SESSION = "preview";

/* ---------------------------------------------------------------- language */
const LANG_KEY = "site-lang";
function setLang(lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }
}
function initLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
  const browserZh = (navigator.language || "").toLowerCase().startsWith("zh");
  setLang(saved || (browserZh ? "zh" : "en"));
  document.querySelectorAll("[data-lang-toggle]").forEach((b) =>
    b.addEventListener("click", () => setLang(document.documentElement.dataset.lang === "zh" ? "en" : "zh"))
  );
}

/* ---------------------------------------------------------------- Cal.com inline embed */
(function (C, A, L) {
  const p = function (a, ar) { a.q.push(ar); };
  const d = C.document;
  C.Cal = C.Cal || function () {
    const cal = C.Cal; const ar = arguments;
    if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || [];
      if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
      else p(cal, ar);
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "init");

let calStarted = false;
function showSession(key) {
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.session === key)));
  const box = document.getElementById("cal-box");
  if (!CAL_USERNAME) return;              // placeholder text stays until the username is set
  box.innerHTML = "";
  const slot = document.createElement("div");
  slot.id = "cal-" + key + "-" + Date.now();
  slot.style.width = "100%";
  box.appendChild(slot);
  if (!calStarted) { Cal("init", { origin: "https://cal.com" }); calStarted = true; }
  Cal("inline", {
    elementOrSelector: "#" + slot.id,
    calLink: CAL_USERNAME + "/" + SESSIONS[key],
    layout: "month_view",
    config: { theme: "light" },
  });
}

function initBooking() {
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showSession(t.dataset.session)));
  document.querySelectorAll("[data-book]").forEach((a) =>
    a.addEventListener("click", () => showSession(a.dataset.book))
  );
  showSession(DEFAULT_SESSION);
}

document.addEventListener("DOMContentLoaded", () => {
  initLang();
  initBooking();
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

/* ---------------------------------------------------------------- retirement calculator
   Simple annual model, all in RM. Educational only.
   need   = first-year retirement spending (today's spend grown by inflation) paid for every year of retirement,
            rising with inflation, discounted at the investment return (start-of-year withdrawals).
   have   = today's savings + monthly savings, grown at the investment return until retirement. */
function fmtRM(x) { return "RM " + Math.round(x).toLocaleString("en-MY"); }
function num(id) { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? 0 : v; }
function calcRetirement() {
  const age = num("c-age"), ret = num("c-ret"), life = num("c-life");
  const spend = num("c-spend") * 12, inf = num("c-inf") / 100, r = num("c-r") / 100;
  const saved = num("c-saved"), monthly = num("c-monthly") * 12;
  const yTo = Math.max(0, ret - age), yIn = Math.max(0, life - ret);
  const first = spend * Math.pow(1 + inf, yTo);
  const real = (1 + r) / (1 + inf) - 1;
  const need = Math.abs(real) < 1e-9 ? first * yIn : first * (1 - Math.pow(1 + real, -yIn)) / real * (1 + real);
  const grow = Math.pow(1 + r, yTo);
  const fvMonthly = r === 0 ? monthly * yTo : monthly * (grow - 1) / r;
  const have = saved * grow + fvMonthly;
  const cover = need > 0 ? Math.min(1, have / need) : 1;
  const gap = Math.max(0, need - have);
  const extra = gap === 0 || yTo === 0 ? 0 : (r === 0 ? gap / yTo : gap * r / (grow - 1)) / 12;
  document.getElementById("o-need").textContent = fmtRM(need);
  document.getElementById("o-yto").textContent = yTo;
  document.getElementById("o-yin").textContent = yIn;
  document.getElementById("o-first").textContent = fmtRM(first / 12);
  document.getElementById("o-have").textContent = fmtRM(have);
  document.getElementById("o-cover").textContent = Math.round(cover * 100) + "%";
  document.getElementById("o-bar").style.width = Math.round(cover * 100) + "%";
  const ex = document.getElementById("o-extra");
  ex.textContent = gap === 0 ? "-" : fmtRM(extra);
  ex.className = gap === 0 ? "ok" : "gap";
  document.querySelectorAll("[data-ontrack]").forEach((el) => (el.hidden = gap !== 0));
  document.querySelectorAll("[data-short]").forEach((el) => (el.hidden = gap === 0));
}
document.addEventListener("DOMContentLoaded", () => {
  const f = document.getElementById("calc-form");
  if (!f) return;
  f.addEventListener("input", calcRetirement);
  calcRetirement();
});
