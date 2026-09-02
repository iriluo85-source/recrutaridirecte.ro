// Bifă „Firmă verificată" — afișată doar la firmele cu abonament Nelimitat (efectiv).
// Seal emerald cu inel alb + bifă albă: rămâne lizibilă atât pe bannerul închis,
// cât și pe cardurile deschise. Culoare fixă (nu depinde de temă) ca să fie recunoscută.
export default function VerifiedBadge({
  locale,
  className = "h-5 w-5",
}: {
  locale?: string;
  className?: string;
}) {
  const titlu = locale === "en" ? "Verified company" : "Firmă verificată";
  return (
    <span
      className="inline-flex shrink-0 items-center align-middle"
      title={titlu}
      aria-label={titlu}
    >
      <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
        <path
          d="M7 12.4l3.1 3.1L17 8.6"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
