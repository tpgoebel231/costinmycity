export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      {items.map((item) => (
        <details key={item.question} className="faq-item">
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </>
  );
}
