# CostInMyCity primary sources

Retrieved 2026-08-13. Charlotte, NC and Minneapolis, MN permit rows were re-extracted from official schedules on **2026-08-29**. Austin, TX roof/deck and Portland, OR HVAC were extracted from official schedules on **2026-08-31**. Third-party calculators were used only as pointers to official PDFs; they are **not** cited as fee sources. We cite the city's published schedule.

## How numbers were treated

- Permit dollars are either (a) copied from an official schedule or (b) **computed** from an official formula at a documented assumed project valuation. Assumed valuations are **not** city-assessed values.
- If an official line item or extractable table could not be found, the field is `null` and the caveat says so.
- City job-cost adjustments are a **BLS wage-index** on the labor share only — not local bid surveys.
- Deck board prices are user-enterable defaults (`priceLabel: "default, edit me"`). No Home Depot 2026 SKU snapshot was stable enough to cite.

Assumed valuations used only to apply official permit formulas:

| Project | Low | Typical | High | Why these |
|---|---:|---:|---:|---|
| roof-replacement | $8,000 | $12,000 | $22,000 | 2026 asphalt / mid-size roof band |
| hvac-replacement | $5,000 | $7,500 | $16,000 | 2026 average $7,500; high toward new-duct jobs |
| deck | $8,000 | $12,000 | $19,200 | 2026 job average / 16×20 table |
| kitchen-remodel | $15,000 | $35,000 | $75,000 | 2026 remodel $14.6k–$41.3k; high = larger gut |

When a published table is **square-foot / ton / BTU** rather than valuation, fees are computed from these documented typical-job specs (retrieved **2026-09-01**). Specs are also written into the affected `calculationNote` fields.

| Job | Typical spec | Low | High | Why these |
|---|---|---|---|---|
| kitchen-remodel | **200 sf** affected area | 150 sf | 400 sf | Typical same-footprint kitchen; 400 sf is a large gut of the room |
| deck | **16×20 = 320 sf** | 200 sf | 400 sf | Dataset already uses the 16×20 table for deck valuations |
| roof-replacement | **1,500 sf** of roof surface | 1,000 sf | 1,800 sf | `project-costs.json` scopeNote: typical home roof about 1,300–1,800 sf of surface |
| hvac-replacement | **3-ton (36,000 BTU)** like-for-like split system | 2-ton / 60 kBTU furnace or the published sheet-metal / equipment floor | 5-ton / 120 kBTU or extra equipment lines on the **same** table | 80,000 BTU mid-efficiency gas furnace is the documented typical 3-ton companion when a furnace line needs BTU |

---

## Cities and populations

- U.S. Census Bureau, Vintage 2025 city/town population estimates (July 1, 2025): https://www.census.gov/newsroom/press-releases/2026/vintage-2025-city-town-pop-estimates.html
- Census QuickFacts (Austin, Charlotte, Raleigh examples): https://www.census.gov/quickfacts/

Populations used (July 1, 2025): Los Angeles 3,869,089; Chicago 2,731,585; Houston 2,397,315; Phoenix 1,665,481; Philadelphia 1,574,281; San Antonio 1,548,422; San Diego 1,406,106; Dallas 1,329,491; Fort Worth 1,028,117; Jacksonville 1,017,689; Austin 1,002,632; Charlotte 964,784; Columbus (OH) 938,396; Indianapolis city (balance) 901,116; Seattle 784,777; Denver 740,613; Nashville-Davidson 721,074; Washington 693,645; Las Vegas 679,817; Boston 672,973; Detroit 649,095; Portland 635,109; Sacramento 536,449; Atlanta 529,110; Kansas City (MO) 521,220; Raleigh 506,306; Miami 489,812; Minneapolis 430,324; Tampa 413,554; Orlando 333,888.

Official Census CSV used for the 10 cities added 2026-09-01: https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025.csv (Vintage 2025, POPESTIMATE2025). Indianapolis is **Indianapolis city (balance)** 901,116 (SUMLEV 162), not the 910,638 consolidated-city total. Kansas City is **Kansas City city, Missouri** 521,220, not Kansas City, Kansas.

---

## Permit fee schedules (official)

### Seattle, WA
- 2026 Fee Subtitle (SMC Ch. 22.900), effective Jan 1, 2026: https://www.seattle.gov/documents/Departments/SDCI/Codes/FeeSubtitleFinal.pdf
  - Table D-1 Development Fee Index; Table D-2 permit/plan-review % of DFI; Table D-8 mechanical equipment ($60.35/unit)
  - 22.900A.100 technology fee = 5%
  - 22.900B.010 base/hourly = $292
- 2026 Fee Summary flyer: https://www.seattle.gov/documents/Departments/SDCI/Codes/2026FeeSummary.pdf
- SDCI fees page: https://www.seattle.gov/construction-and-inspections/codes/codes-we-enforce-(a-z)/fees
- 2026 fee-changes blog: https://buildingconnections.seattle.gov/2026/01/05/2026-fee-changes/
- WA State Building Code Council $6.50 residential building-permit fee: RCW 19.27.085 (reprinted in the Fee Subtitle)
- Portal: https://cosaccela.seattle.gov/portal/

### Charlotte, NC (Mecklenburg County)
- Mecklenburg County LUESA Fee Ordinance, Document Book 55 / Document 58, **revised July 1, 2026** (official Widen original): https://mecknc.widen.net/s/grxjph7rtx/luesa-fee-ordinance
  Direct original PDF: https://mecknc.widen.net/content/huftpibwjs/original/LUESA-Fee-Ordinance.pdf
  Alternate share link from Code Enforcement: https://mecknc.widen.net/s/gxrbpbswt9/fees
  - Section II.A valuation table: $59.70 minimum (no plan review); $79.61 minimum (commercial with plan review); $3,001–$50,000 = $59.70 + $12.19 per $1,000 or part over $3,000
  - Note a: renovation/alteration/upfit under $100,000 = $79.61 per BEMP trade + $0.12/sf building + $0.08/sf each E/M/P trade (room/space area)
  - Note f: $3.00 technology charge on all permits issued
  - Section II.D.1 appliance/equipment change-out (SF/townhouse HVAC etc., two trades via TIP): 1.5 × minimum permit fee; non-TIP = 2 × maximum permit fee
  - Section II.D.13 Homeowner Recovery Fund $10.00 per SF construction/alteration permit issued to a general contractor
  - Section II.D.36 owner-as-contractor < $40,000: $60/trade + $45 plan review if required + $45/inspection trip
- Code Enforcement permitting: https://code.mecknc.gov/permitting
- Trades Internet Permitting (TIP): https://code.mecknc.gov/permitting/tip
- N.C.G.S. 160D-1110 (permit requirement and $40,000 exemptions, including roofing replacement): https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_160D/GS_160D-1110.html
- NC OSFM guidance paper GS 160D-1110(c) (roof replacement + up to 15% of existing roof deck): https://www.ncosfm.gov/guidance-papers/gs-160d-1110c-application-construction-permit-exceptions/open
- City of Charlotte FY2027 User Fee Schedules landing page (LDIRL / residential zoning; line-item dollars **not** extracted): https://www.charlottenc.gov/Growth-and-Development/Getting-Started-on-Your-Project/User-Fee-Schedules
- City of Charlotte FY2026 Individual Residential Lot Fee Schedule (effective July 1, 2025–June 30, 2026; **expired**, cited only to document that FY26 city dollars were not used as FY27 fees): https://www.charlottenc.gov/files/sharedassets/city/v/3/growth-and-development/documents/dev-center-fees/fy26/irl-fy-26-fees.pdf

### Austin, TX
- DSD fees landing page (FY 2025-26 effective Oct 1, 2025): https://www.austintexas.gov/development-services/fees
- City Council FY26 residential fee exhibit (CM Vela Attachment 1): https://services.austintexas.gov/edims/document.cfm?id=456810
  - HVAC change-out first system $80.09; additional $41.47
  - Interior remodel plan review brackets; building/electric/plumbing/energy fees; express kitchen inspection $87.49
- FY26 budget / DSD fee note: https://mailchi.mp/austintexas/fy-2026-budget-and-dsd-fees
- Fee ordinance File 25-1121: https://services.austintexas.gov/edims/document.cfm?id=456572
- FY 2025-26 Residential Building Plan Review & Inspection Permit Fees PDF (updated 7/15/2026, effective 10/01/2025), retrieved **2026-08-31**: https://austin.widen.net/s/fz9rhwg8qq/fees_residential
  Direct original PDF: https://austin.widen.net/content/kqozxt8sbc/original/Fees_Residential.pdf
  Roof/deck dollars use this published schedule (10% cap column as printed), not the higher “FY25-26 Proposed Fee” column on the Council exhibit.
  - Small Projects Plan Review $132.86
  - Residential Plan Review Application Processing $106.72
  - Express Residential Plan Review $106.72
  - Residential Express Permits/Kitchen Remodels inspection $66.33
  - Building permit base ≤1,000 sq ft $289.53; electric base $166.99
  - Austin Fire Residential Roof Replacement Inspection $370.00 (per-case)
- Work Exempt from Building Permits, retrieved **2026-08-31**: https://www.austintexas.gov/development-services/work-exempt-building-permits
  - Residential 12: asphalt shingles replacing existing asphalt shingles are exempt unless the property is in the Wildland-Urban Interface and 50% or more of the roofing is being replaced
  - Residential 13: replacement of any roof covering that does not adversely affect the roof structure, same WUI caveat
  - Residential 10: deck ≤200 sq ft, ≤30 in above grade, not attached to a dwelling, not in a flood hazard
- Express permits (roof qualifications; asphalt reroof may be exempt): https://www.austintexas.gov/development-services/express-permits
- Residential plan review (Pool/Uncovered Deck listed; small projects billed at the Small Projects Plan Review rate): https://www.austintexas.gov/development-services/residential-plan-review
- Other Permits and Fees PDF, retrieved **2026-08-31** (searched; no residential reroof/deck building-permit line used): https://austin.widen.net/s/vtxz9cv5gw/fees_other-permits-and-fees
  Direct original: https://austin.widen.net/content/kbu7hljgoz/original/Fees_Other-Permits-and-Fees.pdf

### Denver, CO
- Building and Land Development Fees (ADMIN 138 table): https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development/Plan-Review-Permits-and-Inspections/Development-Fees
- ADMIN 138 policy PDF (also mirrored): https://denver.prelive.opencities.com/files/assets/public/v/9/community-planning-and-development/documents/ds/building-codes/policies/admin_138.pdf
- Short URL referenced by CPD: https://www.denvergov.org/DSfees
- ePermits: https://www.denvergov.org/epermits

### Phoenix, AZ
- PDD Fee Schedule, Ordinance G-7465, effective Jan 20, 2026: https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/impact-fees/fee-schedule.pdf
- Fees / valuations page: https://www.phoenix.gov/administration/departments/pdd/tools-resources/fees.html
- Phoenix City Code Appendix A.2 Part 18 (older published table; 2026 PDF Table A supersedes dollar amounts used here): https://phoenix.municipal.codes/CC/A.2_Part18

### Nashville, TN
- Codes fee schedule PDF (Dec 2025 file): https://www.nashville.gov/sites/default/files/2025-12/Building-Permit-Fee-Scheudle-2025.pdf
  - 16.28.110: 1-2 family $5.00 / $1,000; $25 zoning; 10% Codes Tech Fee; plan review exempt for 1-2 family
  - 16.12.220 plumbing minimum $75
  - 16.16.400 gas/mechanical minimum $75
- Publications list: https://www.nashville.gov/departments/codes/construction-and-permits/publications-list
- Construction and permits: https://www.nashville.gov/departments/codes/construction-and-permits

### Atlanta, GA
- ATL311 residential permits (modified May 20, 2026): minimum $150 + $25 technology fee: https://www.atl311.com/en-us/knowledgearticle/?code=KB0012509
- Commercial counterpart (same minimum language): https://www.atl311.com/en-us/knowledgearticle/?code=KB0012497
- Code of Ordinances Part 19 (impact fees / fee authority; full building-permit table not extracted): https://library.municode.com/GA/atlanta/codes/code_of_ordinances?nodeId=PTIIICOORANDECO_PT19FEPELICH
- Office of Buildings: https://www.atlantaga.gov/government/departments/city-planning/office-of-buildings

### Portland, OR
- Adopted fee schedules (effective July 10, 2026): https://www.portland.gov/ppd/news/2026/4/27/permitting-development-fee-changes-take-effect-july-10
- Building and Other Permits Fee Schedule PDF: https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download
- Separate mechanical / electrical / plumbing PDFs are listed on the same news page. Building-permit rows still do **not** use the mechanical table.
- Oregon 12% building-permit surcharge is applied on top of the extracted building-permit table. Plan-review / development-services add-ons on the same PDF were **not** fully extracted — Portland **building** totals are therefore a **partial** official figure.
- Current fee schedules (12% Oregon surcharge applies to building, plumbing, electrical, **and mechanical** permits), retrieved **2026-08-31**: https://www.portland.gov/ppd/current-fee-schedules
- Mechanical Permit Fee Schedule for the City of Portland, effective July 10, 2026 (1–2 family equipment table used for HVAC), retrieved **2026-08-31**: https://www.portland.gov/ppd/documents/mechanical-permit-fee-schedule-city-portland-effective-july-10-2026/download
  Line items used (Proposed Fee column on the City of Portland schedule as reprinted by Oregon BCD; Ordinance 192193 adopted the exhibits effective July 10, 2026; 9% mechanical increase): 1–2 family minimum $167; air handling unit $44; air conditioning $44; heat pump $84; install/replace furnace/burner (including ductwork/vent/liner) $91.
  Direct extractable PDF of that City of Portland schedule (BCD notice of proposed fee adoption, April 2026): https://www.oregon.gov/bcd/jurisdictions/Documents/2026-portland-proposed-fees.pdf
  Fallback council exhibit URL (403 from this host): https://www.portland.gov/sites/default/files/council-documents/2026/2026-07-10-PP-D-PROPOSED-Fee-Schedules-Exhibit-I---Mechanical_0.pdf
- Mechanical permit application (fee worksheet structure: equipment subtotal, then minimum, then 12% state surcharge): https://www.portland.gov/ppd/documents/mechanical-permit-application/download
  HVAC typical = furnace $91 + AC $44 = $135, so the $167 minimum applies; plus 12% surcharge. City of Portland, not Unincorporated Multnomah County.

### Minneapolis, MN
- Construction permit fees overview: https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/
- Building permit fees page (last updated Feb 27, 2026): https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/building/
  Official published table (Smartsheet): https://publish.smartsheet.com/5bac769dc10f49f7a65d69b39243a54f
  Formula: Building Permit Fee + Plan Review Fee (65% × building permit fee) + MN State Surcharge (value × 0.0005)
  Minimum city building fee $84.20 (excludes state surcharge)
  $2,001–$25,000: $104.20 first $2,000 + $20.60 each additional $1,000 or fraction
  $25,001–$50,000: $578.00 first $25,000 + $14.90 each additional $1,000 or fraction
  $50,001–$100,000: $950.50 first $50,000 + $10.60 each additional $1,000 or fraction
- Existing residential mechanical (last updated Feb 27, 2026): https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/existing-mechanical/
  Official table: https://publish.smartsheet.com/30df9b1453a34d73bb083600db33c2b1
  Level 1 $84.20; Level 2 (replace boiler/furnace) $132.40; Level 3 (entire system) $216.60; + $1.00 MN surcharge per application
- Plumbing permit fees (last updated Feb 27, 2026): https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/plumbing/
  Official table: https://publish.smartsheet.com/2fef8aaf1a294ca2a7b815ec6c2bf33b
  Minimum $85.20 including $1.00 state surcharge; full fixture / alteration lines $41.40
- Building permit application PDF (same valuation table; updated 12/16/24): https://www.minneapolismn.gov/media/-www-content-assets/documents/Building-Permit-Application.pdf
- Minneapolis Code of Ordinances Title 5 Ch. 91 (fee authority): https://library.municode.com/mn/minneapolis/codes/code_of_ordinances?nodeId=COOR_TIT5BUCO_CH91PEFE
- A 2019 worksheet still exists (https://www2.minneapolismn.gov/media/content-assets/www2-documents/departments/Building-Permit-Fee-Schedule-(pdf).pdf). **2019 city dollar tiers were not used.** The 2026 Smartsheet table supersedes those dollars. The 0.0005 state surcharge factor is unchanged.

### Raleigh, NC
- FY27 Development Fee Guide (July 1, 2026–June 30, 2027): https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf
- Fee guide + calculator: https://raleighnc.gov/permits/services/development-fee-guide-and-calculator
- FY27 guide announcement: https://raleighnc.gov/permits/news/fy27-development-fee-guide-now-online
- July 1, 2026 process changes (3.5% card fee): https://raleighnc.gov/permits/news/development-fee-changes-starting-july-1

### Chicago, IL
- Department of Buildings: https://www.chicago.gov/city/en/depts/bldgs.html
- 2026 Amended Building Permit Fee Tables, effective Jan 6, 2026: https://www.chicago.gov/content/dam/city/depts/bldgs/general/Permitfees/2026%20Amended%20Permit%20Fee%20Tables.pdf
  - Plan-based formula CF × RF × A; minimum **$602** (temporary structures $302)
  - Table 14A-12-1204.3(1) Group R-3/R-4/R-5 Type V construction factor **$0.44/sf**
  - Table 14A-12-1204.3(4): Level 1 alteration / in-kind single MEP min $600; roof with structural repair min $900; porch/deck installation min $250 per unit served
- Permit fee calculator (2026): https://www.chicago.gov/city/en/depts/bldgs/provdrs/permits/svcs/permit_fee_calculator.html
- 2026 DOB fee/program changes: https://www.chicago.gov/city/en/depts/bldgs/provdrs/bldg_code/alerts/2025/december/2026changes.html
- Work that does not need a permit: https://www.chicago.gov/city/en/sites/guide-to-building-permits/home/help/faq/DOB/bldg-permit-not-required/all.html
  - Group R ≤4 stories: steep-slope (≥2:12) reroof exempt; in-kind furnace/boiler/AC appliance replacement exempt
- Stand-alone fees, Table 14A-12-1204.2 (Municipal Code): https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2703439
  - Roof replacement $450 per area up to 5,000 sf; roof recover/repair $175
  - In-kind HVAC equipment $75 per equipment type per dwelling unit; new AC $150 per dwelling unit
  - New deck ≤6 ft $300 per structure; interior alteration ≤2,000 sf in one unit $500
- Express Permit eligibility: https://www.chicago.gov/city/en/sites/guide-to-building-permits/home/help/faq/DOB/EPP-eligible.html
- EPP still excludes brand-new decks as of 2026-09-01; new decks use the plan-based $602 floor

### Houston, TX
- Houston Permitting Center: https://www.houstonpermittingcenter.org/
- 2026 Building Code Enforcement Permit Fee Schedule: https://www.houstonpermittingcenter.org/media/2636/download
  - Administrative fee **$33.56**; minimum permit **$91.06** (plumbing min $97.56)
  - HVAC repairs/alterations: **2.0% of valuation + $47.00**, then min + admin
  - Complete AC system: **$11.41/ton + $47.00** (not used for the valuation totals)
  - 1–2 family structural: Type/sf tables pp. 4–8; repairs/alterations = **20% of new-construction fee** on aggregate sf
  - **Job A (2026-09-01) typical-job specs applied to the Type VB table:** reroof 1,000/1,500/1,800 sf → $167.31 / $230.78 / $266.67 (20% + min $91.06 + $33.56 admin; 1,500 sf uses Tier 3 after 1,224.89 sf). New deck 200/320/400 sf full Type VB + admin → $177.04 / $257.44 / $305.68. Kitchen structural 150/200/400 sf still on the $91.06+$33.56 = $124.62 floor. Plumbing/electrical stay in extras.
- 2026 CPI fee-increase notice (+1.3910% Jan 1, 2026): https://www.houstonpermittingcenter.org/news-events/2026-fee-increase-notice
- Mechanical/HVAC application CE-1017 (Jan 2026): https://www.houstonpermittingcenter.org/media/1271/download
- Plan review / exemptions: https://www.houstonpermittingcenter.org/building-code-enforcement/plan-review
- Residential Re-Roof worksheet CE-1109: https://www.houstonpermittingcenter.org/media/1801/download
- Roof covering ≤100 sf exempt (Houston IRC R105.2)

### Los Angeles, CA
- LADBS fee schedules: https://dbs.lacity.gov/faq/fee-schedules
- LAMC Table 1-A (Ord. 185,587; still the published table): https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-173237
  - $2,000.01–$20,000: $40.00 + $1.25 per $100 of **total** valuation
  - $20,000.01–$50,000: $170.00 + $6.00 per $1,000 of total valuation
  - $50,000.01–$100,000: $195.00 + $5.50 per $1,000 of total valuation
  - Plan check 90% of Table 1-A when plans are required (91.107.3.1.1)
  - Energy +10% of Table 1-A when Title 24 applies
- Express permits P/GI 2026-003 (eff. Jan 1, 2026, rev. Jun 10, 2026): re-roof Class A/B <6 psf; kitchen/bath no structural; HVAC swap
- HVAC Fee Sch. 3 (7/2017, still posted): https://dbs.lacity.gov/sites/default/files/efs/forms/pc17/mechanical-hvac-permit-fee-schedule.pdf
  - Two-or-more-items minimum $90; furnace $19; AC ≤25 HP $24
- City DSCS 3% (98.0410) + Systems 6% (98.0416); issuing 98.0415
- State SMIP 0.013% of valuation (R occupancy 1–3 stories); CBSC $1 per $25,000 (min $1)
- City of Los Angeles, not LA County BSD

### Dallas, TX
- Fees page: https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/Pages/FEES.aspx
- Permit Fee Schedule, effective July 1, 2025: https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/DSDFees%20%281%29.pdf
  - Table B-II (SF/duplex master alterations): **$181 per dwelling unit + $100 additional trade**
  - Table B-I (standalone trades): value × **0.009652 × 1.33**, min **$175**, plus **$125** inspection per trade
  - Technology **$15** (§303.5.29)
- Chapter 52: reroof ≤2 squares exempt; cabinets/finishes-only building-permit exempt; attached decks typically not exempt
- No Texas state building-permit surcharge

### Miami, FL
- City of Miami Building Permit Fee Schedule: https://www.miami.gov/Permits-Construction/Permitting-Resources/City-of-Miami-Building-Permit-Fee-Schedule
- Exhibit C (Resolution R-26-0200, Apr 23, 2026): https://www.miami.gov/files/assets/public/v/1/document-resources/pdf-docs/building/fee-schedule-exhibit-c-bldg-chpts-10-17-20-508.pdf
  - Residential ≤3 units: **0.50%** of estimated construction cost; minimum permit **$110**; application **$40**
  - Solid waste residential $0.22 per $100 (min $26, max $600); **roofing categorically exempt**
- City collects F.S. §553.721 (1% of permit, min $2) and F.S. §468.631 (1.5%, min $2) and Miami-Dade Code §8-12(e) $0.60 per $1,000
- City of Miami (folio prefix 01), not Miami-Dade RER IO 4-63
- SAVE 50% city-fee reduction for qualifying storm-proof work is **not** assumed in the totals

### Boston, MA
- ISD: https://www.boston.gov/departments/inspectional-services
- Building Fees PDF dated May 15, 2023 (still posted 2026-09-01): https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf
  - Short-form: **$20 + $10 per $1,000** of estimated cost
  - Long-form: **$50 + $10 per $1,000**
  - Sheet metal: $20 + $25 first 200 lin/sq ft
  - Gas furnace/heater: $20 + $50 each + $0.09 per 1,000 BTU
  - **Job A (2026-09-01):** typical like-for-like 3-ton (36 kBTU) AC/heat pump **plus 80 kBTU** mid-efficiency gas furnace; sheet-metal first 200 lin/sq ft only. Typical $77.20 + $45 = **$122.20**. Low 60 kBTU furnace + sheet-metal min = **$120.40**. High 120 kBTU furnace + sheet metal = **$125.80**. Electrical extra not dollarized.
- Repair A Roof (short-form): https://www.boston.gov/boston-permitting/repair/repair-roof
- Long-form (new decks): https://www.boston.gov/boston-permitting/permits/long-form-permits
- Kitchen/bath: https://www.boston.gov/boston-permitting/gut-or-renovate/renovate-bathroom-or-kitchen
- No Massachusetts building-permit surcharge on the ISD sheet

### Philadelphia, PA
- L&I fee index: https://www.phila.gov/documents/fees-for-li-permits-and-licenses/
- Construction fees effective Jan 1, 2025 (in force 2026-09-01): https://www.phila.gov/media/20260209092722/PG_012_INF_Summary-of-construction-permit-fees-Eff-1.1.2025-Rev-2.2026.pdf
  - 1–2 family roof covering replacement **$69**
  - Mechanical ductwork including appliances **$189**; appliance separate **$69 each**
  - New accessory structure **$75** first 500 sf
  - Alterations **$76** first 500 sf
  - Every permit: city **$3** + PA state **$4.50**
- Oct 1, 2026 PDF is published but **not yet effective**: https://www.phila.gov/media/20260729134349/PG_012_INF_Summary-of-construction-permit-fees-Eff-1.1.2025-Rev-7.2026.pdf
- Building permit + surcharges: https://www.phila.gov/services/permits-violations-licenses/apply-for-a-permit/building-and-repair-permits/get-a-building-permit/
- Cabinets/countertops-only are building-permit exempt (non-historic)

### San Diego, CA
- DSD fees hub: https://www.sandiego.gov/development-services/fees
- IB 501 Construction Permits–Structures (Aug 2026): https://www.sandiego.gov/development-services/forms-publications/information-bulletins/501
  - Table 501C Deck SDU/DUP/TH ≤500 sf: plan check **$1,677.99** + inspection **$264.25**
  - Deck pre-approved: PC **$1,148.29** + insp **$264.25**
  - Deck >500 sf: PC **$2,649.60** + insp **$440.82**
  - General Plan Maintenance **$737.00** when plan review is required; Mapping **$12.16**; collection **$17.11**; Building Standards min **$1**; seismic **$0.13 per $1,000** on 1–2 story residential
- IB 103 MEP (2026): https://www.sandiego.gov/development-services/forms-publications/information-bulletins/103
  - Table 1B SDU: furnace/FAU **$176.57**; condensing unit **$131.52**; air handler **$176.57**
  - Table 3A kitchen/bath remodel per dwelling unit **$440.82** (no-plan combo)
- IB 123 roof covering: like-for-like reroof with no structure/diaphragm change is **permit-exempt** (SDMC §129.0203(a)(16))
- City of San Diego, not the county

### Las Vegas, NV
- City of Las Vegas Building and Safety (not unincorporated Clark County)
- Fee tables: https://files.lasvegasnevada.gov/building-safety/Building-Safety-Fee-Tables.pdf
  - 2020 Building User Fees, effective **July 1, 2021** (still the posted tables)
  - Table 3-E #94 Re-roofing Residential: plan check **$68** + inspection **$119** + issuance **$55** = **$242**
  - Table 3-D #15 HVAC Exact change out: **$83 + $100 + $55** = **$238**
  - Table 3-E #20 Deck/Balcony: **$176 + $290 + $55** = **$521**
  - Table 3-A #68 R-3 remodel with MPEs (no interpolation): 200 sf PC $64 + insp $227 = $291 + issuance Table 3-E #2 $55 = **$346** typical/low (smallest published row). High = next published row 500 sf $127+$337+$55 = **$519**. No 150 sf row. Cabinets-only remains exempt.
- When a permit is required: https://files.lasvegasnevada.gov/building-safety/When-Do-I-Need-A-Permit.pdf
  - Non-tile covering replacement with no structural work and ≤64 sf sheathing is exempt
  - Deck permit if more than 30 inches above grade

### Washington, DC
- Department of Buildings: https://dob.dc.gov/
- Building Permit Fee Schedule: https://dob.dc.gov/node/1620346
  - Alteration/repair for V in $1,001–$1,000,000: **($30 + 0.02 × V) × 1.10** (12-M DCMR §§ 100.2, 101.1)
  - Green Building Fee on alterations: **0.0013 × V × 1.10**
  - Instant Mechanical up to 10 ton: **$46 × 1.10 = $50.60**
- Permit exemptions (12-A DCMR § 105.2): https://dob.dc.gov/page/get-permit
  - Like-kind roofing/coping exempt outside historic districts and floodplain
- Deck Permit FAQ: https://dob.dc.gov/node/1615961 (uses alteration formula **without** green)
- Instant Permits: https://dob.dc.gov/instantpermits
- One jurisdiction (District of Columbia)

### San Antonio, TX
- DSD / BuildSA: https://www.sanantonio.gov/DSD
- FY2026 Development Fee Schedule (Rev. October 2025), retrieved **2026-09-01** (CID-font PDF; line items from rendered pages): https://docsonline.sanantonio.gov/DSDUploads/CurrentFeeSchedule.pdf
  - p. 5 Flat Fees for Miscellaneous Residential Projects: Residential Re-roof Permit **$25.00**; Carports and Decks **$160.00**; General Repairs – Full Remodel **$210.00**
  - p. 16 Heating and Air Conditioning (Mechanical) Inspection Fees — Commercial and Existing Residential: Basic permit **$50.00** (online processing free); gas furnace **$9.60** each; condensing unit/heat pump/air handler/replacement device **$6.25** each. Existing-residential new-system line **$77.00** is **not** the like-for-like change-out path.
  - p. 12 Electrical Inspection Permit Fee (Basic) **$50.00**; p. 19 Plumbing Inspection (Basic) **$50.00**
  - Typical kitchen = Full Remodel $210 + electrical $50 + plumbing $50 = **$310**. Low building+one trade **$260**. High + mechanical basic **$360**.
  - Typical HVAC = $50 + $9.60 furnace + $6.25 condensing = **$65.85** (documented 3-ton + 80 kBTU furnace)
- Chapter 10 §10-38 valuation table (municode) is **not** used for covering-only reroof, decks, or like-for-like HVAC on this schedule. IB 141: https://docsonline.sanantonio.gov/FileUploads/dsd/IB141.pdf

### Fort Worth, TX
- Development Services: https://www.fortworthtexas.gov/departments/development-services
- Building Administrative Code §7-1 (Ord. 27191-09-2024 tables), retrieved **2026-09-01**: https://codelibrary.amlegal.com/codes/ftworth/latest/ftworth_tx/0-0-0-5697
  - §105.2 Building item 14: roof repairs on Group R-3 including repair/replacement of the material **above, but not including**, the decking/lathing/sheathing — typical like-for-like shingle reroof is **permit-exempt** ($0). High if sheathing is replaced: Table 1A-1 1 trade $112.50 + Table 1-B $31.50+$16.87 = **$160.87**
  - Table 1-H mechanical: furnace ≤100,000 BTU **$5.81**; condensing unit ≤2 ton **$5.81**; over 2 including 3 tons **$9.85**; over 3 including 5 tons **$15.68**. Plus Table 1-B application **$31.50** and technology **$16.87**. Typical furnace+3-ton = **$64.03**
  - Table 1-C-3 R-3 parenthetical rates (≤500 sf): **$58.10** first 65 sf + **$0.42** each additional sf + Table 1-B. Documented 200/320/400 sf → **$163.17 / $213.57 / $247.17**
  - Table 1A-1 kitchen remodel by trades: 2 = $225; 3 = $337.50; 4 = $450; plus Table 1-B **$48.37** → **$273.37 / $385.87 / $498.37**
- Posted Development Fees PDF (same ordinance; 403 from this host): https://www.fortworthtexas.gov/files/assets/public/development-services/documents/resources-applications-forms-videos/f/development-fees-schedule.pdf
- Fort Worth uses the Dallas-Fort Worth-Arlington BLS wage (same $27.03 May 2025 as Dallas)

### Tampa, FL
- Construction Services fees hub: https://www.tampa.gov/construction-services/fees
- Trade Permit Fee Schedule (updated 2/16/2023, effective Oct 1, 2018): https://www.tampa.gov/sites/default/files/document/2023/trade_permit_fee_schedule_02.16.23.pdf
  - Roofing 1-2 family **$177**; HVAC Equal Change-outs **$120**; Building/Electrical/Plumbing/Mechanical general **$120**
  - Kitchen: no kitchen-specific line. Low 2 trades **$248**; typical 3 trades (building+electrical+plumbing) **$372**; high 4 trades **$496** (each trade $120 + $4 surcharge)
- Miscellaneous Projects Permit Fee Schedule (updated 5/31/2020): https://www.tampa.gov/sites/default/files/content/files/migrated/miscellaneous_projects_permit_fee_schedule_5_31_20.pdf
  - Accessory Structure (gazebo, deck, pergola, shed) **$177**; Driveway, Patio Slab, Deck **$214**
- Florida Building Permit Surcharge 2.5% of permit value or **$4.00** minimum is **not** in the table values and **is added** (the Tampa PDF states to add it)

### Orlando, FL
- Permitting Development Fees — Residential (1 or 2 units), effective January 2026: https://www.orlando.gov/files/sharedassets/public/v/1/departments/edv/permitting-services-division/permitting-development-fees-residential-2026.pdf
  - BLD: $66.24 first $1,000 + $4.41 each additional $1,000 or fraction
  - MEC/ELE: $66.24 first $1,000 + $11.03 each additional $1,000 through $25,000, then $8.28
  - On BLD: Administrative Inspection Fund 1.5% (min $2); Operational Trust Fund 1% (min $2); Technology 3%; **5% concurrency surcharge is listed without restriction and is included** on reroof / deck / kitchen BLD totals
  - HVAC uses the MEC valuation formula + 3% technology only (AIF / concurrency / trust are BLD-only on this sheet)

### Jacksonville, FL
- Building Inspection Division: https://www.jacksonville.gov/departments/public-works/building-inspection-division
- Official fee tables: https://www.coj.net/fees (Ordinance Code §320.409)
  - Roofing: $10 per 1,000 sf; min $80 no inspection / **$150** with inspection; C&D $17.50. Documented 1,000/1,500/1,800 sf all stay on the $150 inspection min + $17.50 = **$167.50**
  - Mechanical: AC $11/ton (1–10 tons); furnace first 200 kBTU $22; mechanical minimum **$60**. Typical 3-ton + 80 kBTU furnace = $33+$22=$55 → **$60** min. High 5-ton + furnace + first 2,000 CFM ducts **$94**
  - Accessory exceptions: one-inspection path $75 + DS $25 + C&D $25 = **$125** (low); more-than-one-inspection BID min $112.50 + DS min $37.50 + C&D $25 = **$175** (typical/high 16×20)
  - Alterations: $3.00 per $1,000 + $0.65 resource + $1.00 DS + $0.90 C&D; BID min $112.50; landscape 12% of BID; plan review 67% of BID or $75
- Florida 2.5% surcharge (min $4) is **not** itemized on the COJ fee page and is **not** added

### Columbus, OH
- BZS 2026 Combined Development Related Fee Schedule: https://www.columbus.gov/files/sharedassets/city/v/13/building-and-zoning/fee-schedule/2026-combined-development-related-fee-schedule.pdf
  - 1-2-3 family: New/additions $1,100; Alterations/Accessory $385; MEP $275; Minor work $140; Roof/siding/windows/doors $140; Deck $350
- 2025 schedule (effective June 1, 2025) is archived; 2026 dollars are used
- Ohio 1% OBBS surcharge is **not** printed on the city PDF and is not added
- Portal: https://portal.columbus.gov/ca/

### Indianapolis, IN
- DBNS license and permit fees (updated Jan 5, 2026): https://www.indy.gov/activity/license-and-permit-fees
- Proposal 239, 2025 / Revised Code Ch. 536
  - Like-kind reroof by listed contractor exempt §536-201(b)(2)
  - HVAC §536-606: heating **or** cooling $153 ≤2,500 sf; combined heating and cooling $185 ≤2,500 sf; +$23 per additional 1,000 sf. Craft fees unchanged Jan 5, 2026
  - Deck exempt if floor ≤30 in §536-201(b)(15); typical 16×20 treated as permitted: accessory 201–1,000 sf $300 + application $40 + plan review $150 = $490
  - Class 2 remodel ≤1,000 sf $200 + application $40 + remodel plan review $150

### Sacramento, CA
- City of Sacramento CDD (not the county). CDD-0245 revised 07-12-2026: https://www.cityofsacramento.gov/content/dam/portal/cdd/Building/Forms/CDD-0245_Fees-and-Charges-on-Residential-Bldg-Permits.pdf
  - HVAC and Re-roof specific-cost **$175** + technology **10%** of permit (and plan review if any)
  - Valuation-maximum building permit + plan review table for decks/kitchens
  - Strong Motion 0.00013 × valuation (min $0.50); Green Building $1 per $25,000 (min $1); General Plan $2.60 per $1,000
  - SMIP listed on reroof; HVAC change-out totals omit SMIP

### Kansas City, MO
- City Planning & Development fee schedule: https://www.kcmo.gov/city-hall/departments/city-planning-development/building-and-development-fee-schedule
- Building Code Article 1 §18-20 one- and two-family: $0–$1,000 = $52; $1,001–$2,000 = $58; $2,001–$100,000 = $58 + $4.33 per additional $1,000 or fraction. Combined building/MEP fee
- Like-kind 1-2 family light reroof exempt (§18-16 / official exempt-work page) unless sheathing/structure
- KCMO (Jackson County), not Kansas City, Kansas

### Detroit, MI
- BSEED Fee Schedule effective Jan 1, 2024, modified July 18, 2025: https://detroitmi.gov/sites/detroitmi.localhost/files/2026-08/Fee%20Schedule.Effective_January_1_2024_Modified%20July%2018%2C%202025.pdf
  Landing page: https://detroitmi.gov/document/fee-schedulejan12024
  - Building/residential: ≤$2,000 = $271.43; $2,001–$25,000 = $271.43 + $34.09 per $1,000 over $2,000; $25,001–$100,000 = $1,055.57 + $24.53 per $1,000 over $25,000
  - 35% building plan-review is a **deposit** toward the permit, not an add-on
  - HVAC uses gas-fired installation (burner ≤500,000 BTU **$142**) and remote refrigeration **$130** per motor, not the valuation table
- Portal: https://permits.detroitmi.gov

---

## National 2026 project costs (materials + labor, not permit)

- Roof replacement [2026 Data], updated Mar 5, 2026: https://www.angi.com/articles/how-much-does-roof-replacement-cost.htm
  - Average $9,607; $5,902–$46,000; $4–$11/sf; asphalt $5,800–$20,000
- HVAC replacement [2026 Data], updated Aug 3, 2026: https://www.angi.com/articles/insider-s-price-guide-new-heating-and-cooling-system.htm
  - Average $7,500; $5,000–$22,000; labor ~$1,500
- Deck building [2026 Data]: https://www.angi.com/articles/how-much-does-it-cost-build-deck.htm
  - Average $8,316; $4,340–$12,652; $30–$60/sf; labor $15–$35/sf
- Kitchen installation [2026 Data], updated Aug 3, 2026: https://www.angi.com/articles/kitchen-prices-how-much-does-it-cost-build-kitchen.htm
  - Remodel $75–$250/sf; average remodel $14,600–$41,300; labor ~25%

---

## BLS wage index (city adjustments)

National construction-and-extraction mean hourly wage, May 2025: **$31.42**
https://www.bls.gov/news.release/archives/ocwage_05152026.htm

| City | Metro | Construction mean $/hr | Vintage | Source |
|---|---|---:|---|---|
| Seattle | Seattle-Tacoma-Bellevue, WA | 42.11 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_seattle.htm |
| Charlotte | Charlotte-Concord-Gastonia, NC-SC | 27.54 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_charlotte.htm |
| Austin | Austin-Round Rock-San Marcos, TX | 26.75 | May 2024 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_austin.htm (vs national May 2024 construction $30.73) |
| Denver | Denver-Aurora-Centennial, CO | 33.00 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_denver.htm |
| Phoenix | Phoenix-Mesa-Chandler, AZ | 29.42 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_phoenix.htm |
| Nashville | Nashville-Davidson--Murfreesboro--Franklin, TN | 28.56 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_nashville.htm |
| Atlanta | Atlanta-Sandy Springs-Roswell, GA | 28.26 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_atlanta.htm |
| Portland | Portland-Vancouver-Hillsboro, OR-WA | 39.44 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_portlandor.htm |
| Minneapolis | Minneapolis-St. Paul-Bloomington, MN-WI | 37.82 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_minneapolis.htm |
| Raleigh | Raleigh-Cary, NC | 27.66 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_raleigh.htm |
| Chicago | Chicago-Naperville-Elgin, IL-IN | 40.87 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_chicago.htm |
| Houston | Houston-Pasadena-The Woodlands, TX | 27.41 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_houston.htm |
| Los Angeles | Los Angeles-Long Beach-Anaheim, CA | 37.07 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_losangeles.htm |
| Dallas | Dallas-Fort Worth-Arlington, TX | 27.03 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_dallasfortworth.htm |
| Miami | Miami-Fort Lauderdale-West Palm Beach, FL | 27.95 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_miami.htm |
| Boston | Boston-Cambridge-Newton, MA-NH | 39.88 | May 2025 | https://www.bls.gov/regions/northeast/news-release/occupationalemploymentandwages_boston.htm |
| Philadelphia | Philadelphia-Camden-Wilmington, PA-NJ-DE-MD | 34.78 | May 2025 | https://www.bls.gov/regions/mid-atlantic/news-release/occupationalemploymentandwages_philadelphia.htm |
| San Diego | San Diego-Chula Vista-Carlsbad, CA | 36.54 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sandiego.htm |
| Las Vegas | Las Vegas-Henderson-North Las Vegas, NV | 32.53 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_lasvegas.htm |
| Washington | Washington-Arlington-Alexandria, DC-VA-MD-WV | 32.76 | May 2025 | https://www.bls.gov/regions/mid-atlantic/news-release/occupationalemploymentandwages_washingtondc.htm |
| San Antonio | San Antonio-New Braunfels, TX | 25.94 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_sanantonio.htm |
| Fort Worth | Dallas-Fort Worth-Arlington, TX | 27.03 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_dallasfortworth.htm |
| Tampa | Tampa-St. Petersburg-Clearwater, FL | 26.69 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_tampa.htm |
| Orlando | Orlando-Kissimmee-Sanford, FL | 26.37 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_orlando.htm |
| Jacksonville | Jacksonville, FL | 26.78 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_jacksonville.htm |
| Columbus (OH) | Columbus, OH | 33.55 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_columbusoh.htm |
| Indianapolis | Indianapolis-Carmel-Greenwood, IN | 32.24 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_indianapolis.htm |
| Sacramento | Sacramento-Roseville-Folsom, CA | 36.45 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sacramento.htm |
| Kansas City (MO) | Kansas City, MO-KS | 33.56 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_kansascity.htm |
| Detroit | Detroit-Warren-Dearborn, MI | 33.06 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_detroit.htm |

Metro index landing page: https://www.bls.gov/oes/current/oessrcma.htm

---

## Deck materials

Coverage/spacing are IRC-style construction defaults (16 in OC, 5/4×6 actual 5.5 in width), not a price survey.

Retail lumber/composite board prices were **not** cited. Defaults in `deck-materials.json` are labeled `default, edit me`.

---

## Intentionally unused as cited sources

- Third-party permit calculators (pointer only; we cite the city's published schedule)
- Secondary permit blogs (not used for dollars)
- Aggregator cost sites (not used as primary cost numbers; 2026 published industry ranges were preferred)
