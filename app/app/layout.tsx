import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/login?next=/app/quotes");
  }

  return <>{children}</>;
}
