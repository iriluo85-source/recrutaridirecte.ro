// Logo „Recrutare Directă" — un R și un D legate, cu un mic gol verde unde se ating.
// Insigna folosește culoarea accent a temei (via currentColor), literele rămân albe.
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`text-accent ${className}`}
      role="img"
      aria-label="Recrutare Directă"
    >
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <path d="M23 18 v28" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M23 18 h7 a8 8 0 0 1 0 16 h-7"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M28 33 l8 13" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path d="M39 18 v28 h4 a13 14 0 0 0 0 -28 z" fill="#fff" />
      <circle cx="35" cy="32" r="3.2" fill="currentColor" />
    </svg>
  );
}
