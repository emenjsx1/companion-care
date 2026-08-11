import { Bike, Car, Truck, Bus, ArrowRight, Clock, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useCourses } from '@/hooks/useCourses';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const categoryIcons: Record<string, React.ElementType> = {
  A: Bike,
  A1: Bike,
  A2: Bike,
  B: Car,
  C: Truck,
  C1: Truck,
  CE: Truck,
  D: Bus,
  E: Truck,
  ACC: Car,
};

const categoryLabels: Record<string, string> = {
  A: 'Mota',
  A1: 'Mota (até 125cc)',
  A2: 'Mota (até 35kW)',
  B: 'Ligeiro',
  C: 'Carga Pesada Profissional',
  C1: 'Pesados até 7.500kg',
  CE: 'C + Reboque',
  D: 'Pesados Passageiros',
  E: 'Reboques',
  ACC: 'Ações de Formação',
};

const categoryDurations: Record<string, string> = {
  A: '2-3 meses',
  A1: '2-3 meses',
  A2: '2-3 meses',
  B: '3-4 meses',
  C: '4-5 meses',
  C1: '3-4 meses',
  CE: '4-5 meses',
  D: '5-6 meses',
  E: '4-5 meses',
  ACC: '1-2 meses',
};

const Courses = () => {
  const { data: courses, isLoading } = useCourses();
  const { data: settings, isLoading: settingsLoading } = useSchoolSettings();

  // Filter only active courses
  const activeCourses = courses?.filter(c => c.is_active) || [];
  const inscriptionFee = settings?.inscription_fee || 300;

  return (
    <section id="cursos" className="py-20 bg-muted/50">
      <div className="container-section">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Nossos Cursos</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Escolha a sua categoria
          </h2>
          <p className="text-muted-foreground">
            Formação completa para todas as categorias. Pagamento facilitado em prestações.
          </p>
        </div>

        {/* Taxa de Inscrição Banner */}
        {!settingsLoading && inscriptionFee > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8 max-w-md mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
              <CreditCard className="h-5 w-5" />
              <span>Taxa de Inscrição: {formatCurrency(inscriptionFee)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aplicável a todos os cursos
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Cursos disponíveis em breve. Contacte-nos para mais informações.
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 mb-10 ${
            activeCourses.length === 1 ? 'max-w-sm mx-auto' :
            activeCourses.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
            activeCourses.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto' :
            'sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {activeCourses.map((course, index) => {
              const IconComponent = categoryIcons[course.category] || Car;
              const isPopular = course.category === 'B';
              const duration = categoryDurations[course.category] || '3-4 meses';
              const categoryLabel = categoryLabels[course.category] || course.category;

              return (
                <Card 
                  key={course.id} 
                  className={`relative overflow-hidden hover:shadow-lg transition-shadow ${
                    isPopular ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-xs font-semibold">
                      Mais Procurado
                    </div>
                  )}
                  
                  <CardHeader className={isPopular ? 'pt-8' : ''}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-lg font-bold">
                        {course.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">{categoryLabel}</p>
                    <p className="text-sm text-muted-foreground">{course.description || 'Formação completa'}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="bg-muted rounded-lg p-3 text-center mb-4">
                      <div className="text-xs text-muted-foreground">A partir de</div>
                      <div className="text-xl font-bold text-primary">{formatCurrency(Number(course.price))}</div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration_hours}h de formação ({duration})</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <a href="#contactos">
            <Button size="lg" className="gap-2">
              Pedir Informações
              <ArrowRight className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Courses;
