import { googleEnabled, microsoftEnabled } from "@/auth";
import RegisterForm from "./RegisterForm";

export default async function InregistrarePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultRole = params.rol === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <RegisterForm
        defaultRole={defaultRole}
        googleEnabled={googleEnabled}
        microsoftEnabled={microsoftEnabled}
      />
    </main>
  );
}
