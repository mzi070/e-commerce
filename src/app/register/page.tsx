import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "@/components/auth/register-form";
import { sanitizeCallbackUrl } from "@/lib/safe-redirect";

export const metadata = { title: "Create account" };

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Create your account</h1>
      <RegisterForm callbackUrl={sanitizeCallbackUrl(callbackUrl)} />
    </div>
  );
}
