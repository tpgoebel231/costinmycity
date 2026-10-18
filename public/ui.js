/**
 * Small islands for the calculator, city search, jump form, and sticky bar.
 * The math mirrors lib/estimates.ts (cityJobCost, scalePermit, permitDisplayUsd).
 * scripts/qa/calc-check.mjs fails if this file drifts from that mirror.
 */
function usd(n) {
  if (n == null || Number.isNaN(n)) return "\u2013";
  var cents = Math.round(n * 100);
  if (Math.abs(n) < 1000 && cents % 100 !== 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function estimateAt(cfg, quantity) {
  var defaultQty = cfg.defaultQty;
  var factor = defaultQty > 0 ? quantity / defaultQty : 1;
  var low;
  var typical;
  var high;
  if (cfg.pricing === "job") {
    low = Math.round(cfg.nLow * cfg.mult * factor);
    typical = Math.round(cfg.nTyp * cfg.mult * factor);
    high = Math.round(cfg.nHigh * cfg.mult * factor);
  } else {
    low = Math.round(cfg.nLow * cfg.mult * quantity);
    typical = Math.round(cfg.nTyp * cfg.mult * quantity);
    high = Math.round(cfg.nHigh * cfg.mult * quantity);
  }
  var laborTypical = Math.round(typical * cfg.labor);
  var model = cfg.feeModel;
  var qtyRatio = defaultQty > 0 ? quantity / defaultQty : 1;
  function scale(n) {
    if (n == null) return null;
    if (model === "flat" || model === "none") return Math.round(n);
    if (model === "valuation" || model === "sliding") return Math.round(n);
    if (model === "per_sqft" || model === "per_square" || model === "per-sqft") return Math.round(n * qtyRatio);
    return Math.round(n);
  }
  var sLow = scale(cfg.feeLow);
  var sTyp = scale(cfg.feeTyp);
  var sHigh = scale(cfg.feeHigh);
  var permitKnown = sTyp != null || sLow != null || sHigh != null;
  var pLow = sLow != null ? sLow : sTyp != null ? sTyp : 0;
  var pTyp = sTyp != null ? sTyp : sLow != null ? sLow : 0;
  var pHigh = sHigh != null ? sHigh : sTyp != null ? sTyp : 0;
  var display = sTyp;
  if (sTyp != null && cfg.feeTyp != null && Math.round(cfg.feeTyp) === sTyp) display = cfg.feeTyp;
  return {
    allInLow: low + (permitKnown ? pLow : 0),
    allInTypical: typical + (permitKnown ? pTyp : 0),
    allInHigh: high + (permitKnown ? pHigh : 0),
    labor: laborTypical,
    materials: typical - laborTypical,
    job: typical,
    permitDisplay: permitKnown ? display : null,
    permitKnown: permitKnown,
  };
}

function boot() {
  bindCitySearch();
  bindJumpForm();
  bindCalculator();
  bindSticky();
}

function cityRows() {
  var node = document.getElementById("city-index");
  if (!node) return [];
  try {
    var rows = JSON.parse(node.textContent || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    return [];
  }
}

function bindCitySearch() {
  var rows = cityRows();
  var roots = document.querySelectorAll("[data-city-search]");
  for (var i = 0; i < roots.length; i++) bindOneSearch(roots[i], rows);
}

function bindOneSearch(root, rows) {
  var input = root.querySelector("input");
  var list = root.querySelector("ul");
  var status = root.querySelector("[data-city-status]");
  if (!input || !list || !status) return;

  function render() {
    var needle = input.value.trim().toLowerCase();
    list.textContent = "";
    if (!needle) {
      list.hidden = true;
      status.textContent = "";
      return;
    }
    var matches = [];
    for (var i = 0; i < rows.length; i++) {
      var city = rows[i];
      var hay = (city[1] + " " + city[2] + " " + city[3] + " " + city[4]).toLowerCase();
      if (hay.indexOf(needle) !== -1) matches.push(city);
      if (matches.length === 8) break;
    }
    for (var j = 0; j < matches.length; j++) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "/city/" + matches[j][0] + "/";
      link.textContent = matches[j][1] + ", " + matches[j][3];
      item.appendChild(link);
      list.appendChild(item);
    }
    list.hidden = matches.length === 0;
    status.textContent = matches.length ? String(matches.length) + (matches.length === 1 ? " city" : " cities") : "No city matches";
  }

  input.addEventListener("input", render);
  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      var first = list.querySelector("a");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === "Escape") {
      input.value = "";
      render();
    } else if (event.key === "Enter") {
      var links = list.querySelectorAll("a");
      if (links.length === 1) {
        event.preventDefault();
        window.location.assign(links[0].href);
      }
    }
  });
  list.addEventListener("keydown", function (event) {
    var links = Array.prototype.slice.call(list.querySelectorAll("a"));
    var index = links.indexOf(document.activeElement);
    if (event.key === "ArrowDown" && index >= 0 && index < links.length - 1) {
      event.preventDefault();
      links[index + 1].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index <= 0) input.focus();
      else links[index - 1].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      input.focus();
    }
  });
}

function bindJumpForm() {
  var form = document.querySelector("[data-jump-form]");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var city = form.querySelector("#jump-city");
    var project = form.querySelector("#jump-project");
    if (!city || !project || !city.value || !project.value) return;
    window.location.assign("/cost/" + project.value + "/" + city.value + "/");
  });
}

function numAttr(el, name) {
  var raw = el.getAttribute(name);
  if (raw == null || raw.trim() === "") return null;
  var n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function bindCalculator() {
  var root = document.getElementById("calculator");
  if (!root) return;
  var range = document.getElementById("qty-range");
  var number = document.getElementById("qty-num");
  if (!range || !number) return;
  var cfg = {
    pricing: root.getAttribute("data-pricing") || "job",
    defaultQty: numAttr(root, "data-default-qty") || 1,
    nLow: numAttr(root, "data-n-low") || 0,
    nTyp: numAttr(root, "data-n-typ") || 0,
    nHigh: numAttr(root, "data-n-high") || 0,
    mult: numAttr(root, "data-mult") == null ? 1 : numAttr(root, "data-mult"),
    labor: numAttr(root, "data-labor") == null ? 0.5 : numAttr(root, "data-labor"),
    feeModel: root.getAttribute("data-fee-model") || "",
    feeLow: numAttr(root, "data-fee-low"),
    feeTyp: numAttr(root, "data-fee-typ"),
    feeHigh: numAttr(root, "data-fee-high"),
  };
  var min = numAttr(root, "data-min") == null ? 0 : numAttr(root, "data-min");
  var max = numAttr(root, "data-max") == null ? min : numAttr(root, "data-max");

  function clamp(n) {
    return Math.min(max, Math.max(min, n));
  }

  function paint(qty) {
    var est = estimateAt(cfg, qty);
    var nodes = document.querySelectorAll("[data-calc-mirror]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-calc-mirror");
      if (key === "typical") nodes[i].textContent = usd(est.allInTypical);
      else if (key === "low") nodes[i].textContent = usd(est.allInLow);
      else if (key === "high") nodes[i].textContent = usd(est.allInHigh);
      else if (key === "labor") nodes[i].textContent = usd(est.labor);
      else if (key === "materials") nodes[i].textContent = usd(est.materials);
      else if (key === "job") nodes[i].textContent = usd(est.job);
      else if (key === "permit") nodes[i].textContent = est.permitKnown ? usd(est.permitDisplay) : "Blank";
      else if (key === "allin") nodes[i].textContent = usd(est.allInTypical);
    }
    var span = est.allInHigh - est.allInLow;
    var ratio = span > 0 ? (est.allInTypical - est.allInLow) / span : 0.5;
    var pct = Math.min(100, Math.max(0, ratio * 100));
    var dot = document.querySelector("[data-range-dot]");
    var label = document.querySelector("[data-range-label]");
    if (dot) dot.style.left = pct + "%";
    if (label) label.style.left = Math.min(84, Math.max(16, pct)) + "%";
  }

  function commit(n, writeUrl) {
    if (!Number.isFinite(n)) return;
    var next = clamp(n);
    range.value = String(next);
    number.value = String(next);
    paint(next);
    if (!writeUrl) return;
    var url = new URL(window.location.href);
    url.searchParams.set("qty", String(next));
    if (cfg.pricing === "per-unit") url.searchParams.set("sf", String(next));
    else url.searchParams.delete("sf");
    url.searchParams.delete("finish");
    var query = url.searchParams.toString();
    window.history.replaceState(null, "", url.pathname + (query ? "?" + query : "") + url.hash);
  }

  range.addEventListener("input", function () {
    commit(Number(range.value), true);
  });
  number.addEventListener("input", function () {
    if (number.value.trim() === "") return;
    var n = Number(number.value);
    if (!Number.isFinite(n)) return;
    commit(n, true);
  });

  var params = new URLSearchParams(window.location.search);
  var raw = params.get("qty") || params.get("sf");
  if (raw != null && raw.trim() !== "") {
    var initial = Number(raw);
    if (Number.isFinite(initial)) commit(initial, false);
  }
}

function bindSticky() {
  var bar = document.querySelector(".sticky-est");
  var calc = document.getElementById("calculator");
  if (!bar || !calc || typeof IntersectionObserver !== "function") return;

  function place() {
    var wide = window.innerWidth >= 1100;
    if (wide) {
      bar.hidden = true;
      document.body.classList.remove("has-sticky-est");
    }
  }

  var observer = new IntersectionObserver(function (entries) {
    var entry = entries[0];
    var past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    var show = past && window.innerWidth < 1100;
    bar.hidden = !show;
    document.body.classList.toggle("has-sticky-est", show);
    if (!show) bar.classList.remove("is-away");
  });
  observer.observe(calc);
  window.addEventListener("resize", place);

  document.addEventListener("focusin", function (event) {
    if (bar.hidden) return;
    var target = event.target;
    if (!target || !target.getBoundingClientRect) return;
    if (bar.contains(target)) {
      bar.classList.remove("is-away");
      return;
    }
    var rect = target.getBoundingClientRect();
    var box = bar.getBoundingClientRect();
    var obscured = rect.bottom > box.top + 1 && rect.top < box.bottom - 1;
    bar.classList.toggle("is-away", obscured);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}
