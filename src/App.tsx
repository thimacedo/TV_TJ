import React, { useState, useEffect } from 'react';
import { NewsService } from './infrastructure/services/NewsService';
import { UtilityService } from './infrastructure/services/UtilityService';
import { PlaylistBuilder } from './application/PlaylistBuilder';
import { MiniPlayer } from './presentation/components/MiniPlayer';
import { Carousel } from './presentation/components/Carousel';
import { SlideContent, NewsSlide } from './domain/models';

const newsService = new NewsService();
const utilityService = new UtilityService();

export default function App() {
  const [playlist, setPlaylist] = useState<SlideContent[]>([]);
  const RADIO_URL = 'https://radiositetjrn.tjrn.jus.br/radiojusticapotiguar64k';

  useEffect(() => {
    let currentNews: NewsSlide[] = [];
    let currentUtilities: SlideContent[] = [];

    const updatePlaylist = () => {
      setPlaylist(PlaylistBuilder.build(currentNews, currentUtilities));
    };

    const fetchNews = async () => {
      currentNews = await newsService.fetchLatestNews(20);
      updatePlaylist();
    };

    const fetchUtilities = async () => {
      const [weather, trivia] = await Promise.all([
        utilityService.fetchWeather(),
        utilityService.fetchTrivia()
      ]);
      currentUtilities = [weather, ...trivia];
      updatePlaylist();
    };

    fetchNews();
    fetchUtilities();

    // Atualiza notícias a cada 30 minutos
    const newsIntervalId = setInterval(fetchNews, 30 * 60 * 1000);
    
    // Atualiza notas de utilidade pública a cada 5 horas
    const utilitiesIntervalId = setInterval(fetchUtilities, 5 * 60 * 60 * 1000);

    return () => {
      clearInterval(newsIntervalId);
      clearInterval(utilitiesIntervalId);
    };
  }, []);

  return (
    <>
      <MiniPlayer streamUrl={RADIO_URL} />
      <Carousel slides={playlist} />
    </>
  );
}
