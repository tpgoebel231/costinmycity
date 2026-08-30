import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CostInMyCity uses Google Analytics to understand page views. No accounts. No contractor leads.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Privacy</h1>
      <p className="mt-4">CostInMyCity uses Google Analytics to see which pages people open. Google may set cookies on your browser as part of that. We use it to understand traffic, not to collect accounts or send leads to contractors.</p>
      <p className="mt-4">This is an estimate site. There are no accounts, no logins, and no contractor leads. We do not ask you to create a profile.</p>
      <p className="mt-4">This is an estimate, not a contractor quote. Permit fees change. Verify with your city before you pull a permit. We are not a contractor and this is not legal advice.</p>
    </article>
  );
}
