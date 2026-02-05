"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Quote = {
  id: string;
  category_name_snapshot: string | null;
  service_description: string | null;
  labor_value_cents: number | null;
  needs_material: boolean | null;
  created_at: string;
};

type Material = {
  id: string;
  description: string;
  quantity: string | null;
};

function formatBRLFromCents(cents?: number | null) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function QuoteDetailPage() {
  const supabase = getSupabaseBrowserClient();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);

    const { data: q, error: qErr } = await supabase
      .from("quotes")
      .select(
        "id, category_name_snapshot, service_description, labor_value_cents, needs_material, created_at"
      )
      .eq("id", params.id)
      .single();

    if (qErr || !q) {
      setLoading(false);
      return;
    }

    setQuote(q);

    if (q.needs_material) {
      const { data: m } = await supabase
        .from("quote_material_items")
        .select("id, description, quantity")
        .eq("quote_id", params.id)
        .order("sort_order", { ascending: true });

      setMaterials(m || []);
    } else {
      setMaterials([]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-xl px-4 py-6">Carregando...</div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-xl px-4 py-6">
          <button onClick={() => router.back()} className="text-sm underline opacity-80">
            Voltar
          </button>
          <p className="mt-4 text-sm opacity-80">Orçamento não encontrado.</p>
        </div>
      </main>
    );
  }

  const title = quote.category_name_snapshot || "Sem categoria";
  const value = formatBRLFromCents(quote.labor_value_cents);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        <button onClick={() => router.back()} className="text-sm underline opacity-80">
          Voltar
        </button>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h1 className="text-lg font-semibold">{title}</h1>

          {quote.service_description && (
            <p className="mt-2 text-sm opacity-80 whitespace-pre-wrap">
              {quote.service_description}
            </p>
          )}

          <p className="mt-4 text-sm">
            <span className="opacity-70">Valor mão de obra: </span>
            <strong>{value}</strong>
          </p>
        </div>

        {quote.needs_material && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold">Materiais necessários</h2>

            {materials.length === 0 ? (
              <p className="mt-2 text-sm opacity-70">Nenhum material informado.</p>
            ) : (
              <ul className="mt-2 text-sm space-y-1">
                {materials.map((m) => (
                  <li key={m.id}>
                    • {m.description}
                    {m.quantity ? <span className="opacity-80"> — {m.quantity}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
  <button
    type="button"
    onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, "_blank")}
    className="h-11 w-full rounded-lg bg-white px-4 text-sm font-medium text-black text-center inline-flex items-center justify-center"
  >
    Gerar PDF
  </button>

  <button
    type="button"
    className="h-11 w-full rounded-lg border border-white/10 px-4 text-sm text-center inline-flex items-center justify-center hover:bg-white/10"
  >
    Enviar WhatsApp (em breve)
  </button>
</div>

      </div>
    </main>
  );
}
