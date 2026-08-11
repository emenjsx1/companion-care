import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvolutionWebhookEvent {
  event: string;
  instance: string;
  data: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
      imageMessage?: {
        caption?: string;
        url?: string;
      };
      audioMessage?: {
        url?: string;
      };
      videoMessage?: {
        caption?: string;
        url?: string;
      };
      documentMessage?: {
        fileName?: string;
        url?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload: EvolutionWebhookEvent = await req.json();
    
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    // Only process incoming messages (not sent by us)
    if (payload.event !== "messages.upsert") {
      console.log("Ignoring event:", payload.event);
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if message is from us (fromMe = true means we sent it)
    if (payload.data?.key?.fromMe) {
      console.log("Ignoring own message");
      return new Response(
        JSON.stringify({ success: true, message: "Own message ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = payload.data;
    const remoteJid = data.key?.remoteJid || "";
    const messageId = data.key?.id || "";
    const senderName = data.pushName || "";
    
    // Extract phone number from JID (format: 258XXXXXXXXX@s.whatsapp.net)
    const senderPhone = remoteJid.split("@")[0] || "";
    
    // Skip group messages (groups have @g.us suffix)
    if (remoteJid.includes("@g.us")) {
      console.log("Ignoring group message");
      return new Response(
        JSON.stringify({ success: true, message: "Group message ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract message content based on type
    let messageText = "";
    let messageType = "text";
    let mediaUrl = "";

    const message = data.message;
    if (message) {
      if (message.conversation) {
        messageText = message.conversation;
        messageType = "text";
      } else if (message.extendedTextMessage?.text) {
        messageText = message.extendedTextMessage.text;
        messageType = "text";
      } else if (message.imageMessage) {
        messageText = message.imageMessage.caption || "[Imagem]";
        messageType = "image";
        mediaUrl = message.imageMessage.url || "";
      } else if (message.audioMessage) {
        messageText = "[Áudio]";
        messageType = "audio";
        mediaUrl = message.audioMessage.url || "";
      } else if (message.videoMessage) {
        messageText = message.videoMessage.caption || "[Vídeo]";
        messageType = "video";
        mediaUrl = message.videoMessage.url || "";
      } else if (message.documentMessage) {
        messageText = message.documentMessage.fileName || "[Documento]";
        messageType = "document";
        mediaUrl = message.documentMessage.url || "";
      } else {
        messageText = "[Mensagem não suportada]";
        messageType = "unknown";
      }
    }

    if (!messageText && !mediaUrl) {
      console.log("No message content found");
      return new Response(
        JSON.stringify({ success: true, message: "No content" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate message
    const { data: existing } = await supabase
      .from("whatsapp_received_messages")
      .select("id")
      .eq("message_id", messageId)
      .single();

    if (existing) {
      console.log("Duplicate message ignored:", messageId);
      return new Response(
        JSON.stringify({ success: true, message: "Duplicate ignored" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const { error: insertError } = await supabase
      .from("whatsapp_received_messages")
      .insert({
        sender_phone: senderPhone,
        sender_name: senderName || null,
        message: messageText,
        message_type: messageType,
        media_url: mediaUrl || null,
        instance_name: payload.instance || "rodauto",
        remote_jid: remoteJid,
        message_id: messageId,
        is_read: false,
      });

    if (insertError) {
      console.error("Error saving message:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Message saved successfully from:", senderPhone);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
