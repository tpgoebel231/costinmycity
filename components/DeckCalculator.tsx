"use client";

import { useMemo, useState } from "react";
import type { DeckMaterialsData } from "@/lib/types";
import { calculateDeck, deckingTypes, defaultDeckInputs, joistTypes, postTypes } from "@/lib/deck";
import { numberFmt, usd } from "@/lib/format";

export function DeckCalculator({ data }: { data: DeckMaterialsData }) {
  const [inputs, setInputs] = useState(() => defaultDeckInputs(data));
  const result = useMemo(() => calculateDeck(data, inputs), [data, inputs]);
  const deckings = deckingTypes(data);
  const joists = joistTypes(data);
  const posts = postTypes(data);

  function set<K extends keyof typeof inputs>(key: K, value: (typeof inputs)[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <fieldset className="border border-line bg-paper p-4">
          <legend className="px-1 text-sm font-medium">Size</legend>
          <div className="grid grid-cols-2 gap-3">
            <Num label="Length (ft)" value={inputs.lengthFt} onChange={(v) => set("lengthFt", v)} min={4} max={80} />
            <Num label="Width (ft)" value={inputs.widthFt} onChange={(v) => set("widthFt", v)} min={4} max={40} />
            <Num label="Height off grade (in)" value={inputs.heightOffGradeIn} onChange={(v) => set("heightOffGradeIn", v)} min={0} max={144} />
            <Num label="Waste %" value={inputs.wastePct} onChange={(v) => set("wastePct", v)} min={0} max={30} />
            <Num label="Joist spacing (in)" value={inputs.joistSpacingIn} onChange={(v) => set("joistSpacingIn", v)} min={12} max={24} />
            <Num label="Board width (in)" value={inputs.boardWidthIn} onChange={(v) => set("boardWidthIn", v)} min={3} max={8} step={0.25} />
            <Num label="Board length (ft)" value={inputs.boardLengthFt} onChange={(v) => set("boardLengthFt", v)} min={8} max={20} />
          </div>
        </fieldset>

        <fieldset className="border border-line bg-paper p-4">
          <legend className="px-1 text-sm font-medium">Materials and prices</legend>
          <p className="mb-3 text-xs text-muted">Defaults are labeled edit-me in the data file. Overwrite them with a current yard quote.</p>
          <label className="block text-sm">Decking
            <select className="mt-1 w-full border border-line bg-canvas px-2 py-2" value={inputs.deckingId} onChange={(e) => {
              const id = e.target.value;
              const item = deckings.find((t) => t.id === id);
              setInputs((p) => ({ ...p, deckingId: id, deckingPrice: item?.defaultPriceUsd ?? p.deckingPrice }));
            }}>
              {deckings.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <Num label="Decking price ($ / lf)" value={inputs.deckingPrice} onChange={(v) => set("deckingPrice", v)} min={0} max={40} step={0.1} />
          <label className="mt-3 block text-sm">Joists
            <select className="mt-1 w-full border border-line bg-canvas px-2 py-2" value={inputs.joistId} onChange={(e) => {
              const id = e.target.value;
              const item = joists.find((t) => t.id === id);
              setInputs((p) => ({ ...p, joistId: id, joistPrice: item?.defaultPriceUsd ?? p.joistPrice }));
            }}>
              {joists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <Num label="Joist price ($ / stick)" value={inputs.joistPrice} onChange={(v) => set("joistPrice", v)} min={0} max={80} step={0.5} />
          <label className="mt-3 block text-sm">Posts
            <select className="mt-1 w-full border border-line bg-canvas px-2 py-2" value={inputs.postId} onChange={(e) => {
              const id = e.target.value;
              const item = posts.find((t) => t.id === id);
              setInputs((p) => ({ ...p, postId: id, postPrice: item?.defaultPriceUsd ?? p.postPrice }));
            }}>
              {posts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <Num label="Post price ($ each)" value={inputs.postPrice} onChange={(v) => set("postPrice", v)} min={0} max={120} step={1} />
          <label className="mt-3 block text-sm">Fasteners
            <select className="mt-1 w-full border border-line bg-canvas px-2 py-2" value={inputs.fastenerId} onChange={(e) => {
              const id = e.target.value;
              const item = data.fasteners.find((t) => t.id === id);
              setInputs((p) => ({ ...p, fastenerId: id, fastenerPrice: item?.defaultPriceUsd ?? p.fastenerPrice }));
            }}>
              {data.fasteners.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <Num label="Fastener price ($ each)" value={inputs.fastenerPrice} onChange={(v) => set("fastenerPrice", v)} min={0} max={5} step={0.01} />
          <Num label="Footing allowance ($ each)" value={inputs.footingPrice} onChange={(v) => set("footingPrice", v)} min={0} max={200} step={1} />
          <Num label="Railing allowance ($ / lf)" value={inputs.railingPrice} onChange={(v) => set("railingPrice", v)} min={0} max={200} step={1} />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={inputs.includeRailing} onChange={(e) => set("includeRailing", e.target.checked)} />
            Include railing allowance
          </label>
        </fieldset>
      </div>

      <div>
        <div className="border border-line bg-paper p-4">
          <p className="text-sm uppercase tracking-wider text-muted">Material ballpark</p>
          <p className="num mt-1 text-5xl">{usd(result.materialTotal)}</p>
          <p className="mt-2 text-sm text-muted">{numberFmt(result.areaSqft)} sqft walking surface. Materials only, not labor or permit.</p>
        </div>
        <table className="mt-4 w-full text-sm">
          <tbody>
            <Row k="Decking lineal feet" v={numberFmt(result.deckingLf, 1)} />
            <Row k="Decking boards" v={String(result.deckingBoards)} />
            <Row k="Decking board-feet" v={numberFmt(result.deckingBoardFeet, 1)} />
            <Row k="Joists (count / lf)" v={result.joistCount + " / " + numberFmt(result.joistLf, 1)} />
            <Row k="Posts" v={String(result.postCount)} />
            <Row k="Fasteners" v={numberFmt(result.fastenerCount)} />
            <Row k="Decking $" v={usd(result.deckingCost)} />
            <Row k="Framing $" v={usd(result.joistCost + result.postCost)} />
            <Row k="Fasteners $" v={usd(result.fastenerCost)} />
            <Row k="Footings $" v={usd(result.footingCost)} />
            <Row k="Railing $" v={usd(result.railingCost)} />
          </tbody>
        </table>
        <ul className="mt-4 space-y-2 text-xs text-muted">
          {result.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
}

function Num({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="mt-3 block text-sm">
      {label}
      <input type="number" className="mt-1 w-full border border-line bg-canvas px-2 py-2 num" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-line"><th className="py-2 text-left font-normal">{k}</th><td className="num py-2 text-right">{v}</td></tr>
  );
}
