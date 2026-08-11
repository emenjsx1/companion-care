import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useActiveGalleryImages } from '@/hooks/useGallery';

// Fallback images when no gallery images are in the database
const fallbackImages = [
  {
    src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop',
    alt: 'Aula prática de condução',
    caption: 'Aulas práticas'
  },
  {
    src: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop',
    alt: 'Interior de viatura',
    caption: 'Viaturas modernas'
  },
  {
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    alt: 'Sala de aulas',
    caption: 'Aulas teóricas'
  },
  {
    src: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop',
    alt: 'Viatura de escola',
    caption: 'Nossa frota'
  },
  {
    src: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop',
    alt: 'Estrada',
    caption: 'Percursos de treino'
  },
  {
    src: 'https://images.unsplash.com/photo-1558618047-f4b511368a4c?w=600&h=400&fit=crop',
    alt: 'Aluno aprovado',
    caption: 'Sucesso dos alunos'
  },
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: galleryImages, isLoading, refetch } = useActiveGalleryImages();

  // Refetch when component becomes visible (user navigates to gallery section)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Refetch when gallery section becomes visible
            refetch();
          }
        });
      },
      { threshold: 0.1 }
    );

    const gallerySection = document.getElementById('galeria');
    if (gallerySection) {
      observer.observe(gallerySection);
    }

    return () => {
      if (gallerySection) {
        observer.unobserve(gallerySection);
      }
    };
  }, [refetch]);

  // Use database images if available, otherwise use fallback
  const images = galleryImages && galleryImages.length > 0
    ? galleryImages.map(img => ({
        src: img.image_url,
        alt: img.alt_text || img.caption || 'Galeria Rodauto',
        caption: img.caption || ''
      }))
    : fallbackImages;

  return (
    <section id="galeria" className="py-20 bg-background">
      <div className="container-section">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Galeria</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Conheça as nossas instalações
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-xl aspect-[4/3]"
                onClick={() => setSelectedImage(image.src)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white text-sm font-medium">{image.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-primary"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedImage.includes('unsplash.com') 
              ? selectedImage.replace('w=600&h=400', 'w=1200&h=800')
              : selectedImage
            }
            alt="Imagem ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </section>
  );
};

export default Gallery;
