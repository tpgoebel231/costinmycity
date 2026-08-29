import type { DeckMaterialsData, PricedItem } from "./types";

export interface DeckInputs {
  lengthFt: number;
  widthFt: number;
  heightOffGradeIn: number;
  wastePct: number;
  joistSpacingIn: number;
  boardWidthIn: number;
  boardLengthFt: number;
  deckingId: string;
  joistId: string;
  postId: string;
  fastenerId: string;
  deckingPrice: number;
  joistPrice: number;
  postPrice: number;
  fastenerPrice: number;
  footingPrice: number;
  railingPrice: number;
  includeRailing: boolean;
}

export interface DeckResult {
  areaSqft: number;
  perimeterFt: number;
  deckingLf: number;
  deckingBoards: number;
  deckingBoardFeet: number;
  joistCount: number;
  joistLf: number;
  postCount: number;
  fastenerCount: number;
  deckingCost: number;
  joistCost: number;
  postCost: number;
  fastenerCost: number;
  footingCost: number;
  railingCost: number;
  materialTotal: number;
  railingLikely: boolean;
  notes: string[];
}

export function deckingTypes(data: DeckMaterialsData): PricedItem[] {
  return data.lumberTypes.filter((t) => !t.use || t.use.includes("decking"));
}

export function joistTypes(data: DeckMaterialsData): PricedItem[] {
  return data.lumberTypes.filter((t) => t.use?.includes("joists"));
}

export function postTypes(data: DeckMaterialsData): PricedItem[] {
  return data.lumberTypes.filter((t) => t.use?.includes("posts"));
}

function find(items: PricedItem[] | undefined, id: string): PricedItem | undefined {
  return items?.find((i) => i.id === id);
}

export function defaultDeckInputs(data: DeckMaterialsData): DeckInputs {
  const decking = deckingTypes(data)[0];
  const joist = find(data.lumberTypes, "pt-2x8-joist") ?? joistTypes(data)[0];
  const post = find(data.lumberTypes, "pt-6x6-post") ?? postTypes(data)[0];
  const fastener = data.fasteners[0];
  const footing = data.otherAllowances?.find((a) => a.id === "concrete-footing");
  const rail = data.otherAllowances?.find((a) => a.id === "railing-pt");
  const cover = data.coverage?.decking_5_4x6;
  return {
    lengthFt: 20,
    widthFt: 16,
    heightOffGradeIn: 24,
    wastePct: data.assumptions?.wastePctDecking ?? 10,
    joistSpacingIn: data.assumptions?.joistSpacingIn ?? 16,
    boardWidthIn: cover?.actualWidthIn ?? 5.5,
    boardLengthFt: 12,
    deckingId: decking?.id ?? "pt-pine",
    joistId: joist?.id ?? "pt-2x8-joist",
    postId: post?.id ?? "pt-6x6-post",
    fastenerId: fastener?.id ?? "face-screws-coated",
    deckingPrice: decking?.defaultPriceUsd ?? 0,
    joistPrice: joist?.defaultPriceUsd ?? 0,
    postPrice: post?.defaultPriceUsd ?? 0,
    fastenerPrice: fastener?.defaultPriceUsd ?? 0,
    footingPrice: footing?.defaultPriceUsd ?? 0,
    railingPrice: rail?.defaultPriceUsd ?? 0,
    includeRailing: false,
  };
}

export function calculateDeck(data: DeckMaterialsData, inputs: DeckInputs): DeckResult {
  const length = Math.max(0, inputs.lengthFt);
  const width = Math.max(0, inputs.widthFt);
  const area = length * width;
  const perimeter = 2 * (length + width);
  const waste = 1 + Math.max(0, inputs.wastePct) / 100;
  const lfPerSf = data.coverage?.decking_5_4x6?.linealFeetPerSqft ?? 12 / Math.max(0.5, inputs.boardWidthIn);
  const deckingLf = area * lfPerSf * waste;
  const boardLen = Math.max(1, inputs.boardLengthFt);
  const deckingBoards = Math.ceil(deckingLf / boardLen);
  const deckingBoardFeet = deckingLf * (inputs.boardWidthIn / 12);

  const spacing = Math.max(8, inputs.joistSpacingIn);
  const joistCount = Math.floor((length * 12) / spacing) + 1;
  const joistLf = area * 0.75 + perimeter;
  const postCount = Math.max(4, (Math.floor(length / 6) + 1) * (width > 10 ? 2 : 1));

  const fastener = find(data.fasteners, inputs.fastenerId) ?? data.fasteners[0];
  const perSf = fastener?.approxCountPerSqft ?? 9;
  const fastenerCount = Math.ceil(area * perSf * waste);

  const deckingCost = Math.round(deckingLf * inputs.deckingPrice);
  const joistSticks = Math.ceil(joistLf / 8);
  const joistCost = Math.round(joistSticks * inputs.joistPrice);
  const postCost = Math.round(postCount * inputs.postPrice);
  const fastenerCost = Math.round(fastenerCount * inputs.fastenerPrice);
  const footingCost = Math.round(postCount * inputs.footingPrice);
  const railingLikely = inputs.heightOffGradeIn >= 30;
  const railingCost = inputs.includeRailing || railingLikely ? Math.round(perimeter * inputs.railingPrice) : 0;

  const notes: string[] = [];
  if (data.priceDisclaimer) notes.push(data.priceDisclaimer);
  if (railingLikely && !inputs.includeRailing) notes.push("At " + inputs.heightOffGradeIn + " inches off grade, most codes require a guardrail. Toggle railing to include an allowance.");
  if (inputs.heightOffGradeIn >= 72) notes.push("Over 6 feet off grade usually means engineered footings and a stair run. Stairs are not priced here.");
  notes.push("Joist lineal feet use the published recipe: 0.75 x deck sf plus perimeter. Confirm spans with a table.");

  return {
    areaSqft: area,
    perimeterFt: perimeter,
    deckingLf,
    deckingBoards,
    deckingBoardFeet,
    joistCount,
    joistLf,
    postCount,
    fastenerCount,
    deckingCost,
    joistCost,
    postCost,
    fastenerCost,
    footingCost,
    railingCost,
    materialTotal: deckingCost + joistCost + postCost + fastenerCost + footingCost + railingCost,
    railingLikely,
    notes,
  };
}
