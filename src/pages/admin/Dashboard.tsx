import { useState } from 'react';
import { Users, TrendingUp, CreditCard, FileCheck, AlertTriangle, Calendar, ArrowUp, ArrowDown, Loader2, AlertCircle, FileDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { useDashboardStats, useMonthlyChartData, useRecentAlerts } from '@/hooks/useDashboardStats';
import { useExams } from '@/hooks/useExams';
import { formatCurrency } from '@/lib/currency';
import { DateRangeFilter, getDefaultDateRange, type DateRange } from '@/components/admin/DateRangeFilter';
import { exportPaymentsToPDF } from '@/lib/exportPdf';
import { usePayments } from '@/hooks/usePayments';

// Local (not UTC) YYYY-MM-DD so "hoje" isn't shifted by timezone
const toDayString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const { data: chartData, isLoading: chartLoading } = useMonthlyChartData();
  const { data: alerts, isLoading: alertsLoading } = useRecentAlerts();
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: payments } = usePayments({
    startDate: toDayString(dateRange.startDate),
    endDate: toDayString(dateRange.endDate),
  });

  const handleExportPDF = () => {
    if (payments && payments.length > 0) {
      exportPaymentsToPDF(payments, `Relatório ${dateRange.label}`);
    }
  };

  const stats = [
    {
      title: 'Alunos Activos',
      value: dashboardStats?.totalActiveStudents || 0,
      icon: Users,
      change: `+${dashboardStats?.studentsThisMonth || 0} · ${dateRange.label.toLowerCase()}`,
      changeType: 'positive' as const,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Receita do Período',
      value: formatCurrency(dashboardStats?.monthlyRevenue || 0),
      icon: CreditCard,
      change: dateRange.label,
      changeType: 'neutral' as const,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Exames Pendentes',
      value: dashboardStats?.pendingExams || 0,
      icon: FileCheck,
      change: 'Agendados',
      changeType: 'neutral' as const,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      title: 'Pagamentos Pendentes',
      value: dashboardStats?.pendingPayments || 0,
      subValue: dashboardStats?.pendingAmount ? formatCurrency(dashboardStats.pendingAmount) : undefined,
      icon: AlertCircle,
      change: dashboardStats?.pendingPayments ? `${dashboardStats.pendingPayments} pendente(s)` : 'Tudo em dia',
      changeType: dashboardStats?.pendingPayments ? 'neutral' as const : 'positive' as const,
      color: dashboardStats?.pendingPayments ? 'text-warning' : 'text-muted-foreground',
      bg: dashboardStats?.pendingPayments ? 'bg-warning/10' : 'bg-muted',
    },
  ];

  const upcomingExams = exams?.filter(e => e.status === 'scheduled').slice(0, 5) || [];

  // Prepare chart data
  const studentsChartData = chartData?.studentsData.map(d => ({
    month: d.month,
    alunos: d.students,
  })) || [];

  const revenueChartData = chartData?.revenueData.map(d => ({
    month: d.month,
    receita: d.revenue,
  })) || [];

  if (statsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da Rodauto - Escola de Condução</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!payments?.length}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    {stat.subValue && (
                      <p className="text-sm font-medium text-destructive">{stat.subValue}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      {stat.changeType === 'positive' && (
                        <ArrowUp className="h-3 w-3 text-success" />
                      )}
                      <span className={`text-xs ${
                        stat.changeType === 'positive' ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Alunos</CardTitle>
              <CardDescription>Novos alunos nos últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value} alunos`, 'Novos']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="alunos" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Receitas</CardTitle>
              <CardDescription>Receitas nos últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {chartLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                      />
                      <Bar 
                        dataKey="receita" 
                        fill="hsl(var(--success))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Upcoming Exams */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas
              </CardTitle>
              <CardDescription>Itens que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : alerts && alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 rounded-full mt-2 bg-info" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum alerta no momento
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Exames
              </CardTitle>
              <CardDescription>Exames agendados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {examsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : upcomingExams.length > 0 ? upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exam.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.exam_type === 'codigo' ? 'Exame de Código' : 'Exame de Condução'}
                    </p>
                  </div>
                  <Badge variant="default">
                    {new Date(exam.exam_date).toLocaleDateString('pt-MZ', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum exame agendado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
