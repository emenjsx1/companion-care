import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Amélia Machava',
      location: 'Quelimane',
      text: 'Excelente escola! Instrutores muito pacientes. Tirei a carta à primeira tentativa.',
      avatar: 'AM',
    },
    {
      name: 'Carlos Tembe',
      location: 'Nicoadala',
      text: 'Preços justos e boa qualidade de ensino. Recomendo a todos.',
      avatar: 'CT',
    },
    {
      name: 'Fátima Sitoe',
      location: 'Quelimane',
      text: 'Tinha medo de conduzir mas os instrutores ajudaram-me muito. Hoje conduzo com confiança.',
      avatar: 'FS',
    },
    {
      name: 'João Nhaca',
      location: 'Mocuba',
      text: 'Fiz o curso de pesados e fui aprovado à primeira. Muito bem organizado.',
      avatar: 'JN',
    },
  ];

  return (
    <section id="testemunhos" className="py-20 bg-muted/50">
      <div className="container-section">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Testemunhos</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            O que dizem os nossos alunos
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                
                {/* Rating */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-muted-foreground text-sm mb-4">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
