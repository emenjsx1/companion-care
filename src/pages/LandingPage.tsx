import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import Courses from '@/components/landing/Courses';
import Gallery from '@/components/landing/Gallery';
import Testimonials from '@/components/landing/Testimonials';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/landing/Footer';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const LandingPage = () => {
  const whatsappNumber = '258821081004';
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de obter mais informações sobre os cursos da Rodauto.');

  return (
    <div className="min-h-screen">
      <PWAInstallPrompt />
      <Header />
      <Hero />
      <About />
      <Courses />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />

      {/* Floating WhatsApp Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:scale-110 group"
              aria-label="Contactar via WhatsApp"
            >
              <WhatsAppIcon className="h-8 w-8" />
              <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping group-hover:animate-none"></span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#25D366] text-white border-none">
            <p>Fale connosco no WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default LandingPage;
