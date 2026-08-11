import { CheckCircle, Users, Car, Award, Clock } from 'lucide-react';

const About = () => {
  const highlights = [
    'Instrutores certificados pelo INATTER',
    'Viaturas modernas e bem conservadas',
    'Horários flexíveis (manhã, tarde e noite)',
    'Acompanhamento personalizado',
    'Pagamento em prestações',
    'Aulas teóricas e práticas completas',
  ];

  return (
    <section id="sobre" className="py-20 bg-background">
      <div className="container-section">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Sobre Nós</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
              Há mais de 15 anos a formar condutores em Quelimane
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              A Escola de Condução Rodauto é uma referência no ensino da condução na Zambézia. 
              Com uma equipa de instrutores experientes, garantimos a melhor preparação 
              para a obtenção da sua carta de condução.
            </p>

            {/* Highlights */}
            <div className="grid sm:grid-cols-2 gap-3">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">3000+</div>
              <div className="text-sm text-muted-foreground">Alunos Formados</div>
            </div>
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">90%</div>
              <div className="text-sm text-muted-foreground">Taxa de Aprovação</div>
            </div>
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">15+</div>
              <div className="text-sm text-muted-foreground">Anos de Experiência</div>
            </div>
            <div className="bg-primary/5 p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">8</div>
              <div className="text-sm text-muted-foreground">Instrutores</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
