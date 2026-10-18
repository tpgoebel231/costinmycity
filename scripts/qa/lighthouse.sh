#!/bin/sh
# Mobile Lighthouse for the homepage, a cost page, and an existing city hub.
# Writes JSON under /workspace/turbo/redesign/ and prints category scores plus CLS.
set -e
OUT_DIR="${LH_OUT:-/workspace/turbo/redesign}"
BASE="${BASE_URL:-http://127.0.0.1:4173}"
mkdir -p "$OUT_DIR"

run_one() {
  name="$1"
  path="$2"
  dest="$OUT_DIR/lh-$name.json"
  echo "lighthouse $path"
  npx -y lighthouse "$BASE$path" \
    --chrome-path=/usr/bin/google-chrome \
    --chrome-flags="--headless=new --no-sandbox" \
    --form-factor=mobile \
    --screenEmulation.mobile=true \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json \
    --output-path="$dest" \
    --quiet
  LH_FILE="$dest" LH_NAME="$name" node <<'JS'
const fs = require("fs");
const file = process.env.LH_FILE;
const name = process.env.LH_NAME;
const json = JSON.parse(fs.readFileSync(file, "utf8"));
const cats = json.categories || {};
function score(id) {
  const value = cats[id] && cats[id].score;
  return value == null ? "n/a" : Math.round(value * 100);
}
const cls = json.audits && json.audits["cumulative-layout-shift"];
const lcp = json.audits && json.audits["largest-contentful-paint"];
const tbt = json.audits && json.audits["total-blocking-time"];
const inp = json.audits && json.audits["interaction-to-next-paint"];
console.log(
  name +
    " perf=" + score("performance") +
    " a11y=" + score("accessibility") +
    " bp=" + score("best-practices") +
    " seo=" + score("seo") +
    " CLS=" + (cls && cls.displayValue ? cls.displayValue : cls && cls.numericValue) +
    " LCP=" + (lcp && lcp.displayValue ? lcp.displayValue : "") +
    " TBT=" + (tbt && tbt.displayValue ? tbt.displayValue : "") +
    (inp && inp.displayValue ? " INP=" + inp.displayValue : "")
);
JS
}

run_one home /
run_one charlotte-roof /cost/roof-replacement/charlotte-nc/
run_one denver-hub /city/denver-co/
