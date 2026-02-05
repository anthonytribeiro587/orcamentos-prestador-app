import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  if (data.session) redirect("/app/quotes");

  return (
    <Suspense fallback={<main style={{ padding: 16 }}>Carregando...</main>}>
      <LoginClient />
    </Suspense>
  );
}
