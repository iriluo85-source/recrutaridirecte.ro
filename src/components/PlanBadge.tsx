import { gasestePlan, numePlan } from "@/lib/planuri";

// Badge cu numele abonamentului (RO: Start/Avânt/Prestige/Nelimitat · EN: Start/Boost/Prestige/Unlimited).
// Stiluri solide, lizibile atât pe fundal deschis, cât și pe banner-ul închis.
const STIL: Record<string, string> = {
  FREE: "bg-slate-200 text-slate-700",
  GOLD: "bg-amber-300 text-amber-950",
  PLATINUM: "bg-emerald-300 text-emerald-950",
  UNLIMITED: "bg-violet-300 text-violet-950",
};

export default function PlanBadge({
  role,
  tip,
  locale,
}: {
  role?: string | null;
  tip?: string | null;
  locale: string;
}) {
  const cheie = tip ?? "FREE";
  const plan = gasestePlan(role, cheie);
  if (!plan) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STIL[cheie] ?? STIL.FREE
      }`}
    >
      {numePlan(plan, locale)}
    </span>
  );
}
