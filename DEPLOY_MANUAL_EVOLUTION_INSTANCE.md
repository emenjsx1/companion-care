# Guia de Deploy Manual - Função evolution-instance

## Passo a Passo para Criar a Função no Supabase Dashboard

### 1. Acessar o Dashboard do Supabase
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto correto (xzvafzivobwdknvivxwi)

### 2. Navegar até Edge Functions
1. No menu lateral esquerdo, clique em **"Edge Functions"** (ou "Functions")
2. Se já existir uma função chamada `evolution-instance`, clique nela para editar
3. Se não existir, clique em **"Create a new function"** ou **"New Function"**

### 3. Criar/Editar a Função
1. **Nome da função**: `evolution-instance`
2. Clique em **"Create function"** ou **"Edit"**

### 4. Copiar e Colar o Código
Copie TODO o código abaixo e cole no editor da função:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const EVOLUTION_API_BASE_URL = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_API_BASE_URL") || "https://api.evolution-api.com";
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

    const body = await req.json().catch(() => ({ action: 'create-instance' }));
    const { action, instanceName } = body;

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: "instanceName é obrigatório" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Evolution API Action: ${action}, Instance: ${instanceName}`);

    // Create instance and get QR code
    if (action === 'create-instance') {
      try {
        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            instanceName: instanceName,
            token: instanceName,
            qrcode: true,
          }),
        });

        const result = await response.json();
        console.log("Create instance response:", JSON.stringify(result));

        if (result?.qrcode?.base64 || result?.qrcode?.code) {
          return new Response(
            JSON.stringify({ 
              created: true,
              instanceName: instanceName,
              qrcode: result.qrcode.base64 || result.qrcode.code,
              pairingCode: result.pairingCode || null,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (result?.instance?.state === 'open') {
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

        return new Response(
          JSON.stringify({ 
            created: false,
            error: result.error?.message || result.message || 'Não foi possível criar instância',
            instanceName: instanceName,
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
        const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
        });

        const result = await response.json();
        console.log("QR code response:", JSON.stringify(result));

        if (result?.qrcode?.base64 || result?.qrcode?.code) {
          return new Response(
            JSON.stringify({ 
              qrcode: result.qrcode.base64 || result.qrcode.code,
              instance: instanceName,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (result?.instance?.state === 'open') {
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

        return new Response(
          JSON.stringify({ 
            error: 'Não foi possível obter QR code',
            instance: instanceName,
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

    return new Response(
      JSON.stringify({ error: "Acção inválida. Use 'create-instance' ou 'get-qrcode'" }),
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
```

### 5. Salvar e Deploy
1. Clique em **"Deploy"** ou **"Save"** (dependendo da interface)
2. Aguarde alguns segundos até o deploy completar
3. Você verá uma mensagem de sucesso

### 6. Verificar Secrets
Certifique-se de que as seguintes secrets estão configuradas:
- `EVOLUTION_API_KEY` ✅ (já configurada)
- `EVOLUTION_API_URL` ✅ (já configurada)

### 7. Testar
Após o deploy, teste criando uma instância na página de Settings:
1. Acesse: `http://localhost:8081/admin/settings`
2. Vá para a aba "Integrações"
3. Digite um nome de instância e clique em "Criar"

## Notas Importantes

- A função deve se chamar exatamente: `evolution-instance`
- O código usa as secrets `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` que já estão configuradas
- O CORS está configurado corretamente para permitir requisições do frontend

## Se Encontrar Problemas

1. Verifique os logs da função no Dashboard do Supabase
2. Confirme que as secrets estão configuradas corretamente
3. Verifique se a URL da Evolution API está correta

