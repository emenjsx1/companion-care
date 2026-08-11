import { ArrowRight, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroHeadline from '@/assets/hero-headline.png';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
      {/* Simple background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container-section relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 sm:mb-6 leading-tight">
              Aprenda a conduzir com quem sabe ensinar
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/85 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
              Formação completa para todas as categorias de carta de condução. 
              Instrutores experientes e preços acessíveis em Quelimane.
            </p>

            {/* CTA Buttons - Improved for mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-10 px-4 sm:px-0">
              <a href="#contactos" className="w-full sm:w-auto">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 w-full font-bold text-base sm:text-lg px-6 sm:px-8 py-6 shadow-lg">
                  Inscreva-se Já
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <a href="tel:+258821081004" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10 w-full gap-2 text-base sm:text-lg px-6 sm:px-8 py-6 font-bold shadow-lg"
                >
                  <Phone className="h-5 w-5" />
                  Ligar Agora
                </Button>
              </a>
            </div>

            {/* Location */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-primary-foreground/90 text-sm sm:text-base">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span>Av. Samora Machel nº 81, Quelimane</span>
            </div>
          </div>

          {/* Promo Image Side - Now visible on mobile too */}
          <div className="flex justify-center lg:justify-end items-start order-1 lg:order-2">
            <div className="relative">
              <img 
                src={heroHeadline} 
                alt="Rodauto - A carta que abre portas" 
                className="relative w-[260px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-auto rounded-2xl shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-2xl mx-auto lg:mx-0">
          <div className="text-center lg:text-left">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">20+</div>
            <div className="text-xs sm:text-sm text-primary-foreground/70">Anos de experiência</div>
          </div>
          <div className="text-center lg:text-left">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">3000+</div>
            <div className="text-xs sm:text-sm text-primary-foreground/70">Alunos formados</div>
          </div>
          <div className="text-center lg:text-left">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">90%</div>
            <div className="text-xs sm:text-sm text-primary-foreground/70">Taxa de aprovação</div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L60 73.3C120 66.7 240 53.3 360 48C480 42.7 600 45.3 720 50.7C840 56 960 64 1080 64C1200 64 1320 56 1380 52L1440 48V80H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
