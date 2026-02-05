"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "Serviços de Pintura",
  "Serviços Elétricos",
  "Serviços Hidráulicos",
  "Serviços de Piso",
  "Serviços Gerais",
];

export default function NewQuotePage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [laborValue, setLaborValue] = useState<string>("");
  const [needsMaterial, setNeedsMaterial] = useState(false);
  const [saving, setSaving] = useState(false);

  const [materials, setMaterials] = useState<
    { description: string; quantity: string }[]
  >([]);

  function addMaterial() {
    setMaterials((prev) => [...prev, { description: "", quantity: "" }]);
  }

  function removeMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMaterial(index: number, field: "description" | "quantity", value: string) {
    setMaterials((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function parseMoneyToCents(v: string) {
    // Aceita "123", "123.45", "123,45"
    const normalized = v.replace(/\./g, "").replace(",", ".");
    const num = Number(normalized);
    if (!Number.isFinite(num)) return null;
    return Math.round(num * 100);
  }

async function onSave() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return alert("Usuário não autenticado");

  // 🔧 GARANTE QUE EXISTE PROFILE (evita FK error)
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: user.email?.split("@")[0] ?? "Prestador",
    });

  if (profileErr) {
    return alert(`Erro criando perfil: ${profileErr.message}`);
  }

  // 💾 INSERE O ORÇAMENTO
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      user_id: user.id,
      category_name_snapshot: category,
      service_description: description,
      labor_value_cents: Math.round(Number(laborValue) * 100),
      needs_material: needsMaterial,
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  // 📦 SALVA MATERIAIS (se tiver)
  if (needsMaterial && materials.length > 0) {
    await supabase.from("quote_material_items").insert(
      materials.map((m, i) => ({
        quote_id: quote.id,
        description: m.description,
        quantity: m.quantity,
        sort_order: i,
      }))
    );
  }

  router.push("/app/quotes");
}


  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Novo Orçamento</h1>
          <Link className="text-sm underline opacity-80 hover:opacity-100" href="/app/quotes">
            Voltar
          </Link>
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-2">
            <label className="text-sm opacity-80">Categoria</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm opacity-80">Descrição do serviço</label>
            <textarea
              className="min-h-[110px] w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none"
              placeholder="Descreva o que será feito (ex.: preparação e pintura de paredes e teto, proteção do ambiente...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm opacity-80">Valor mão de obra (R$)</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none"
              inputMode="decimal"
              placeholder="Ex.: 2850 ou 2850,00"
              value={laborValue}
              onChange={(e) => setLaborValue(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={needsMaterial}
                onChange={(e) => setNeedsMaterial(e.target.checked)}
              />
              <span className="text-sm">Necessita materiais?</span>
            </label>

            {needsMaterial && (
              <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Materiais necessários</p>
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 px-3 py-1 text-sm hover:bg-white/10"
                    onClick={addMaterial}
                  >
                    + Adicionar
                  </button>
                </div>

                {materials.length === 0 && (
                  <p className="text-xs opacity-70">
                    Adicione somente se for necessário listar materiais no orçamento.
                  </p>
                )}

                {materials.map((m, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <input
                      className="sm:col-span-7 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none"
                      placeholder="Material (ex.: tinta acrílica branca)"
                      value={m.description}
                      onChange={(e) => updateMaterial(i, "description", e.target.value)}
                    />
                    <input
                      className="sm:col-span-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none"
                      placeholder="Qtd (opcional)"
                      value={m.quantity}
                      onChange={(e) => updateMaterial(i, "quantity", e.target.value)}
                    />
                    <button
                      type="button"
                      className="sm:col-span-1 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
                      onClick={() => removeMaterial(i)}
                      aria-label="Remover material"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className="mt-2 w-full rounded-lg bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar orçamento"}
          </button>
        </div>
      </div>
    </main>
  );
}
