import { googleEnabled, microsoftEnabled } from "@/auth";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <LoginForm googleEnabled={googleEnabled} microsoftEnabled={microsoftEnabled} />
    </main>
  );
}
