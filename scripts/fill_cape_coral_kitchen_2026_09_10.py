#!/usr/bin/env python3
"""Fill cape-coral-fl kitchen-remodel from 2026 Addition/Remodel Residential table."""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PERMITS = ROOT / "data" / "permits.json"
SOURCES = ROOT / "data" / "SOURCES.md"

PDF = (
    "https://www.capecoral.gov/Documents/Departments/Development%20Services/"
    "Building%20Permit%20Reports/Permitting%20Fees/Permit_Fee_Schedule_DCD_7000.pdf"
)
MISC = (
    "https://www.capecoral.gov/Documents/Departments/Development%20Services/"
    "Building%20Permit%20Reports/Permitting%20Fees/Miscellaneous%20permit%20fees.pdf"
)
SRC_NAME = (
    "City of Cape Coral Schedule of New Construction Fees "
    "(Plan Check & Inspection Combined) — Addition/Remodel Residential; "
    "posted on Permitting Fees hub (PDF ModDate 2026-04-22)"
)
DATE = "2026-09-10"
CAVEAT = (
    "City of Cape Coral, not Fort Myers. Kitchen uses Addition/Remodel - Residential "
    "(IBC R-3 / §310) on the New Construction fee schedule, Construction Type V A/B "
    "(typical wood-frame SFR). Misc schedule Kitchen Hood is commercial and was not used. "
    "Florida Building Code 2.5% surcharge applies to additions/remodels (misc schedule header). "
    "Assumed valuations $15k/$35k/$75k kept for dataset consistency; fees use documented "
    "affected sf (150/200/400)."
)

# Type V A/B Addition/Remodel - Residential rows from Permit_Fee_Schedule_DCD_7000.pdf
ROWS = [
    (100, 207.0, 11.93),
    (500, 254.0, 7.16),
    (1000, 290.0, 4.37),
    (2000, 334.0, 3.18),
    (5000, 430.0, 2.11),
    (10000, 535.0, 5.35),
]


def building_fee(sf: int) -> float:
    thr, base, per = ROWS[0]
    for r in ROWS:
        if r[0] <= sf:
            thr, base, per = r
        else:
            break
    add = math.ceil((sf - thr) / 100) if sf > thr else 0
    return round(base + add * per, 2)


def with_surcharge(building: float) -> float:
    return round(building * 1.025, 2)


def kitchen_row() -> dict:
    # Documented kitchen affected area: low 150 / typical 200 / high 400
    b150 = building_fee(150)
    b200 = building_fee(200)
    b400 = building_fee(400)
    low = with_surcharge(b150)
    typical = with_surcharge(b200)
    high = with_surcharge(b400)
    sur_typical = round(typical - b200, 2)
    return {
        "citySlug": "cape-coral-fl",
        "projectSlug": "kitchen-remodel",
        "permitRequired": True,
        "feeModel": "area",
        "feeLowUsd": low,
        "feeHighUsd": high,
        "feeTypicalUsd": typical,
        "typicalProjectValueUsd": 35000,
        "extras": [
            {
                "name": "Addition/Remodel Residential Type V (plan check + inspection)",
                "feeUsd": b200,
                "note": (
                    "Included. 200 sf: $207 base @ 100 sf + $11.93 × ceil((200−100)/100)=1 → $218.93."
                ),
            },
            {
                "name": "Florida Building Code 2.5% surcharge",
                "feeUsd": sur_typical,
                "note": "Included. Misc schedule: 2.5% on New Construction/Additions/Remodels.",
            },
        ],
        "sourceUrl": PDF,
        "sourceName": SRC_NAME,
        "retrievedDate": DATE,
        "caveat": CAVEAT,
        "assumedValuationUsd": {"low": 15000, "typical": 35000, "high": 75000},
        "calculationNote": (
            f"Documented typical kitchen remodel affected area 200 sf (low 150 / high 400). "
            f"Addition/Remodel Residential Type V A/B: 150/200 sf = ${b150:.2f} × 1.025 = ${low:.2f}; "
            f"400 sf = ${b400:.2f} × 1.025 = ${high:.2f}. "
            f"Portion-thereof rule: each additional 100 sf or portion up to next threshold."
        ),
    }


def patch_sources(text: str) -> str:
    needle = "### Cape Coral, FL\n"
    if needle not in text:
        raise SystemExit("Cape Coral section missing in SOURCES.md")
    # Replace the Cape Coral block through the next ### heading
    start = text.index(needle)
    rest = text[start + len(needle) :]
    nxt = rest.find("\n### ")
    if nxt < 0:
        raise SystemExit("Could not find end of Cape Coral section")
    old_block = text[start : start + len(needle) + nxt]
    new_block = (
        "### Cape Coral, FL\n"
        "- Permitting Fees hub: https://www.capecoral.gov/departments/development_services/permitting_services_division/permitting_fees.php\n"
        f"- Miscellaneous Permit Fee Schedule effective **January 1, 2026**, retrieved **2026-09-01** "
        f"(hub PDF + JLAC Assertion 3 reprint): {MISC}\n"
        "  - Air Conditioning Change Out **$100** (starred; 2.5% FBC surcharge)\n"
        "  - Roofing Miscellaneous **$100** (2.5% FBC surcharge from the schedule header)\n"
        "  - No residential yard-deck dollar line (Pool Deck Addition $361 is a pool deck; Gazebo $427; "
        "Slabs-Residential $113). Deck typical remains **null**. "
        "Re-attempted **2026-09-10**: hub misc PDF re-parsed; still no yard-deck line; deck typical remains **null** "
        "(dollars not invented).\n"
        f"- New Construction Permit Fee Schedule (Permit_Fee_Schedule_DCD_7000.pdf, ModDate **2026-04-22**), "
        f"retrieved **{DATE}**: {PDF}\n"
        "  - **Addition/Remodel - Residential** (IBC §310) Construction Type **V A/B**: "
        "100 sf base **$207** + **$11.93**/additional 100 sf (or portion); 500 sf base **$254** + **$7.16**/100 sf\n"
        "  - Kitchen remodel filled **2026-09-10**: typical/low 200/150 sf → **$218.93 × 1.025 = $224.40**; "
        "high 400 sf → **$242.79 × 1.025 = $248.86**. Prior null was from misc-only search; "
        "the 2020 25%-off exhibit is obsolete after the Jan 1 2026 discount repeal.\n"
        "- City of Cape Coral, not Fort Myers and not Miami. Do **not** use Miami or Tampa wages\n"
    )
    return text.replace(old_block, new_block, 1)


def patch_blocked_notes(text: str) -> str:
    """Append 2026-09-10 re-attempt notes for still-null cities."""
    replacements = [
        (
            "Re-attempted **2026-09-09**: Flat Rate A175 / Fee Schedule 3 still have no kitchen/interior-alteration dollar line; kitchen typical remains **null** (dollars not invented).",
            "Re-attempted **2026-09-09**: Flat Rate A175 / Fee Schedule 3 still have no kitchen/interior-alteration dollar line; kitchen typical remains **null** (dollars not invented). "
            "Re-attempted **2026-09-10**: Flat Rate A175 (rev 08/2026) and Fee Schedule 3 (new buildings only) re-confirmed; no kitchen/interior-alteration dollar line; kitchen typical remains **null** (dollars not invented).",
        ),
        (
            "Re-attempted **2026-09-09**: Dec 2025 Ord amending 8-31(c) still omits Total Valuation table; deck/kitchen typicals remain **null** (dollars not invented).",
            "Re-attempted **2026-09-09**: Dec 2025 Ord amending 8-31(c) still omits Total Valuation table; deck/kitchen typicals remain **null** (dollars not invented). "
            "Re-attempted **2026-09-10**: Dec 2025 Word PDF still omits building Total Valuation table after Permit Fees intro; Ord 22,204 table superseded and not used; deck/kitchen typicals remain **null** (dollars not invented).",
        ),
    ]
    for old, new in replacements:
        if old not in text:
            raise SystemExit(f"Missing expected SOURCES note:\n{old[:80]}...")
        if "2026-09-10" in text[text.index(old) : text.index(old) + len(old) + 200]:
            continue  # already patched
        text = text.replace(old, new, 1)
    return text


def main() -> None:
    data = json.loads(PERMITS.read_text())
    row = kitchen_row()
    found = False
    for i, r in enumerate(data):
        if r.get("citySlug") == "cape-coral-fl" and r.get("projectSlug") == "kitchen-remodel":
            data[i] = row
            found = True
            break
    if not found:
        raise SystemExit("cape-coral-fl kitchen-remodel row not found")
    PERMITS.write_text(json.dumps(data, indent=2) + "\n")
    sources = SOURCES.read_text()
    sources = patch_sources(sources)
    sources = patch_blocked_notes(sources)
    SOURCES.write_text(sources)
    print(
        f"Filled cape-coral-fl kitchen-remodel: "
        f"low={row['feeLowUsd']} typical={row['feeTypicalUsd']} high={row['feeHighUsd']}"
    )
    nulls = [f"{r['citySlug']}/{r['projectSlug']}" for r in data if r.get("feeTypicalUsd") is None]
    print(f"Remaining nulls ({len(nulls)}): {', '.join(nulls)}")


if __name__ == "__main__":
    main()
