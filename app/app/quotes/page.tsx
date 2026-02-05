"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Quote = {
  id: string;
  category_name_snapshot: string | null;
  service_description: string | null;
  labor_value_cents: number | null;
  created_at: string;
};

function formatBRLFromCents(cents?: number | null) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function QuotesPage() {
  const supabase = getSupabaseBrowserClient();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("quotes")
      .select("id, category_name_snapshot, service_description, labor_value_cents, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setQuotes([]);
    } else {
      setQuotes((data ?? []) as Quote[]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Orçamentos</h1>
            <p className="text-sm opacity-70">Seus orçamentos salvos</p>
          </div>

          <Link
            href="/app/quotes/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Novo orçamento
          </Link>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm opacity-80">
              Carregando...
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-medium">Erro ao carregar</p>
              <p className="mt-1 opacity-80">{err}</p>
              <button
                className="mt-3 rounded-lg border border-white/10 px-3 py-1 text-sm hover:bg-white/10"
                onClick={load}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !err && quotes.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm opacity-80">Você ainda não criou nenhum orçamento.</p>
              <Link
                href="/app/quotes/new"
                className="mt-4 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Criar primeiro orçamento
              </Link>
            </div>
          )}

          {!loading && !err && quotes.length > 0 && (
            <div className="mt-4 space-y-3">
              {quotes.map((q) => {
                const title = q.category_name_snapshot || "Sem categoria";
                const desc = (q.service_description || "").trim();
                const descShort = desc.length > 90 ? desc.slice(0, 90) + "…" : desc;

return (
  <Link
    key={q.id}
    href={`/app/quotes/${q.id}`}
    className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {descShort && <p className="mt-1 text-sm opacity-75">{descShort}</p>}
        <p className="mt-2 text-xs opacity-60">
          Criado em {formatDateBR(q.created_at)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">
          {formatBRLFromCents(q.labor_value_cents)}
        </p>
      </div>
    </div>
  </Link>
);

              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
