import type { ReactNode } from "react";
import { calcNoteBlocks, type CalcNoteBlock, type CalcNoteInline } from "@/lib/calc-note";

function Inlines({ parts }: { parts: CalcNoteInline[] }) {
  return parts.map((part, index) =>
    part.type === "link" ? (
      <a key={index} href={part.href} rel="noreferrer" target="_blank">
        {part.text}
      </a>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );
}

function BlockView({ block }: { block: CalcNoteBlock }) {
  if (block.type === "p") {
    return (
      <p>
        {block.sentences.map((sentence, index) => (
          <span key={index}>
            {index > 0 ? " " : null}
            <Inlines parts={sentence} />
          </span>
        ))}
      </p>
    );
  }
  const List = block.type === "ol" ? "ol" : "ul";
  return (
    <List>
      {block.items.map((sentence, index) => (
        <li key={index}>
          <Inlines parts={sentence} />
          {index < block.items.length - 1 ? " " : null}
        </li>
      ))}
    </List>
  );
}

function BlockList({ blocks }: { blocks: CalcNoteBlock[] }): ReactNode {
  const nodes: ReactNode[] = [];
  blocks.forEach((block, index) => {
    if (index > 0) nodes.push(" ");
    nodes.push(<BlockView key={index} block={block} />);
  });
  return nodes;
}

export function CalcNote({
  note,
  citySlug,
  projectSlug,
  className,
  foldLong = false,
}: {
  note: string;
  citySlug: string;
  projectSlug: string;
  className?: string;
  /** Cost pages fold every block after the first when the note is over 500 characters. */
  foldLong?: boolean;
}) {
  const blocks = calcNoteBlocks(note);
  if (!blocks.length) return null;
  const source = (note || "").replace(/\s+/g, " ").trim();
  const fold = foldLong && source.length > 500 && blocks.length > 1;
  const head = fold ? blocks.slice(0, 1) : blocks;
  const rest = fold ? blocks.slice(1) : [];
  const classes = ["calc-note", className].filter(Boolean).join(" ");

  return (
    <div className={classes} data-calc-note={citySlug + "/" + projectSlug}>
      <BlockList blocks={head} />
      {rest.length ? (
        <>
          {" "}
          <details className="fold">
            <summary>
              <span>Show the full fee calculation</span>
            </summary>
            <BlockList blocks={rest} />
          </details>
        </>
      ) : null}
    </div>
  );
}
