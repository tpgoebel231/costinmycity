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

Populations used (July 1, 2025): Los Angeles 3,869,089; Chicago 2,731,585; Houston 2,397,315; Phoenix 1,665,481; Philadelphia 1,574,281; San Antonio 1,548,422; San Diego 1,406,106; Dallas 1,329,491; Fort Worth 1,028,117; Jacksonville 1,017,689; Austin 1,002,632; San Jose 989,814; Charlotte 964,784; Columbus (OH) 938,396; Indianapolis city (balance) 901,116; San Francisco 826,079; Seattle 784,777; Denver 740,613; Nashville-Davidson 721,074; Oklahoma City 719,849; Washington 693,645; El Paso 683,012; Las Vegas 679,817; Boston 672,973; Detroit 649,095; Louisville/Jefferson County metro government (balance) 641,962; Portland 635,109; Memphis 609,647; Baltimore 569,997; Milwaukee 562,407; Albuquerque 556,588; Fresno 555,549; Tucson 548,371; Sacramento 536,449; Atlanta 529,110; Kansas City (MO) 521,220; Mesa 513,656; Raleigh 506,306; Colorado Springs 494,743; Miami 489,812; Omaha 488,797; Virginia Beach city 453,737; Long Beach 450,469; Oakland 440,838; Minneapolis 430,324; Bakersfield 422,165; Tulsa 416,209; Tampa 413,554; Aurora (CO) 410,053; Arlington (TX) 402,134; Wichita 400,987; Cleveland 363,608; New Orleans 362,154; Urban Honolulu CDP 341,868; Anaheim 341,008; Orlando 333,888; Riverside 323,057; Cincinnati 314,367; Pittsburgh 307,632; Plano 293,028; Madison 286,233; St. Louis city 278,144; Chula Vista 275,533; Boise City city 238,429; Richmond city 237,257; Spokane 230,783; Salt Lake City 218,428; Des Moines 212,086; Grand Rapids 201,183; Providence 195,310.

Official Census CSV used for the 10 cities added 2026-09-01, the next 10 added the same day, the 10 added after that, and the 10 added after that: https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/cities/totals/sub-est2025.csv (Vintage 2025, POPESTIMATE2025, SUMLEV 162). Indianapolis is **Indianapolis city (balance)** 901,116, not the 910,638 consolidated-city total. Kansas City is **Kansas City city, Missouri** 521,220, not Kansas City, Kansas. Louisville is **Louisville/Jefferson County metro government (balance)** 641,962, not the 795,222 consolidated-city total (SUMLEV 170). Virginia Beach is **Virginia Beach city, Virginia** (independent city) 453,737. Arlington is **Arlington city, Texas** 402,134, not Arlington County, Virginia. New Orleans is **New Orleans city, Louisiana** 362,154. Honolulu uses **Urban Honolulu CDP, Hawaii** 341,868 (SUMLEV 162), not Honolulu County 988,703. St. Louis is **St. Louis city, Missouri** (independent city) 278,144, not St. Louis County. Aurora is **Aurora city, Colorado** 410,053 (Arapahoe 344,658 / Adams 61,110 / Douglas 4,285). Wichita is **Wichita city, Kansas** 400,987, not Kansas City, Kansas. Plano is **Plano city, Texas** 293,028 (Collin 287,323 / Denton 5,705). Madison is **Madison city, Wisconsin** 286,233. Chula Vista is **Chula Vista city, California** 275,533. Boise is **Boise City city, Idaho** 238,429. Richmond is **Richmond city, Virginia** (independent city) 237,257. Spokane is **Spokane city, Washington** 230,783, not Spokane Valley. Salt Lake City is **Salt Lake City city, Utah** 218,428. Des Moines is **Des Moines city, Iowa** 212,086, not West Des Moines. Grand Rapids is **Grand Rapids city, Michigan** 201,183. Providence is **Providence city, Rhode Island** 195,310.

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
- Long Beach uses the Los Angeles-Long Beach-Anaheim BLS wage (same $37.07 May 2025 as Los Angeles)
- Mesa uses the Phoenix-Mesa-Chandler BLS wage (same $29.42 May 2025 as Phoenix)
- Oakland uses the San Francisco-Oakland-Fremont BLS wage (same $43.66 May 2025 as San Francisco)
- Arlington (TX) uses the Dallas-Fort Worth-Arlington BLS wage (same $27.03 May 2025 as Dallas / Fort Worth)
- Long Beach uses the Los Angeles-Long Beach-Anaheim BLS wage (same $37.07 May 2025 as Los Angeles)
- Mesa uses the Phoenix-Mesa-Chandler BLS wage (same $29.42 May 2025 as Phoenix)
- Oakland uses the San Francisco-Oakland-Fremont BLS wage (same $43.66 May 2025 as San Francisco)
- Arlington (TX) uses the Dallas-Fort Worth-Arlington BLS wage (same $27.03 May 2025 as Dallas / Fort Worth)

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

### San Jose, CA
- PBCE Building Permit Fees landing page (FY 2026-27 Building and Structure Permits Fee Schedule effective **August 10, 2026**): https://www.sanjoseca.gov/buildingfees
  Official PDF: https://www.sanjoseca.gov/home/showpublisheddocument?id=26047 (host 403 on direct download from this environment on 2026-09-01; line items extracted from the official indexed PDF text)
  - Permit issuance **$211/hr**; plan review **$325/hr**; inspection **$315/hr**. Online issuance minimum is 50% of the specified processing fee.
  - Re-Roof, Residential: issuance **$105**; plan review if required; inspections **$236** for up to 2 plus **$157** per ½ hour additional
  - Exterior/site alterations (including balconies and decks): base issuance **$211** and base plan review **$325** (inspection dollar not extracted)
  - SFR addition/alteration 0–750 sf: issuance **$211** + plan review **$1,137** + inspection **$1,732**
  - Residential mechanical fixture-minute table extracted from the official FY 2026-27 PDF on **2026-09-01**: Cooling Tower 60/50; Exhaust Hood 90/60; Furnace, New 60/50; Furnace, Replacement 50/40; **Furnace, Replacement SFR 50/40**; Product Conveying 70/50; Spray Booth 70/50. Unlisted items default **30 minutes** (20 min per unit if more than 1). No AC line is printed. HVAC typical uses Furnace Replacement SFR 50 min + unlisted AC 30 min + online issuance 50% of $211.
- Portal: https://permits.sanjoseca.gov
- City of San Jose PBCE, not Santa Clara County
- A FY 2025-26 archive.org snapshot of an older 26047 file was **not** used for dollars

### San Francisco, CA
- DBI fees hub: https://www.sf.gov/resource--fees-department-building-inspection
- Table 1A-A Building Permit Fees, effective July 12, 2026: https://media.api.sf.gov/documents/Table_1A-A_-_Building_Permit_Fees_2026.pdf
  - $2,001–$50,000: plan review $310 + $28.35 per additional $1,000; issuance $266 + $8.56 per additional $1,000
  - $50,001–$200,000: plan $1,617 + $15.60 per additional $1,000; issuance $677 + $4.83 per additional $1,000
- Table 1A-G Inspections, Surveys and Reports: https://media.api.sf.gov/documents/Table_1A-G_-_Inspection_Survey_and_Reports_2026.pdf
  - Re-roofing, single-family homes and duplexes **$320**; all others $556
- Table 1A-C Plumbing/Mechanical: https://media.api.sf.gov/documents/Table_1A-C_-_Plumbing_Mechanical_2026.pdf
  - Category 1P single residential kitchen/bath remodel **$290**
  - Category 1M single residential mechanical gas appliance (furnace, hydronic, heat pump) **$290**
- Table 1A-E Electrical: https://media.api.sf.gov/documents/Table_1A-E_-_Electrical_Permit_Issuance_and_Inspection_2026.pdf (up to 10 outlets $305; extra, not in kitchen typical)
- City and County of San Francisco DBI

### El Paso, TX
- FY 2026 Schedule C (Planning & Inspections): https://www.elpasotexas.gov/assets/Documents/CoEP/Planning-and-Inspections/misc/Current-FY-Schedule-C.pdf
  - Roofing Permit **$118** plus applicable technology fee
  - Mechanical base **$110**; combination heating-cooling / refrigeration **$47 + $6.35/ton**; furnace **$24**
  - One-inspection building permit **$110**; two-inspection **$160**; electrical/plumbing bases **$110**
  - Residential new/addition per-sf table ($0.87–$0.61) is for SFR additions/new, **not** used for reroof/deck/kitchen
  - Technology-fee **rate is not printed**; not added
- Portal: https://aca-prod.accela.com/ELPASO/Default.aspx
- City of El Paso Planning and Inspections, not El Paso County

### Oklahoma City, OK
- Municipal Code Chapter 60 (Ord. 27,978, fees effective **July 1, 2026**): https://library.municode.com/ok/oklahoma_city/codes/code_of_ordinances
  - §60-12-7 alterations/repair: **$6.00 per $1,000**, minimum **$75**
  - §60-12-6 plan review **does not apply** to 1-2 family
  - §60-12-1 OUBCC collection **$0.50** per permit (59 O.S. § 1000.25 state dollar is **not** printed on the city schedule and is not added)
  - §60-29-16: forced-air heating **$31**; Class E refrigeration ≤4 tons **$31**; Class D 5–25 tons **$46**
- Development Services / building-trade permits: https://www.okc.gov/Services/Permits/Building-Trade-Permits
- Card 2.7% service fee is not assumed

### Baltimore, MD
- Baltimore City Building, Fire, and Related Codes §109 (DHCD, not Baltimore County): https://codes.baltimorecity.gov/us/md/cities/baltimore/code/building-codes/II/109
  - §109.5.7 application: 1-2 family **$25** no plans / **$125** with plans
  - §109.6.1(c) 1-2 family alterations **$0.30/sf** affected GFA, min **$50**; exterior-only exception **$10 per $1,000**, min $50
  - §109.6.1(b) accessory structure ≤100 sf **$25**; over 100 sf **$50**
  - §109.6.3(a) fuel-burning ≤200,000 BTU **$30**; (b) AC **$5/ton**, min **$30**; replacement same as new
  - §109.7 Building Code Permit Tax **5%** of the permit, rounded up to the next dollar
  - §109.3 fees rounded to the nearest dollar
- Portal: https://aca-prod.accela.com/BALTIMORE/Default.aspx

### Milwaukee, WI
- DNS Permit & Development Center fee combo (MCO 200-33), updated 2026: https://city.milwaukee.gov/ImageLibrary/Groups/dnsAuthors/permits/Documents/DevCenterFeeCombo.pdf
  - 1-2 family alterations/repairs building permit **1.6% of construction cost**, min **$150**
  - Deck plan exam **$50**; accessory >150 sf building **$0.45/sf**
  - Alteration plan exam **$0.25/sf**, min **$125**
  - HVAC: furnace ≤150,000 BTU **$55**; AC ≤3 tons **$60**; +$10/ton over 3; distribution **$2 per 100 sf**, min **$50**
  - Training & technology surcharge **1.6%**; processing **$20** building / **$25** HVAC
- Portal: https://milwaukee.gov/permits
- City of Milwaukee DNS, not suburban Milwaukee County

### Memphis, TN
- Memphis and Shelby County CCE permit-fees letterhead (1-2 family): https://www.shelbycountytn.gov/DocumentCenter/View/35065/6-Permit-fees-letterhead
  - Alteration/repair **$5 per $1,000**, min **$50**, max **$325**
  - Decks/spas/similar **$50**
  - Plan review up to 2,500 sf **$125** (not added to kitchen typical)
- Mechanical table still posted as 2019 CCE schedule: https://www.shelbycountytn.gov/DocumentCenter/View/33930/New-Fee-Schedule-2019
  - M-0 issuance **$20**; M-3.1 **$15** first $1,000 + **$8** each additional; SFR min **$1,000/ton**
- Building Code Appendix A: https://www.shelbycountytn.gov/DocumentCenter/View/33921/01-Building-Code-final-approved
- Portal: https://www.develop901.com/
- Joint city/county CCE issues Memphis **city** permits (same office as unincorporated Shelby County)

### Louisville, KY
- Louisville Metro Construction Review permit fees: https://louisvilleky.gov/government/construction-review/permit-fees
  - No building permit fee calculated under this section shall be less than **$75**
  - Residential 1 & 2 family **$0.105/sf** (new construction / additions / full building alterations)
  - Partial alterations / work where sf cannot be calculated: **$50 + $2.50 per $1,000**
  - HVAC 1-2 family new or replacement: **$105** first system, **$50** each additional (heating, cooling, or combination)
- Louisville-Jefferson County Metro Government (not unincorporated Jefferson County as a separate issuer)

### Albuquerque, NM
- 2024 Uniform Administrative Code (posted Building Safety tables): https://www.cabq.gov/planning/documents/2024-uac-adopted.pdf
  - Table 112-A 1-2 family regional modifier **0.50** (min $23.50); plan review **65%** of 112-A
  - $2,001–$25,000: $69.25 + $14.00 per additional $1,000; $25,001–$50,000: $391.75 + $10.10 per additional $1,000; $50,001–$100,000: $643.75 + $7.00 per additional $1,000
  - Table 112-G residential re-roof **$70** (admin $30 + inspection $40); modifier 1.0; 65% plan review does **not** apply to 112-G
  - Table 112-C mechanical: admin **$47**; item 7 repair/alteration of heating or cooling unit **$16** each
  - Cabinets/countertops-only exempt (109.2.1(8)); all re-roofs require a permit (109.1)
- Building Safety: https://www.cabq.gov/planning/building-safety-division

### Tucson, AZ
- FY27 Planning and Permitting Fee Schedule, effective **July 1, 2026**: https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf
  Landing: https://www.tucsonaz.gov/Departments/Planning-Development-Services/Fees/Fee-Schedule
  - Table 4-02.4 Construction Valuation: $1–$2,000 **$89.45**; $2,000.01–$25,000 **$89.45 + $22.95** per additional $1,000; $25,000.01–$50,000 **$617.30 + $16.83**; $50,000.01–$100,000 **$1,038.05 + $9.64**
  - Trade permits (4-02.9): **$150** first item + **$50** each additional; HVAC change-out is item F (AC/heater repair/replace, max 2)
  - Digital filing **1%** of the total fee, minimum **$18.54**
- City of Tucson PDSD, not unincorporated Pima County

### Long Beach, CA
- Building Permit & Plan Check Fees, effective **May 20, 2026**: https://www.longbeach.gov/globalassets/lbcd/media-library/documents/building--safety/fee-schedules/building-permit--plan-check-fees
  - Valuation: $2,001–$20,000 = **$149** + **$16** per additional $1,000; $20,001–$50,000 = **$441** + **$11** per additional $1,000; $50,001–$100,000 = **$786** + **$10** per additional $1,000
  - Standard plan check **85%** of building permit, min **$154**
  - Processing **$115**/application; records **5%** of permit, min **$35**
  - SMIP 1–3 story residential **$0.13 per $1,000** (min $0.50); CBSC **$1 per $25,000** (min $1)
- Mechanical Permit & Plan Check Fees, effective **Oct 1, 2025**: https://longbeach.gov/globalassets/lbcd/media-library/documents/building--safety/fee-schedules/mechanical-permit--plan-check-fees
  - Minimum **$100**/permit; FAU **$15**; comfort-cooling compressor ≤25 hp **$16**
- City of Long Beach Building and Safety, not LADBS / LA County

### Mesa, AZ
- Citywide Fees & Charges landing: https://www.mesaaz.gov/Government/Management-Budget/Citywide-Fees-Charges
  Development Services PDF (updated for **July 2026**): https://www.mesaaz.gov/files/assets/public/v/5/government/omb/fees-charges/development-services-fees.pdf
  - Residential Rate Table (includes P/M/E): $0–$8,333 **$220**; $8,334–$16,667 **$330**; $16,668–$24,999 **$440**; $25,000–$200,000 **$500 + $6** per $1,000 over $25,000
- City of Mesa, not Phoenix and not unincorporated Maricopa. Portal DIMES.

### Fresno, CA
- Master Fee Schedule posted July 2026 (fees effective **July 1, 2025**, MFS Amendment #585): https://www.fresno.gov/wp-content/uploads/2026/07/FY-2026-MFS-ED-2025.06.30-10w1678.pdf
  - Re-roofing other roofs first 10 squares: plan check **$99.49** + inspection **$100.71**; each additional 10 squares inspection **$29.12**
  - Deck/patio non-engineered: PC **$230.53** + insp **$258.43**; engineered PC **$649.12** + insp **$258.43**
  - Residential remodel first 500 sf: PC **$220.81** + insp **$474.41**
  - Stand-alone MEP issuance **$26.23**; simple mechanical **$107.99**; FAU <100,000 Btu/h **$172.29**
  - General Plan surcharge **12.83%**; Technology-Entitlement Processing **$23.04**; CBSC **$1** at $1–$25,000
- City of Fresno, not Fresno County

### Colorado Springs, CO (PPRBD)
- PPRBD fee schedule: https://www.pprbd.org/Information/FeeSchedule
  - Table A.1 asphalt shingle reroof **$135** (1–2 family / townhomes)
  - Table A $2,001–$25,000: **$80** + **$8** per additional $1,000; $25,001–$50,000: **$264** + **$8**; $50,001–$100,000: **$464** + **$5**
  - Plan examination **28%** of building permit
  - Table B.1 1–2 family alteration trade attachment **$50** each
  - Individual residential mechanical: AC condensing unit replacement **$30**; furnace / AC installation **$50**; furnace with vent **$75**
- Pikes Peak Regional Building Department issues Colorado Springs building permits (not a different county issuer). 2026 PPRBD budget did not propose fee increases.

### Omaha, NE
- Permits and Inspections fees / Table 43-91: https://permits.cityofomaha.org/fees
  Omaha Municipal Code §43-91
  - $1–$2,000 **$41**; $2,000–$25,000 **$41 + $9.53** per additional $1,000; $25,001–$50,000 **$260.19 + $6.44**; $50,001–$100,000 **$421.19 + $3.19**
  - Roofing/siding ≥200 sf requires a permit; cabinets/countertops-only do not
  - Technology-fee chart is posted; dollars **not extracted**
- City of Omaha, not Council Bluffs

### Virginia Beach, VA
- Residential Building Permit Fees, rev. **Jul-2025**: https://s3.us-east-1.amazonaws.com/virginia-beach-departments-docs/planning/Divisions-Offices/Permits_Inspections/Documents/Residential-Permit-Fees.pdf
  - Alterations **$50 + $5 per $1,000**
  - Non-heated new/additions **$50 + $4 per 100 sf**
  - Plan review **$100**; counter **$25**
  - **2%** Virginia state levy on listed permit fees; **$10** technology fee on all permits
- City of Virginia Beach (independent city), not Norfolk/Chesapeake

### Oakland, CA
- FY 2026-27 Master Fee Schedule, effective **July 1, 2026**: https://www.oaklandca.gov/files/assets/city/v/2/finance/documents/financial-reporting/master-fee-schedules/fiscal-year-2026-27-adopted-mfs.pdf
  - Re-roof permit (up to 2 inspections) **$268.64**
  - Online building permit filing **$112.83**
  - R-3 repairs/additions/alterations: plan review **$17.08 per $1,000** (min **$335.81**); inspection **$26.11 per $1,000** (min **$335.81**)
  - R-3 mechanical inspection **$4.36 per $1,000** (min **$335.81**)
- City of Oakland Planning and Building, not unincorporated Alameda

### Tulsa, OK
- Title 49 Ch. 3 building permit fees (Ord. **25351**, July 17, 2024): https://library.municode.com/OK/Tulsa/codes/Code_of_Ordinances?nodeId=COOR_TIT49ADPELIFE_CH3BUPEFE_S302BUPEFE
  - Building permit: $0–$5,000 **$133**; $5,000.01–$40,000 **$213**; then **$6 per $1,000** through $150,000
  - Application fee is credited against the building permit fee
  - Mechanical: heating appliance **$35**; refrigeration/chiller **$47**; duct systems **$35**
  - Chapter 1 administrative fees are required; the Chapter 1 dollar table was **not extracted**
- City of Tulsa, not Tulsa County

### Arlington, TX
- Phase 2 fee schedule effective **Oct 1, 2025**: https://www.arlingtontx.gov/files/assets/city/v/2/planning-and-development-services/documents/permitting-amp-inspections/phase-2-proposed-fee-changes.pdf
  Landing: https://www.arlingtontx.gov/Business/Planning-Development/Planning-Development/Permitting-Inspections/Permit-Fees-Calculator
  - Residential reroof **$325**; patio cover / screened porch / gazebo & decks **$300**
  - Addition/alteration/remodel/repairs: Table 2 with **$325** minimum
- Planning and Development Services Fee Schedule, Resolution **26-151**, effective **June 1, 2026**, retrieved **2026-09-01**: https://www.arlingtontx.gov/files/assets/city/v/4/planning-and-development-services/documents/permit-applications-amp-forms/planning-and-development-services-fee-schedule.pdf
  - **Table 2** Residential Building Permit Fee — Based on Square Feet: **0–500 sf = $1.00 per square foot or $300.00 (whichever is greater)**; later brackets $500 + $0.75/sf and $875 + $0.50/sf were not needed for a 150/200/400 sf kitchen
  - Addition, Alteration, Remodel & Repairs: Table 2 with a **$325.00** minimum
  - Mechanical/electrical/plumbing trades **$100** minimum
- City of Arlington, not Fort Worth and not Dallas. No Texas state building-permit surcharge.

### New Orleans, LA
- Building permit fee estimator / Safety and Permits: https://nola.gov/building-permit-fee-estimator/
  One Stop: https://onestopapp.nola.gov/
  - Building permit **$60 + $5 per $1,000** of construction value
  - Plan review, when required, **$1 per $1,000** (min **$60**)
  - Historic district / Vieux Carré **50%** surcharge is **not assumed**
- City of New Orleans Safety and Permits, not Jefferson Parish

### Cleveland, OH
- Permit fee schedule (city recreation of Building & Housing fees, effective **January 2, 2014**), retrieved **2026-09-01**: https://www.clevelandohio.gov/city-hall/departments/building-housing/divisions/construction-permitting/permit-fee-schedule
  Amlegal §3105.25: https://codelibrary.amlegal.com/codes/cleveland/latest/cleveland_oh/0-0-0-19698
  - 1–2–3 family alterations/repairs: **$5.00 per $1,000** or fraction, min **$30**
  - Plan examination **$20** per 1,000 sf, min **$20** (projects without floor area, including roofs)
  - Residential zoning **$20** added to building fees
  - HVAC 1–2–3 family: min **$50**; each central heating and/or AC system **$50**
  - Electrical min **$50**; plumbing min **$50**
  - Ohio **1%** OBBS surcharge on 1–2–3 family permit fees is printed and is added
- City of Cleveland, not inner-ring suburbs and not Cuyahoga County unincorporated

### St. Louis, MO
- Building permit fees, retrieved **2026-09-01**: https://www.stlouis-mo.gov/government/departments/public-safety/building/permits/building-permits/building-permit.cfm
  Portal: https://www.stlcitypermits.com/
  - Application **$25**; $0–$1,000 total **$44**; $1,001–$2,000 **$48**; $2,001–$3,000 **$55**; over $3,000: **$25 + $10 per $1,000** or fraction
- Mechanical permit fees (Ordinance 70800), retrieved **2026-09-01**: https://www.stlouis-mo.gov/government/departments/public-safety/building/permits/mechanical-permit-fees.cfm
  - Application **$25**; residential R3 furnace **$40**; condensing unit **$40**; combination furnace/condensing unit **$40**
- Electrical permit fees (Ordinance 70802): https://www.stlouis-mo.gov/government/departments/public-safety/building/permits/electrical-permit-fees.cfm
  - Application **$25**; residential repair/modify **$60** first unit
- City of St. Louis Building Division (independent city), **not** St. Louis County

### Pittsburgh, PA
- PLI 2026 Fee Schedule, effective **Jan 1, 2026**, retrieved **2026-09-01**: https://www.pittsburghpa.gov/files/assets/city/v/1/pli/documents/fees/2026-fee-schedule-final-2.pdf
  Fees hub: https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/Fees
  - Residential construction permits (all types): **$6.00 per $1,000** of construction value, min **$130**, max **$8,000**
  - PA SETF **$4.50** per permit (Act 37 of 2017)
  - Digital record retention **$5.00** per permit
  - Technology fee on the base: **$2** ($0–$200), **$5** ($201–$1,000), **$15** ($1,001–$10,000), **$25** ($10,001+)
- Plumbing is Allegheny County Health Department, **not** added
- City of Pittsburgh, not Allegheny County

### Cincinnati, OH
- Permit costs / 2027 fee schedule effective **July 1, 2026**, retrieved **2026-09-01**: https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/permit-costs/
  Adjustment notice: https://www.cincinnati-oh.gov/buildings/display-objects/banners/2027-fee-schedule-adjustment/
  - Technology **3%**, training **1%**, planning **5%** on construction/plumbing/HVAC, financial recovery **1%**, Ohio **1%** on 1–2–3 family
  - July 1, 2026 **dollar table was not extracted** (host TLS/403 from this environment). Re-attempted **2026-09-01**: official PDF https://www.cincinnati-oh.gov/sites/buildings/assets/FEE-SCHEDULE-FY-2027---Saved.pdf still TLS EOF; archive.org CDX has **no snapshot** of that FY 2027 file; municode node did not return the dollar table. A July 1, 2025 OCR was **not** used. Typical dollars left **null**.
- City of Cincinnati, not Hamilton County and not Northern Kentucky cities

### Honolulu, HI
- DPP Building Permit Fee Calculator / ROH 18-6.1 and 18-6.2 Table 18-A, retrieved **2026-09-01**: https://www.honolulu.gov/dpp/permitting/building-permits-home/bp-fee-calc/
  Official calculator math: `ceil(valuation / increment) × incrementFee + baseFee`; plan review **20%** of the building permit, cap **$25,000**
  - $0.01–$500: **$20**
  - $500.01–$1,000: **$8 + $2.50 per $100** of total valuation
  - $1,000.01–$20,000: **$12 + $2.20 per $100**
  - $20,000.01–$50,000: **$82 + $18 per $1,000**
  - $50,000.01–$100,000: **$286 + $14 per $1,000**
- ROH 18-3.1 similar-material repairs ≤$10,000 in 12 months can be exempt; assumed typical reroof $12,000 exceeds that
- City and County of Honolulu, not other Hawaiian counties. Population is Census **Urban Honolulu CDP** (SUMLEV 162)

### Anaheim, CA
- Mechanical Permit Application B713 (**AUG 2026**), retrieved **2026-09-01**: https://www.anaheim.net/DocumentCenter/View/39695/Mechanical-Permit-Application---B713
  - Minimum permit **$188**; FAU/heating appliance **$95**; condenser **$49**; air-handling unit **$95**
- FY 2026-27 Building Services miscellaneous items, retrieved **2026-09-01**: https://www.anaheim.net/DocumentCenter/View/71383/_FY-2026-27-Proposed-Fees-Combined-Final
  AUG 2026 applications already use the **$188** minimum (proposed column)
  - Re-roofing lightweight w/o structural up to 3,000 sf **$375**
  - Balcony or deck up to 300 sf **$543**; additional **$122** per 100 sf
  - Residential remodel <200 sf **$519**; additional **$184** per 100 sf
- City of Anaheim, not LA City and not unincorporated Orange County
- Anaheim uses the Los Angeles-Long Beach-Anaheim BLS wage (same $37.07 May 2025 as Los Angeles / Long Beach)

### Riverside, CA
- Building & Safety Fee Schedule (created **6/18/25**), retrieved **2026-09-01**: https://www.riversideca.gov/cedd/sites/riversideca.gov.cedd/files/BUILDING%20&%20SAFETY%20FEE%20SCHEDULE.pdf
  - Permit issuance **$39**; GPM **10%** and technology **4%** on plan-check and permit fees
  - SMIP residential valuation × **0.00013**; CA Building Standards **$1 per $25,000** or portion
  - Home remodel R-3: plan check **$0.88/sf** + permit **$0.88/sf** (100 sf min, 500 sf max)
  - Residential re-roof tear-off & re-roof: first 1,000 sf **$116** + **$25** each 500 sf thereafter
  - Decks/balconies/stairways: first 500 sf **$329**
  - Furnace **$46**; boilers/AC 0–3 tons **$46**; 3–50 tons **$74**
- City of Riverside, not county unincorporated and not San Bernardino

### Bakersfield, CA
- Master Fee Schedule (7/1/2025 proposed column; still the Building Division **$291** minimum on the July 1, 2026 planning application packet), retrieved **2026-09-01**: https://content.civicplus.com/api/assets/8c9a8e76-09e9-42c1-8e1a-7244438b276c?cache=1800
  Planning packet (July 1, 2026): https://content.civicplus.com/api/assets/ca-bakersfield/6037d14a-6da2-493e-a86d-85a3e3f77ec3?cache=1800
  - Residential construction processing/inspection $1–$40,000 **$291**; over $40,000 **0.0056 × valuation**
  - Residential reroof $1–$30,000 **$215**
  - Individual trade not requiring multiple inspections **$136**; requiring multiple inspections or plan check $1–$40,000 **$236**
  - SMIP residential **$13 per $100,000** (0.00013). GPM **$205** is listed for new construction and is not added to reroof/remodel/HVAC
- City of Bakersfield, not Kern County

### Aurora, CO
- 2026 Flat Rate Fee Permits (revised **08/2026**, Form #A175), retrieved **2026-09-01**: https://www.auroragov.org/UserFiles/Servers/Server_1881137/File/Business%20Services/Forms/Flat%20Rate%20Fees.pdf
  - SFR roof replacement **$350**; SFR deck **$402**; furnace and AC replacement **$300**; furnace **$201**; AC **$201**
  - No kitchen-remodel / interior-alteration line on the flyer. Fee Schedule 3 is **new buildings** (R-3 $1.30/sf, min $2,000) and was **not** used. Re-searched auroragov.org **2026-09-01**; still no kitchen/interior-alteration dollar line. Kitchen typical left **null**.
- Fee Schedule 3 (2026): https://www.auroragov.org/UserFiles/Servers/Server_1881137/File/Business%20Services/Development%20Center/Fees/Fee%20Schedule%203.pdf
- Portal: https://aurora4biz.org
- City of Aurora, not Denver and not unincorporated Arapahoe. Census parts Arapahoe/Adams/Douglas.
- Aurora uses the Denver-Aurora-Centennial BLS wage (same $33.00 May 2025 as Denver)

### Wichita, KS
- MABCD fees hub, retrieved **2026-09-01**: https://www.sedgwickcounty.org/mabcd/fees/
  Permits page (roofing $0.05/sf): https://www.sedgwickcounty.org/mabcd/permits/
  - Roofing **$0.05 per sf** (min **$50**, max **$1,500**)
  - Decks **$0.30 per sf** (new-residence note on the permits page)
  - Table B (rev. 5/8/2019): https://www.sedgwickcounty.org/media/55339/fee-table-b.pdf — residential remodels use the commercial valuation table ($2,001–$40,000 = **$70 + $11 per $1,000** over $2,000; $40,001–$100,000 = **$488 + $9 per $1,000** over $40,000)
  - Table K mechanical (rev. 5/9/2019): https://www.sedgwickcounty.org/media/55337/fee-table-k.pdf — issuance **$25**; forced-air furnace ≤2,000 cfm **$14**; AC 5 ton or less **$11**
  - 1–2 family building permit covers mechanical/plumbing done with that job
- City of Wichita via MABCD, not unincorporated Sedgwick County. **Do not** use Kansas City, MO-KS wages.

### Salt Lake City, UT
- Consolidated Fee Schedule, amended **06/16/2026** by Ord. **2026-29**, retrieved **2026-09-01**: https://tools.slc.gov/feeschedule
  Building permits (18.32.035):
  - $0.01–$500: **$55.97**
  - $500.01–$2,000: **$55.97** first $500 plus **$4** per additional $100
  - $2,000.01–$25,000: **$115.97** first $2,000 plus **$20** per additional $1,000
  - $25,000.01–$50,000: **$575.97** first $25,000 plus **$14** per additional $1,000
  - $50,000.01–$100,000: **$925.97** first $50,000 plus **$10** per additional $1,000
  - Plan review **65%** of the building permit (18.32.035)
- Mechanical Fee Schedule (updated **7/2026**): http://www.slcdocs.com/building/Mechanical%20Fee%20Schedule.pdf
  - Base **$59** plus chart plus **1%** Utah state fee
  - Furnaces/make-up air burners up to 200,000 BTU **$30**
  - Compressor/AC/heat pump table: first listed amount **$24**; 1.5–4 hp or tons size line (3-ton is in that band)
  - Appliance vent not included on an appliance **$18**
- Portal: https://slcpermits.com
- City of Salt Lake City, not Salt Lake County unincorporated and not West Valley City

### Providence, RI
- Department of Inspection and Standards: https://www.providenceri.gov/inspection-standards/
- **510-RICR-00-00-21.12** City of Providence building-permit fee schedule (current on RI SOS; retrieved **2026-09-01**): https://rules.sos.ri.gov/regulations/part/510-00-00-21
  City FAQ (2020) reprints the same brackets: https://www.providenceri.gov/wp-content/uploads/2021/03/permit-faq-20200302.pdf
  - $1–$10,000: **$23.00 per $1,000** (minimum **$125**)
  - $10,001–$50,000: **$230 + $21.00 per $1,000** exceeding $10,000
  - $50,001+: **$1,070 + $19.00 per $1,000** exceeding $50,000
  RICR minimum **$125** is used, not the FAQ’s older $50 minimum
- RICR text: the table is **exclusive of** the levy mandated by R.I. Gen. Laws § 23-27.3-108.2(c)(1). **0.2%** residential levy, max **$100** on 1–4 family, is added
- HVAC uses the same construction-cost table (no separate mechanical dollar table was published)
- City of Providence, not other RI cities

### Grand Rapids, MI
- FY2026 fee schedule, retrieved **2026-09-01**: https://www.grandrapidsmi.gov/media/fnqdjzue/fy26-fee-schedule.pdf
  Estimator: https://www.grandrapidsmi.gov/grow-and-thrive/development-center/building-permit-fees/
  - Building permit base **$54** (first $1,000) plus incremental **$6.80** per additional $1,000
  - Residential re-roofing **$66**; residential deck **$66**
  - 1–2 family zoning typically **$24** added to the building permit
  - Mechanical application (includes 1 inspection) **$52**; additional inspection **$21**
  - Residential replacement furnace **$21**; AC / heat pump **$21**
- City of Grand Rapids, not Kentwood/Wyoming and not Kent County

### Boise, ID
- Building Code Fee Schedule Table 1-A (**Oct 2023**, still posted), retrieved **2026-09-01**: https://www.cityofboise.org/media/17652/final-boise-city-building-code-fee-schedule-10-1-23.pdf
  Fees hub: https://www.cityofboise.org/departments/planning-and-development-services/fees/
  - $2,001–$25,000: **$70.76** first $2,000 plus **$12.71** per additional $1,000
  - $25,001–$50,000: **$362.80** first $25,000 plus **$9.30** per additional $1,000
  - $50,001–$100,000: **$595.30** first $50,000 plus **$6.35** per additional $1,000
  - Residential plan review (1–2 family) **20%** of the building permit
- Mechanical / fuel-gas PDF is listed on the fees page; **fixture dollars were not extracted**. HVAC typical left **null**
- City of Boise, not Meridian/Nampa and not Ada County. Census name **Boise City city**

### Richmond, VA
- Permits and Inspections fee schedule effective **07/01/2024**, retrieved **2026-09-01**: https://www.rva.gov/sites/default/files/2024-08/PermitsFeeSchedule.pdf
  Landing: https://www.rva.gov/planning-development-review/permits-and-inspections
  - Residential 1–2 family: **$63.00** for $0–$2,000; over $2,000 add **$6.07** per additional $1,000
  - **2.0%** Virginia state surcharge is printed and is added
  - Same valuation formula covers building, mechanical, electrical, and plumbing
- City of Richmond (independent city), not Henrico or Chesterfield

### Des Moines, IA
- Permit and Development Center: https://www.dsm.city/departments/development_services/
- PDC Permit Fees — New Fees **1-1-26**, retrieved **2026-09-01**: https://cms2.revize.com/revize/cityofdesmoines/Documents/Departments/Development%20Services/Permit%20Development%20Center/PDC%20Permit%20Fee%20Schedule.pdf
  Building permits for townhouses, 1–2 family, and accessory buildings:
  - Renovations to dwellings **$154.50**
  - Decks, fences, retaining walls, swimming pools, hot tubs, and other accessory structures **$77.25**
  - Mechanical permit for mechanical installations associated with alterations and additions to existing dwellings **$77.25**
  - Electrical / plumbing alteration lines **$77.25** each (not stacked on kitchen typical)
- Do **not** use Des Moines, Washington (DMMC) civiclive PDFs
- City of Des Moines, not West Des Moines and not Polk County

### Madison, WI
- Building Inspection fees, retrieved **2026-09-01**: https://www.cityofmadison.com/development-services-center/fees/building-inspection-fees
  MGO 29.09: https://library.municode.com/wi/madison/codes/code_of_ordinances?nodeId=COORMAWIVOIICH20--31_CH29BUCO
  - Group IV alterations/repairs: **$11.00 per $1,000** or fraction, min **$25**
  - SFR alteration/remodel plan review **$25**
  - Zoning review **$0.03/sf**, min **$25**, at building-permit issuance (MGO 28.206)
  - Plumbing alterations **$8/fixture**, min **$25** (not stacked on kitchen typical)
  - Replacement heating equipment: **$25** up to 100,000 BTU output; **$50** 100,001–165,000; **$75** 165,001+
  - Air conditioning unit (new or replaced) **$25**; ductless split / wall pack **$25**
  - HVAC **$0.03/sf** min **$100** is commercial alterations/remodeling plan review and is **not** used for a 3-ton change-out
- City of Madison, not Dane County

### Spokane, WA
- Development Services fee calculators / 2026 fee schedule landing, retrieved **2026-09-01**: https://my.spokanecity.org/business/residential/fee-calculators/
- Development Services Fee Schedule **2026** (official PDF), retrieved **2026-09-01**: https://static.spokanecity.org/documents/business/development/2026-development-services-fee-schedule-2026-07-16.pdf
  Official gazette reprint (Feb 11, 2026): https://static.spokanecity.org/documents/officialgazettes/2026/02/official-gazette-2026-02-11.pdf
  - Processing/application **$65.00** (except as otherwise identified)
  - Technology **2.5%**
  - State Building Code Fee listed as **State Determined** (RCW 19.27.085 **$6.50** added)
  - Building permit: $1–$2,000 **$73**; $2,001–$25,000 **$73 + $13** per $1,000 over $2,000; $25,001–$50,000 **$372 + $10** per $1,000 over $25,000; $50,001–$100,000 **$622 + $7** per $1,000 over $50,000
  - Plan review 65% commercial/multi-family over 2 units; reduced 25% — **not stacked** (residential reroof/remodel path not unique)
  - Mechanical HVAC change-out dollars **not extracted**. HVAC typical left **null**
- City of Spokane, not Spokane Valley and not county

### Chula Vista, CA
- Master Fee Schedule hub (last updated **June 2026**): https://www.chulavistaca.gov/departments/finance/master-fee-schedule
  Chapter 10-400 Miscellaneous Item Permit Fees (**September 2024** bulletin, still posted), retrieved **2026-09-01**: https://www.chulavistaca.gov/home/showpublisheddocument/2416/638638971096170000
  - Re-roof: first 1,000 sf **$422** (intake $88 + plan check $52 + inspection $282); each additional 1,000 sf **$52**
  - Deck, city standard design: first 300 sf **$827**; each additional 100 sf **$52**
  - Residential remodel: first 300 sf **$1,604**; each additional 300 sf **$211**
- Chapter 10-200 mechanical dollars were **not extracted**. HVAC typical left **null**
- City of Chula Vista, not San Diego city. Reuses San Diego-Chula Vista-Carlsbad OEWS mean **$36.54**

### Plano, TX
- Building Inspections fee schedule (council exhibit), retrieved **2026-09-01**: https://plano.novusagenda.com/Agendapublic/AttachmentViewer.ashx?AttachmentID=20791&ItemID=10295
  - Re-roof residential **$75**
  - Residential addition/alteration/backyard cottage: **$0.48/sf** plus plan review **$45** (building minimum **$40**)
  - Electrical/plumbing/mechanical **$0.01/sf**, min **$45** each, if applicable — not stacked on kitchen typical
  - ACCESSORY STRUCTURE (<400 sq.ft.) **$75** (used for typical 16×20 = 320 sf deck; high 400 sf is not <400 so addition/alteration $0.48/sf + $45)
  - SIMPLE TRADE PERMITS (MEP) each, residential **$85** (stand-alone HVAC change-out)
- City of Plano, not Dallas and not Frisco. Census parts Collin/Denton. Reuses Dallas-Fort Worth-Arlington OEWS mean **$27.03**

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
| San Jose | San Jose-Sunnyvale-Santa Clara, CA | 45.42 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sanjose.htm |
| San Francisco | San Francisco-Oakland-Fremont, CA | 43.66 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sanfrancisco.htm |
| El Paso | El Paso, TX | 22.75 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_elpaso.htm |
| Oklahoma City | Oklahoma City, OK | 27.27 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_oklahomacity.htm |
| Baltimore | Baltimore-Columbia-Towson, MD | 30.48 | May 2025 | https://www.bls.gov/regions/mid-atlantic/news-release/occupationalemploymentandwages_baltimore.htm |
| Milwaukee | Milwaukee-Waukesha, WI | 35.09 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_milwaukee.htm |
| Memphis | Memphis, TN-MS-AR | 27.21 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_memphis.htm |
| Louisville | Louisville/Jefferson County, KY-IN | 29.64 | May 2025 | https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_louisville.htm |
| Albuquerque | Albuquerque, NM | 26.63 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_albuquerque.htm |
| Tucson | Tucson, AZ | 26.71 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_tucson.htm |
| Long Beach | Los Angeles-Long Beach-Anaheim, CA | 37.07 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_losangeles.htm |
| Mesa | Phoenix-Mesa-Chandler, AZ | 29.42 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_phoenix.htm |
| Fresno | Fresno, CA | 34.41 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_fresno.htm |
| Colorado Springs | Colorado Springs, CO | 29.69 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_coloradosprings.htm |
| Omaha | Omaha, NE-IA | 29.47 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_omaha.htm |
| Virginia Beach | Virginia Beach-Chesapeake-Norfolk, VA-NC | 27.87 | May 2025 | https://www.bls.gov/regions/mid-atlantic/news-release/occupationalemploymentandwages_virginiabeach.htm |
| Oakland | San Francisco-Oakland-Fremont, CA | 43.66 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sanfrancisco.htm |
| Tulsa | Tulsa, OK | 27.14 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_tulsa.htm |
| Arlington (TX) | Dallas-Fort Worth-Arlington, TX | 27.03 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_dallasfortworth.htm |
| New Orleans | New Orleans-Metairie, LA | 27.18 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_neworleans.htm |
| Cleveland | Cleveland, OH | 32.17 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_cleveland.htm |
| St. Louis | St. Louis, MO-IL | 35.43 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_stlouis.htm |
| Pittsburgh | Pittsburgh, PA | 32.06 | May 2025 | https://www.bls.gov/regions/mid-atlantic/news-release/occupationalemploymentandwages_pittsburgh.htm |
| Cincinnati | Cincinnati, OH-KY-IN | 31.76 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_cincinnati.htm |
| Honolulu | Urban Honolulu, HI | 40.71 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_honolulu.htm |
| Anaheim | Los Angeles-Long Beach-Anaheim, CA | 37.07 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_losangeles.htm |
| Riverside | Riverside-San Bernardino-Ontario, CA | 34.66 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_riverside.htm |
| Bakersfield | Bakersfield-Delano, CA | 34.44 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_bakersfield.htm |
| Aurora (CO) | Denver-Aurora-Centennial, CO | 33.00 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_denver.htm |
| Wichita | Wichita, KS | 27.71 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_wichita.htm |
| Salt Lake City | Salt Lake City-Murray, UT | 29.61 | May 2025 | https://www.bls.gov/regions/mountain-plains/news-release/occupationalemploymentandwages_saltlakecity.htm |
| Providence | Providence-Warwick, RI-MA | 34.77 | May 2025 | https://www.bls.gov/regions/northeast/news-release/occupationalemploymentandwages_providence.htm |
| Grand Rapids | Grand Rapids-Wyoming-Kentwood, MI | 30.15 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_grandrapids.htm |
| Boise | Boise City, ID | 28.58 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_boisecity.htm |
| Richmond | Richmond, VA | 27.67 | May 2025 | https://www.bls.gov/regions/mid-atlantic/news-release/occupationalemploymentandwages_richmond.htm |
| Des Moines | Des Moines-West Des Moines, IA | 31.49 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_desmoines.htm |
| Madison | Madison, WI | 35.09 | May 2025 | https://www.bls.gov/regions/midwest/news-release/occupationalemploymentandwages_madison.htm |
| Spokane | Spokane-Spokane Valley, WA | 34.50 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_spokane.htm |
| Chula Vista | San Diego-Chula Vista-Carlsbad, CA | 36.54 | May 2025 | https://www.bls.gov/regions/west/news-release/occupationalemploymentandwages_sandiego.htm |
| Plano | Dallas-Fort Worth-Arlington, TX | 27.03 | May 2025 | https://www.bls.gov/regions/southwest/news-release/occupationalemploymentandwages_dallasfortworth.htm |

Anaheim uses the Los Angeles-Long Beach-Anaheim BLS wage (same $37.07 May 2025 as Los Angeles / Long Beach).
Aurora (CO) uses the Denver-Aurora-Centennial BLS wage (same $33.00 May 2025 as Denver).
Wichita uses the Wichita, KS metro only — not Kansas City, MO-KS.
Chula Vista uses the San Diego-Chula Vista-Carlsbad BLS wage (same $36.54 May 2025 as San Diego).
Plano uses the Dallas-Fort Worth-Arlington BLS wage (same $27.03 May 2025 as Dallas / Fort Worth / Arlington).

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
