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

    const body = await req.json();
    const amount = Number(body?.amount);
    const email = String(body?.payer?.email || "").trim().toLowerCase();
    const cpf = String(body?.payer?.cpf || "").replace(/\D/g, "");
    const description = String(body?.description || "Pedido ELNORA").slice(0, 120);
    const externalReference = String(body?.external_reference || crypto.randomUUID()).slice(0, 64);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 50000) {
      return json({ error: "Valor do pagamento inválido." }, 400);
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "E-mail do pagador inválido." }, 400);
    if (!/^\d{11}$/.test(cpf)) return json({ error: "CPF do pagador inválido." }, 400);

    const idempotencyKey = String(body?.idempotency_key || crypto.randomUUID()).slice(0, 64);
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(amount * 100) / 100,
        description,
        payment_method_id: "pix",
        external_reference: externalReference,
        payer: {
          email,
          identification: { type: "CPF", number: cpf },
        },
      }),
    });

    const mp = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error("Mercado Pago create payment error", mpResponse.status, mp);
      return json({ error: "Não foi possível gerar o Pix no Mercado Pago.", details: mp?.message || null }, 502);
    }

    const tx = mp?.point_of_interaction?.transaction_data || {};
    return json({
      payment_id: mp.id,
      status: mp.status,
      status_detail: mp.status_detail,
      amount: mp.transaction_amount,
      external_reference: mp.external_reference,
      date_of_expiration: mp.date_of_expiration,
      qr_code: tx.qr_code || null,
      qr_code_base64: tx.qr_code_base64 || null,
      ticket_url: tx.ticket_url || null,
    });
  } catch (error) {
    console.error("create-payment unexpected error", error);
    return json({ error: "Erro interno ao gerar o Pix." }, 500);
  }
});
