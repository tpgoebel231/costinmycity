# CostInMyCity primary sources

Retrieved 2026-08-13. Charlotte, NC and Minneapolis, MN permit rows were re-extracted from official schedules on **2026-08-29**. Third-party calculators were used only as pointers to official PDFs; they are **not** cited as fee sources. We cite the city's published schedule.

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

---

## Cities and populations

- U.S. Census Bureau, Vintage 2025 city/town population estimates (July 1, 2025): https://www.census.gov/newsroom/press-releases/2026/vintage-2025-city-town-pop-estimates.html
- Census QuickFacts (Austin, Charlotte, Raleigh examples): https://www.census.gov/quickfacts/

Populations used (July 1, 2025): Phoenix 1,665,481; Austin 1,002,632; Charlotte 964,784; Seattle 784,777; Denver 740,613; Nashville-Davidson 721,074; Portland 635,109; Atlanta 529,110; Raleigh 506,306; Minneapolis 430,324.

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
- Separate mechanical / electrical / plumbing PDFs are listed on the same news page; mechanical dollars were **not** extracted (HVAC cells null except permitRequired).
- Oregon 12% building-permit surcharge is applied on top of the extracted building-permit table. Plan-review / development-services add-ons on the same PDF were **not** fully extracted — Portland totals are therefore a **partial** official figure.

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
