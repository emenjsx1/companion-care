import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_BASE_URL = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_API_BASE_URL") || "https://api.evolution-api.com";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

interface Recipient {
  phone: string;
  name: string;
}

interface BulkRequest {
  recipients: Recipient[];
  message: string;
  instanceName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!EVOLUTION_API_KEY) {
      console.error("Evolution API key missing");
      return new Response(
        JSON.stringify({
          error: "Evolution API não configurada. Configure EVOLUTION_API_KEY nos secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { recipients, message, instanceName = "rodauto" }: BulkRequest = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Lista de destinatários é obrigatória" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Sending bulk WhatsApp to ${recipients.length} recipients via Evolution API`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send messages with delay to avoid rate limiting
    for (const recipient of recipients) {
      try {
        // Clean phone number
        const cleanPhone = recipient.phone.replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("258") 
          ? cleanPhone 
          : `258${cleanPhone}`;

        // Replace {nome} in message
        const personalizedMessage = message.replace(/{nome}/g, recipient.name);

        const response = await fetch(`${EVOLUTION_API_BASE_URL}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: personalizedMessage,
          }),
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          sent++;
          console.log(`Message sent to ${formattedPhone}`);
        } else {
          failed++;
          errors.push(`${recipient.name}: ${result.error?.message || result.message || 'Erro desconhecido'}`);
          console.error(`Failed to send to ${formattedPhone}:`, result);
        }

        // Add delay between messages (500ms) to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        failed++;
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push(`${recipient.name}: ${errorMessage}`);
        console.error(`Error sending to ${recipient.name}:`, err);
      }
    }

    console.log(`Bulk send complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        failed,
        total: recipients.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
