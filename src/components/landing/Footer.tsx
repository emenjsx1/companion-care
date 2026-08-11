import { Facebook, Instagram, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import logoRodauto from '@/assets/logo-rodauto.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container-section py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="mb-4">
              <img 
                src={logoRodauto} 
                alt="Rodauto" 
                className="h-20 w-auto brightness-0 invert opacity-90"
              />
            </div>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Escola de Condução certificada pelo INATTER. 
              A formar condutores há mais de 15 anos em Quelimane.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://wa.me/258821081004" className="w-9 h-9 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-[#25D366] transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#sobre" className="text-secondary-foreground/70 hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#cursos" className="text-secondary-foreground/70 hover:text-primary transition-colors">Cursos</a></li>
              <li><a href="#galeria" className="text-secondary-foreground/70 hover:text-primary transition-colors">Galeria</a></li>
              <li><a href="#testemunhos" className="text-secondary-foreground/70 hover:text-primary transition-colors">Testemunhos</a></li>
              <li><a href="#contactos" className="text-secondary-foreground/70 hover:text-primary transition-colors">Contactos</a></li>
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h3 className="font-semibold mb-4">Categorias</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-secondary-foreground/70">Categoria A - Motociclos</span></li>
              <li><span className="text-secondary-foreground/70">Categoria B - Ligeiros</span></li>
              <li><span className="text-secondary-foreground/70">Categoria C - Pesados</span></li>
              <li><span className="text-secondary-foreground/70">Categoria D - Passageiros</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contactos</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-secondary-foreground/70">Av. Samora Machel nº 81<br />Quelimane, Zambézia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-secondary-foreground/70">24 21 39 97 / 82 108 100 4</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-secondary-foreground/70">info@rodauto.co.mz</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-10 pt-6">
          <p className="text-center text-sm text-secondary-foreground/50">
            © {currentYear} Rodauto - Escola de Condução. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
