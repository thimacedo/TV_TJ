import { IUtilityService } from '../../domain/ports';
import { WeatherSlide, TriviaSlide } from '../../domain/models';

export class UtilityService implements IUtilityService {
  public async fetchWeather(): Promise<WeatherSlide> {
    return {
      id: 'weather-natal',
      type: 'WEATHER',
      city: 'Natal/RN',
      temperature: 28,
      condition: 'Ensolarado com poucas nuvens',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
      durationMs: 10000,
    };
  }

  public async fetchTrivia(): Promise<TriviaSlide[]> {
    return [
      {
        id: 'trivia-dengue',
        type: 'TRIVIA',
        title: 'Combate à Dengue',
        content: 'Evite água parada. Tampe caixas d\'água, mantenha calhas limpas e evite o acúmulo em pneus e garrafas.',
        imageUrl: 'https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9?auto=format&fit=crop&w=1920&q=80',
        durationMs: 12000,
      },
      {
        id: 'trivia-nota-fiscal',
        type: 'TRIVIA',
        title: 'Cidadania',
        content: 'Peça a nota fiscal em suas compras. Além de garantir seus direitos como consumidor, você fortalece a arrecadação do estado.',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80',
        durationMs: 12000,
      },
      {
        id: 'trivia-mares',
        type: 'TRIVIA',
        title: 'Tábua de Marés',
        content: 'A Praia de Ponta Negra registra hoje maré alta às 15:30 (2.4m) e maré baixa às 09:15 (0.3m).',
        imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de4?auto=format&fit=crop&w=1920&q=80',
        durationMs: 12000,
      },
      {
        id: 'trivia-calendario',
        type: 'TRIVIA',
        title: 'Feriados Estaduais',
        content: 'O próximo feriado estadual é o Dia dos Mártires de Cunhaú e Uruaçu, celebrado em 3 de outubro.',
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1920&q=80',
        durationMs: 10000,
      },
      {
        id: 'trivia-sal',
        type: 'TRIVIA',
        title: 'Curiosidade Potiguar',
        content: 'O Rio Grande do Norte é o maior produtor de sal marinho do Brasil, responsável por cerca de 95% da produção nacional.',
        imageUrl: 'https://images.unsplash.com/photo-1518176259659-8487482bc09e?auto=format&fit=crop&w=1920&q=80',
        durationMs: 12000,
      }
    ];
  }
}