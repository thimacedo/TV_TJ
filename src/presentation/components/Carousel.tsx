import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlideContent, NewsSlide, WeatherSlide, TriviaSlide } from '../../domain/models';

interface CarouselProps {
  slides: SlideContent[];
}

export const Carousel: React.FC<CarouselProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;

    const currentSlide = slides[currentIndex];
    const timerId = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, currentSlide.durationMs);

    return () => clearTimeout(timerId);
  }, [currentIndex, slides]);

  if (slides.length === 0) {
    return <div style={styles.loading}>Carregando painel informativo...</div>;
  }

  const currentSlide = slides[currentIndex];

  const renderSlideLayout = (badge: string, headline: string, content: React.ReactNode, imageUrl: string) => (
    <motion.div 
      key={currentIndex}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      style={{ ...styles.slideContent, backgroundImage: `url(${imageUrl})` }}
    >
      <div style={styles.overlay}>
        <div style={styles.logoContainer}>
          <img src="/LOGO-TJRN.svg" alt="TJRN Logo" style={styles.logo} onError={(e) => {
            // Fallback if logo is not found
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
        </div>
        <div style={styles.contentContainer}>
          <motion.span 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={styles.badge}
          >
            {badge}
          </motion.span>
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            style={styles.headline}
          >
            {headline}
          </motion.h1>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            {content}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const renderNews = (slide: NewsSlide) => 
    renderSlideLayout('NOTÍCIAS TJRN', slide.headline, <p style={styles.date}>{slide.publishDate}</p>, slide.imageUrl);

  const renderWeather = (slide: WeatherSlide) => 
    renderSlideLayout('PREVISÃO DO TEMPO', slide.city, (
      <div style={styles.weatherContent}>
        <h2 style={styles.temperature}>{slide.temperature}°C</h2>
        <p style={styles.utilityText}>{slide.condition}</p>
      </div>
    ), slide.imageUrl);

  const renderTrivia = (slide: TriviaSlide) => 
    renderSlideLayout(slide.title.toUpperCase(), slide.title, <p style={styles.utilityText}>{slide.content}</p>, slide.imageUrl);

  return (
    <div style={styles.container}>
      <AnimatePresence mode="wait">
        {currentSlide.type === 'NEWS' && renderNews(currentSlide as NewsSlide)}
        {currentSlide.type === 'WEATHER' && renderWeather(currentSlide as WeatherSlide)}
        {currentSlide.type === 'TRIVIA' && renderTrivia(currentSlide as TriviaSlide)}
      </AnimatePresence>
      
      <div style={styles.progressContainer}>
        <div 
          key={currentIndex} 
          style={{ ...styles.progressBar, animationDuration: `${currentSlide.durationMs}ms` }} 
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#001A33', // Dark blue background
    fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    color: '#D4AF37', // Gold text
    fontSize: '2rem',
    backgroundColor: '#002244' // TJRN Blue
  },
  slideContent: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 0,
    left: 0
  },
  overlay: {
    background: 'linear-gradient(to top, rgba(0, 34, 68, 0.95) 0%, rgba(0, 34, 68, 0.6) 50%, rgba(0, 34, 68, 0.2) 100%)', // Blue-tinted gradient
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    padding: '40px 60px 80px 60px'
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%'
  },
  logo: {
    height: '80px',
    objectFit: 'contain',
    filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))'
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1
  },
  badge: {
    backgroundColor: '#D4AF37', // Gold
    color: '#002244', // Dark Blue text
    padding: '8px 16px',
    fontWeight: 'bold',
    borderRadius: '4px',
    fontSize: '1.2rem',
    display: 'inline-block',
    marginBottom: '20px',
    alignSelf: 'flex-start',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  headline: {
    color: '#fff',
    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
    lineHeight: '1.2',
    margin: '0 0 20px 0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  date: {
    color: '#E0E0E0',
    fontSize: '1.5rem',
    margin: 0,
    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
  },
  utilityText: {
    color: '#fff',
    fontSize: 'clamp(1.2rem, 2.5vw, 2.2rem)',
    lineHeight: '1.4',
    maxWidth: '85%',
    margin: 0,
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    display: '-webkit-box',
    WebkitLineClamp: 5,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  weatherContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px'
  },
  temperature: {
    fontSize: 'clamp(4rem, 10vw, 8rem)',
    margin: '10px 0',
    color: '#fff',
    lineHeight: '1',
    textShadow: '4px 4px 8px rgba(0,0,0,0.5)'
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D4AF37', // Gold progress bar
    width: '0%',
    animationName: 'progress',
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
    boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
  }
};

const globalStyles = `
  @keyframes progress {
    from { width: 0%; }
    to { width: 100%; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  body, html { margin: 0; padding: 0; overflow: hidden; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = globalStyles;
  document.head.appendChild(styleSheet);
}
