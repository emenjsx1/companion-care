import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_BASE_URL = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_API_BASE_URL") || "https://api.evolution-api.com";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

interface DailyStats {
  newStudents: number;
  activeStudents: number;
  totalRevenue: number;
  paymentsReceived: number;
  pendingPayments: number;
  pendingAmount: number;
  examsToday: number;
  examsUpcoming: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
  }).format(amount);
}

function formatReportMessage(stats: DailyStats): string {
  return `📊 *Relatório Diário - Rodauto*

📅 Data: ${new Date().toLocaleDateString('pt-MZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

👥 *Alunos*
• Novos alunos hoje: ${stats.newStudents}
• Total de alunos ativos: ${stats.activeStudents}

💰 *Financeiro*
• Receitas de hoje: ${formatCurrency(stats.totalRevenue)}
• Pagamentos recebidos: ${stats.paymentsReceived}
• Pagamentos pendentes: ${stats.pendingPayments}
• Valor pendente: ${formatCurrency(stats.pendingAmount)}

📝 *Exames*
• Exames hoje: ${stats.examsToday}
• Exames próximos (7 dias): ${stats.examsUpcoming}

Bom trabalho! 🚗`;
}

async function sendWhatsAppMessage(phone: string, message: string, instanceName: string = "rodauto") {
  if (!EVOLUTION_API_KEY) {
    throw new Error("Evolution API not configured - EVOLUTION_API_KEY missing");
  }

  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('258')) {
    formattedPhone = '258' + formattedPhone;
  }

  console.log(`Sending daily report to: ${formattedPhone} via instance: ${instanceName}`);

  const response = await fetch(`${EVOLUTION_API_BASE_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: formattedPhone,
      text: message,
    }),
  });

  const result = await response.json();
  console.log("Evolution API response:", JSON.stringify(result));

  if (!response.ok) {
    console.error("Evolution API error:", result);
    throw new Error(`WhatsApp send failed: ${result.error?.message || result.message || JSON.stringify(result)}`);
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let requestBody: { phone?: string; instanceName?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body provided
    }

    let recipientPhone = requestBody.phone;
    let instanceName = requestBody.instanceName || "rodauto";

    if (!recipientPhone) {
      const { data: settings } = await supabase
        .from('school_settings')
        .select('value')
        .eq('key', 'daily_report')
        .maybeSingle();

      if (!settings?.value) {
        return new Response(
          JSON.stringify({ error: "Configurações do relatório diário não encontradas" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reportSettings = settings.value as { enabled?: boolean; phone?: string; instance_name?: string };
      
      if (!reportSettings.enabled && !requestBody.phone) {
        return new Response(
          JSON.stringify({ message: "Relatório diário não está activado" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipientPhone = reportSettings.phone;
      instanceName = reportSettings.instance_name || instanceName;
    }

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ error: "Número de destino não configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating daily report for phone: ${recipientPhone}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: newStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const { count: activeStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { data: paymentsToday } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', today.toISOString().split('T')[0])
      .lt('payment_date', tomorrow.toISOString().split('T')[0])
      .eq('status', 'paid');

    const totalRevenue = paymentsToday?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const paymentsReceived = paymentsToday?.length || 0;

    const { data: allPendingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending');

    const pendingAmount = allPendingPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingPaymentsCount = allPendingPayments?.length || 0;

    const { count: examsToday } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .gte('exam_date', today.toISOString().split('T')[0])
      .lt('exam_date', tomorrow.toISOString().split('T')[0]);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { count: examsUpcoming } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .gte('exam_date', tomorrow.toISOString().split('T')[0])
      .lt('exam_date', nextWeek.toISOString().split('T')[0]);

    const stats: DailyStats = {
      newStudents: newStudents || 0,
      activeStudents: activeStudents || 0,
      totalRevenue,
      paymentsReceived,
      pendingPayments: pendingPaymentsCount,
      pendingAmount,
      examsToday: examsToday || 0,
      examsUpcoming: examsUpcoming || 0,
    };

    console.log("Stats calculated:", stats);

    const message = formatReportMessage(stats);
    await sendWhatsAppMessage(recipientPhone, message, instanceName);

    return new Response(
      JSON.stringify({ success: true, message: "Relatório diário enviado com sucesso", stats }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
