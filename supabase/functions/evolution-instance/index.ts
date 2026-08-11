import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Get base URL and remove trailing slash if present
const rawUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_API_BASE_URL") || "https://api.evolution-api.com";
const EVOLUTION_API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Validate configuration
    if (!EVOLUTION_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "Evolution API não configurada. Adicione EVOLUTION_API_KEY nos secrets." 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!EVOLUTION_API_BASE_URL || EVOLUTION_API_BASE_URL === "https://api.evolution-api.com") {
      console.warn("EVOLUTION_API_URL não configurada ou usando URL padrão. Verifique se está correto.");
    }

    const body = await req.json().catch(() => ({ action: 'create-instance' }));
    const { action, instanceName } = body;

    console.log(`Evolution API Action: ${action}, Instance: ${instanceName || 'N/A'}`);
    console.log(`Evolution API URL: ${EVOLUTION_API_BASE_URL}`);

    // List all instances
    if (action === 'list-instances') {
      try {
        const headers: Record<string, string> = {
          "Accept": "application/json",
          "apikey": EVOLUTION_API_KEY,
        };

        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/fetchInstances`, {
          method: "GET",
          headers: headers,
        });

        const result = await response.json();
        console.log("List instances response:", JSON.stringify(result));

        // Evolution API returns an array of instances
        const instances = Array.isArray(result) ? result : (result?.instances || []);
        
        return new Response(
          JSON.stringify({ 
            instances: instances.map((inst: any) => ({
              instanceName: inst.instanceName || inst.name || inst.instance?.instanceName,
              state: inst.connectionStatus || inst.state || inst.instance?.state || 'unknown',
              profileName: inst.profileName || inst.instance?.profileName,
              profilePicUrl: inst.profilePictureUrl || inst.instance?.profilePictureUrl,
            })),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err) {
        console.error("List instances error:", err);
        return new Response(
          JSON.stringify({ 
            instances: [],
            error: err instanceof Error ? err.message : 'Erro ao listar instâncias',
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check connection status of an instance
    if (action === 'check-status') {
      if (!instanceName) {
        return new Response(
          JSON.stringify({ error: "instanceName é obrigatório para check-status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const headers: Record<string, string> = {
          "Accept": "application/json",
          "apikey": EVOLUTION_API_KEY,
        };

        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/connectionState/${instanceName}`, {
          method: "GET",
          headers: headers,
        });

        const result = await response.json();
        console.log("Check status response:", JSON.stringify(result));

        // Evolution API v2 returns state in different formats
        const state = result?.instance?.state || result?.state || result?.connectionState || 'unknown';
        const connected = state === 'open' || state === 'connected';

        return new Response(
          JSON.stringify({ 
            instanceName: instanceName,
            state: state,
            connected: connected,
            profileName: result?.instance?.profileName || result?.profileName,
            profilePicUrl: result?.instance?.profilePictureUrl || result?.profilePictureUrl,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err) {
        console.error("Check status error:", err);
        return new Response(
          JSON.stringify({ 
            instanceName: instanceName,
            state: 'error',
            connected: false,
            error: err instanceof Error ? err.message : 'Erro ao verificar status',
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // All other actions require instanceName
    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: "instanceName é obrigatório" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create instance and get QR code
    if (action === 'create-instance') {
      try {
        const headers1: Record<string, string> = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "apikey": EVOLUTION_API_KEY,
        };

        // Get webhook URL from Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

        // Body format - Evolution API v2 requires "integration" field
        // Include webhook configuration for automatic setup
        const requestBody: Record<string, any> = {
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: {
            url: webhookUrl,
            byEvents: false,
            base64: true,
            events: [
              "MESSAGES_UPSERT"
            ],
            webhookByEvents: false,
          },
        };

        console.log(`Webhook URL configured: ${webhookUrl}`);

        console.log(`Request URL: ${EVOLUTION_API_BASE_URL}/instance/create`);
        console.log(`Request body:`, JSON.stringify(requestBody));

        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/create`, {
          method: "POST",
          headers: headers1,
          body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();
        console.log(`Response status: ${response.status}`);
        console.log(`Response body: ${responseText.substring(0, 500)}`);

        // Check if response is ok
        if (!response.ok) {
          let errorMessage = `Erro HTTP ${response.status}`;
          try {
            const errorJson = JSON.parse(responseText);
            if (errorJson.response?.message) {
              errorMessage = Array.isArray(errorJson.response.message) 
                ? errorJson.response.message.join(", ")
                : errorJson.response.message;
            } else if (errorJson.message) {
              errorMessage = Array.isArray(errorJson.message) 
                ? errorJson.message.join(", ")
                : errorJson.message;
            } else if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch {
            errorMessage = responseText || errorMessage;
          }
          
          return new Response(
            JSON.stringify({ 
              created: false,
              error: errorMessage,
              instanceName: instanceName,
              status: response.status,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = JSON.parse(responseText);
        console.log("Create instance response:", JSON.stringify(result));

        // Check if instance was created successfully
        if (result?.instance) {
          const instanceState = result.instance.state || result.instance.status;
          const qrcodeValue = result?.qrcode?.base64 || result?.qrcode?.code || result?.qrcode || result?.base64;
          
          // If instance exists and has QR code, it was created successfully
          if (qrcodeValue) {
            return new Response(
              JSON.stringify({ 
                created: true,
                instanceName: instanceName,
                qrcode: qrcodeValue,
                pairingCode: result.pairingCode || null,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // If instance is already connected
          if (instanceState === 'open' || instanceState === 'connected') {
            return new Response(
              JSON.stringify({ 
                created: true,
                instanceName: instanceName,
                connected: true,
                message: 'Instância já existe e está conectada!',
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // Instance was created but needs QR code
          if (instanceState === 'close' || instanceState === 'disconnected' || !instanceState) {
            return new Response(
              JSON.stringify({ 
                created: true,
                instanceName: instanceName,
                message: 'Instância criada! Use o botão "Gerar QR Code" para conectar.',
                needsQRCode: true,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Check for QR code in various possible formats (fallback)
        const qrcodeValue = result?.qrcode?.base64 || result?.qrcode?.code || result?.qrcode || result?.base64;
        if (qrcodeValue) {
          return new Response(
            JSON.stringify({ 
              created: true,
              instanceName: instanceName,
              qrcode: qrcodeValue,
              pairingCode: result.pairingCode || null,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if instance is already connected (fallback)
        if (result?.instance?.state === 'open' || result?.state === 'open' || result?.status === 'open') {
          return new Response(
            JSON.stringify({ 
              created: true,
              instanceName: instanceName,
              connected: true,
              message: 'Instância já existe e está conectada!',
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Even if there's an error message, check if instance was actually created
        if (result?.instance && result.instance.instanceName) {
          console.log("Instance found in response despite error message:", result.instance);
          return new Response(
            JSON.stringify({ 
              created: true,
              instanceName: result.instance.instanceName || instanceName,
              message: 'Instância criada! Use o botão "Gerar QR Code" para conectar.',
              needsQRCode: true,
              details: result,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for errors in response
        const errorMessage = result.error?.message || result.error || result.message || 'Não foi possível criar instância';
        console.error("Failed to create instance:", errorMessage, result);
        
        return new Response(
          JSON.stringify({ 
            created: false,
            error: errorMessage,
            instanceName: instanceName,
            details: result,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err) {
        console.error("Create instance error:", err);
        return new Response(
          JSON.stringify({ 
            created: false,
            error: err instanceof Error ? err.message : 'Erro ao criar instância',
            instanceName: instanceName,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get QR code for existing instance
    if (action === 'get-qrcode') {
      try {
        const headers: Record<string, string> = {
          "Accept": "application/json",
          "apikey": EVOLUTION_API_KEY,
        };

        console.log(`Getting QR code for instance: ${instanceName}`);
        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: headers,
        });

        const result = await response.json();
        console.log("QR code response:", JSON.stringify(result));

        // Try multiple QR code formats
        const qrcodeValue = result?.qrcode?.base64 || 
                           result?.qrcode?.code || 
                           result?.qrcode ||
                           result?.base64 ||
                           result?.code;

        if (qrcodeValue && typeof qrcodeValue === 'string') {
          console.log("QR code found, returning...");
          return new Response(
            JSON.stringify({ 
              qrcode: qrcodeValue,
              instance: instanceName,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if already connected
        const state = result?.instance?.state || result?.state;
        if (state === 'open' || state === 'connected') {
          return new Response(
            JSON.stringify({ 
              connected: true,
              state: 'open',
              instance: instanceName,
              message: 'WhatsApp já está conectado!',
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If connecting, return status so frontend can retry
        if (state === 'connecting') {
          console.log("Instance is connecting, no QR code yet");
          return new Response(
            JSON.stringify({ 
              connecting: true,
              state: 'connecting',
              instance: instanceName,
              message: 'A aguardar QR code...',
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("No QR code found in response");
        return new Response(
          JSON.stringify({ 
            error: 'Não foi possível obter QR code',
            instance: instanceName,
            details: result,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err) {
        console.error("QR code error:", err);
        return new Response(
          JSON.stringify({ 
            error: err instanceof Error ? err.message : 'Erro ao obter QR Code',
            instance: instanceName,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Disconnect instance
    if (action === 'disconnect') {
      try {
        const headers: Record<string, string> = {
          "Accept": "application/json",
          "apikey": EVOLUTION_API_KEY,
        };

        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/logout/${instanceName}`, {
          method: "DELETE",
          headers: headers,
        });

        const result = await response.json();
        console.log("Disconnect response:", JSON.stringify(result));

        return new Response(
          JSON.stringify({ 
            disconnected: true,
            instanceName: instanceName,
            message: 'Instância desconectada!',
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err) {
        console.error("Disconnect error:", err);
        return new Response(
          JSON.stringify({ 
            disconnected: false,
            error: err instanceof Error ? err.message : 'Erro ao desconectar',
            instanceName: instanceName,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Delete instance completely
    if (action === 'delete-instance') {
      try {
        const headers: Record<string, string> = {
          "Accept": "application/json",
          "apikey": EVOLUTION_API_KEY,
        };

        console.log(`Deleting instance: ${instanceName}`);
        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/delete/${instanceName}`, {
          method: "DELETE",
          headers: headers,
        });

        const result = await response.json();
        console.log("Delete response:", JSON.stringify(result));

        return new Response(
          JSON.stringify({ 
            deleted: true,
            instanceName: instanceName,
            message: 'Instância eliminada com sucesso!',
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (err) {
        console.error("Delete error:", err);
        return new Response(
          JSON.stringify({ 
            deleted: false,
            error: err instanceof Error ? err.message : 'Erro ao eliminar instância',
            instanceName: instanceName,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Acção inválida. Use 'create-instance', 'get-qrcode', 'check-status', 'list-instances', 'disconnect' ou 'delete-instance'" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
