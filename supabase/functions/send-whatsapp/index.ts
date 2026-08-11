import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_BASE_URL = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_API_BASE_URL") || "https://api.evolution-api.com";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

interface WhatsAppRequest {
  phone: string;
  message: string;
  instanceName?: string;
  logMessage?: boolean;
  campaignName?: string;
  recipientName?: string;
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
          error: "Evolution API não configurada. Por favor, configure EVOLUTION_API_KEY nos secrets." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { 
      phone, 
      message, 
      instanceName = "rodauto",
      logMessage = false,
      campaignName,
      recipientName,
    }: WhatsAppRequest = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Telefone e mensagem são obrigatórios" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Format for Mozambique (add country code if not present)
    const formattedPhone = cleanPhone.startsWith("258") 
      ? cleanPhone 
      : `258${cleanPhone}`;

    console.log(`Sending WhatsApp to: ${formattedPhone} via Evolution API`);

    // Send message via Evolution API
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    const result = await response.json();
    const success = response.ok && !result.error;

    console.log("Evolution API response:", JSON.stringify(result));

    // Log message to database if requested
    if (logMessage) {
      try {
        const authHeader = req.headers.get('Authorization');
        let senderUserId = null;
        
        if (authHeader) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          senderUserId = user?.id;
          
          if (senderUserId) {
            await supabase.from('whatsapp_message_logs').insert({
              sender_user_id: senderUserId,
              recipient_phone: formattedPhone,
              recipient_name: recipientName || null,
              message: message.substring(0, 1000),
              status: success ? 'sent' : 'failed',
              error: success ? null : (result.error?.message || result.message || 'Unknown error'),
              campaign_name: campaignName || null,
            });
          }
        }
      } catch (logError) {
        console.error('Error logging message:', logError);
      }
    }

    if (!success) {
      console.error("Evolution API error:", result);
      return new Response(
        JSON.stringify({ error: result.error?.message || result.message || result.error || "Erro ao enviar mensagem" }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Message sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
