const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) return json({ error: "Mercado Pago ainda não foi conectado." }, 503);
    const { payment_id } = await req.json();
    const id = String(payment_id || "").replace(/\D/g, "");
    if (!id) return json({ error: "Pagamento inválido." }, 400);
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    const mp = await response.json();
    if (!response.ok) return json({ error: "Não foi possível consultar o pagamento." }, 502);
    return json({ payment_id: mp.id, status: mp.status, status_detail: mp.status_detail });
  } catch (error) {
    console.error("payment-status unexpected error", error);
    return json({ error: "Erro interno ao consultar o pagamento." }, 500);
  }
});
