import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function Home() {
  const supabase = await createSupabaseServerClient(); // ✅ AQUI
  const { data } = await supabase.auth.getSession();

  if (data.session) redirect("/app");
  redirect("/login");
}
