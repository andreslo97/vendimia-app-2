const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type RegistrationEmailBody = {
  fullName?: string;
  email?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("REGISTRATION_EMAIL_FROM");

  if (!resendApiKey || !fromEmail) {
    return new Response(JSON.stringify({ error: "Email service is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const body = (await req.json()) as RegistrationEmailBody;
  const email = body.email?.trim();
  const fullName = body.fullName?.trim() || "Bienvenido";

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "Registro creado - Iglesia Vendimia Internacional",
      html: `
        <div style="background:#111111;color:#ffffff;font-family:Arial,sans-serif;padding:32px;">
          <div style="max-width:560px;margin:0 auto;background:#1F1F1F;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:28px;">
            <h1 style="color:#D99A1E;margin:0 0 16px;">Iglesia Vendimia Internacional</h1>
            <p style="font-size:18px;line-height:1.5;margin:0 0 16px;">Hola ${fullName},</p>
            <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
              Tu registro en la app Iglesia Vendimia Internacional fue creado exitosamente.
            </p>
            <p style="font-size:16px;line-height:1.6;margin:0;">
              Gracias por hacer parte de nuestra comunidad. Mi casa es tu casa.
            </p>
          </div>
        </div>
      `,
      text: `Hola ${fullName}, tu registro en la app Iglesia Vendimia Internacional fue creado exitosamente. Gracias por hacer parte de nuestra comunidad. Mi casa es tu casa.`
    })
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Email could not be sent" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
