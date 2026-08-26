import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { setRoleAction } from "./actions";
import { alegeSlideAleator } from "@/lib/hero";

export default async function AlegeRolPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role) {
    redirect(session.user.role === "EMPLOYER" ? "/angajator/profil" : "/candidat/profil");
  }

  const t = await getTranslations("auth");
  const th = await getTranslations("home");
  const slide = alegeSlideAleator();

  return (
    <div className="flex flex-1">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="card">
            <h1 className="text-2xl font-semibold">{t("chooseRole.title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("chooseRole.subtitle")}</p>

            <form action={setRoleAction} className="mt-6 flex flex-col gap-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acceptaTermeni" required className="mt-0.5 accent-accent" />
                <span>
                  {t("chooseRole.acceptTerms")}{" "}
                  <Link href="/termeni" target="_blank" className="text-accent hover:underline">
                    {t("register.termsLink")}
                  </Link>{" "}
                  {t("register.and")}{" "}
                  <Link href="/confidentialitate" target="_blank" className="text-accent hover:underline">
                    {t("register.privacyLink")}
                  </Link>
                  .
                </span>
              </label>

              <button type="submit" name="role" value="CANDIDATE" className="btn-primary w-full">
                {t("chooseRole.candidateButton")}
              </button>
              <button type="submit" name="role" value="EMPLOYER" className="btn-secondary w-full">
                {t("chooseRole.employerButton")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, rgba(4,35,26,0.92) 0%, rgba(6,40,30,0.8) 40%, rgba(15,23,42,0.55) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end gap-3 p-12">
          <p className="max-w-sm text-3xl font-bold leading-tight text-white">
            {th("slogans." + slide.sloganKey)}
          </p>
          <p className="max-w-sm text-white/80">{th("heroSubtitle")}</p>
        </div>
      </div>
    </div>
  );
}
