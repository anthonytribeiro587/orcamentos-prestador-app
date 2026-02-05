import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function formatBRLFromCents(cents?: number | null) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return String(iso);
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(req: NextRequest) {
  // /api/quotes/<id>/pdf
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  const quoteId = parts[2];

  if (!quoteId || !isUuid(quoteId)) {
    return NextResponse.json(
      { error: "invalid id", details: `path=${req.nextUrl.pathname}` },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = sessionData.session.user.id;

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("id, user_id, category_name_snapshot, service_description, labor_value_cents, needs_material, created_at")
    .eq("id", quoteId)
    .eq("user_id", userId)
    .single();

  if (qErr || !quote) {
    return NextResponse.json(
      { error: "quote not found", details: qErr?.message ?? "no row" },
      { status: 404 }
    );
  }

  const { data: materials } = await supabase
    .from("quote_material_items")
    .select("description, quantity, sort_order")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  const title = escapeHtml(quote.category_name_snapshot ?? "Orçamento");
  const desc = escapeHtml((quote.service_description ?? "").trim());
  const value = formatBRLFromCents(quote.labor_value_cents);
  const createdAt = formatDateBR(quote.created_at);

  const materialsHtml =
    materials && materials.length
      ? materials
          .map((m) => {
            const d = escapeHtml(m.description ?? "");
            const q = m.quantity ? escapeHtml(String(m.quantity)) : "";
            return `<tr>
              <td>${d}</td>
              <td style="text-align:right; color:#111827">${q || "—"}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="2" style="color:#6b7280">Nenhum material informado.</td></tr>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orçamento</title>
  <style>
    :root{
      --bg:#f3f4f6;
      --paper:#ffffff;
      --text:#111827;
      --muted:#6b7280;
      --line:#e5e7eb;
      --brand:#111827;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      background:var(--bg);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:var(--text);
      padding:24px;
    }
    .page{
      max-width: 820px;
      margin: 0 auto;
      background:var(--paper);
      border:1px solid var(--line);
      border-radius:14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.06);
      overflow:hidden;
    }
    .header{
      padding:22px 24px;
      border-bottom:1px solid var(--line);
      display:flex;
      justify-content:space-between;
      gap:16px;
      align-items:flex-start;
    }
    .brand{
      font-weight:800;
      letter-spacing:.2px;
      font-size:18px;
      color:var(--brand);
      line-height:1.2;
    }
    .meta{
      text-align:right;
      font-size:12px;
      color:var(--muted);
      line-height:1.6;
      white-space:nowrap;
    }
    .content{
      padding:24px;
      display:grid;
      gap:18px;
    }
    .card{
      border:1px solid var(--line);
      border-radius:12px;
      padding:16px;
    }
    .title{
      margin:0;
      font-size:18px;
      font-weight:800;
    }
    .subtitle{
      margin-top:6px;
      font-size:13px;
      color:var(--muted);
    }
    .row{
      margin-top:12px;
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:flex-start;
    }
    .label{
      font-size:12px;
      color:var(--muted);
      margin-bottom:4px;
    }
    .value{
      font-size:14px;
      font-weight:700;
      color:var(--text);
      white-space:nowrap;
    }
    .desc{
      margin-top:10px;
      font-size:13px;
      color:#374151;
      white-space:pre-wrap;
      line-height:1.5;
    }
    table{
      width:100%;
      border-collapse:collapse;
      margin-top:10px;
      font-size:13px;
    }
    th, td{
      padding:10px 8px;
      border-bottom:1px solid var(--line);
      text-align:left;
      vertical-align:top;
    }
    th{
      font-size:12px;
      color:var(--muted);
      font-weight:700;
    }
    .total{
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:14px 16px;
      border:1px solid var(--line);
      border-radius:12px;
      background:#fafafa;
      margin-top:4px;
    }
    .total strong{font-size:16px}
    .footer{
      padding:18px 24px;
      border-top:1px solid var(--line);
      color:var(--muted);
      font-size:12px;
      display:flex;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
    }
    @media print{
      body{background:#fff; padding:0}
      .page{box-shadow:none; border:none; border-radius:0}
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">Orçamento de Serviços</div>
        <div class="subtitle">Gerado pelo sistema</div>
      </div>
      <div class="meta">
        <div><strong>ID:</strong> ${quoteId}</div>
        <div><strong>Data:</strong> ${createdAt || "—"}</div>
      </div>
    </div>

    <div class="content">
      <div class="card">
        <h1 class="title">${title}</h1>
        <div class="subtitle">Categoria do serviço</div>

        ${desc ? `<div class="desc">${desc}</div>` : ""}

        <div class="row">
          <div>
            <div class="label">Valor mão de obra</div>
            <div class="value">${value}</div>
          </div>
          <div style="text-align:right">
            <div class="label">Materiais</div>
            <div class="value">${quote.needs_material ? "Necessita" : "Não informado"}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="label" style="font-weight:700; color:var(--text)">Materiais necessários</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:right">Qtd (opcional)</th>
            </tr>
          </thead>
          <tbody>
            ${materialsHtml}
          </tbody>
        </table>
      </div>

      <div class="total">
        <span style="color:var(--muted); font-size:12px">Total (mão de obra)</span>
        <strong>${value}</strong>
      </div>
    </div>

    <div class="footer">
      <div>Observação: materiais podem ser fornecidos pelo cliente ou pelo prestador conforme combinado.</div>
      <div>Assinatura: __________________________</div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // sugestão: deixa fácil salvar como PDF no navegador
      "Content-Disposition": `inline; filename="orcamento-${quoteId}.html"`,
    },
  });
}
