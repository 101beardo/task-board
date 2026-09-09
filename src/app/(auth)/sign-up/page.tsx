import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/server/session";

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="sign-up" />;
}
