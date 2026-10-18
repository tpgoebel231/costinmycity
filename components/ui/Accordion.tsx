export function Accordion({
  items,
  open = false,
}: {
  items: { question: string; answer: string }[];
  open?: boolean;
}) {
  return (
    <>
      {items.map((item) => (
        <details key={item.question} className="faq-item" open={open || undefined}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </>
  );
}
