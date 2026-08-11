import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import logoRodauto from '@/assets/logo-rodauto.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '#sobre', label: 'Sobre' },
    { href: '#cursos', label: 'Cursos' },
    { href: '#galeria', label: 'Galeria' },
    { href: '#testemunhos', label: 'Testemunhos' },
    { href: '#contactos', label: 'Contactos' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm shadow-sm">
      <div className="container-section">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img 
              src={logoRodauto} 
              alt="Rodauto - Escola de Condução" 
              className="h-16 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/90 hover:text-white transition-colors font-medium text-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <a href="tel:+258821081004" className="hidden lg:flex items-center gap-2 text-white font-semibold text-sm">
              <Phone className="h-4 w-4" />
              82 108 100 4
            </a>
            <Link to="/admin">
              <Button size="sm" variant="outline" className="hidden sm:flex bg-white text-primary hover:bg-white/90 border-white">
                Entrar
              </Button>
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white/90 hover:text-white transition-colors font-medium py-3 px-2"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full mt-2 bg-white text-primary hover:bg-white/90 border-white">
                  Entrar
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
