import { IUtilityService } from '../../domain/ports';
import { WeatherSlide, TriviaSlide } from '../../domain/models';
import { GoogleGenAI, Type } from '@google/genai';

export class UtilityService implements IUtilityService {
  public async fetchWeather(): Promise<WeatherSlide> {
    try {
      // Fetch weather for Natal/RN using Open-Meteo
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-5.7945&longitude=-35.211&current_weather=true');
      const data = await response.json();
      
      const temp = Math.round(data.current_weather.temperature);
      const weathercode = data.current_weather.weathercode;
      
      // Map WMO weather codes to conditions
      let condition = 'Céu limpo';
      if (weathercode >= 1 && weathercode <= 3) condition = 'Parcialmente nublado';
      else if (weathercode >= 45 && weathercode <= 48) condition = 'Neblina';
      else if (weathercode >= 51 && weathercode <= 67) condition = 'Chuva leve';
      else if (weathercode >= 71 && weathercode <= 77) condition = 'Neve';
      else if (weathercode >= 80 && weathercode <= 82) condition = 'Pancadas de chuva';
      else if (weathercode >= 95) condition = 'Tempestade';

      return {
        id: `weather-${Date.now()}`,
        type: 'WEATHER',
        city: 'Natal/RN',
        temperature: temp,
        condition: condition,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
        durationMs: 10000,
      };
    } catch (error) {
      console.error('Failed to fetch weather', error);
      return this.getFallbackWeather();
    }
  }

  public async fetchTrivia(): Promise<TriviaSlide[]> {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Gere 3 notas curtas de utilidade pública para os cidadãos do Rio Grande do Norte (ex: dicas de saúde, direitos do consumidor, curiosidades locais, alertas de trânsito ou clima). Retorne APENAS um JSON array válido com objetos contendo "title" (título curto) e "content" (texto da nota de até 150 caracteres).',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["title", "content"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error('Empty response from Gemini');
      
      const items = JSON.parse(jsonStr);
      
      const images = [
        'https://images.unsplash.com/photo-1508138221679-760a23a2285b?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1498698365971-460193132e18?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1523362628745-0c5fbc5b08c9?auto=format&fit=crop&w=1920&q=80'
      ];

      return items.map((item: any, index: number) => ({
        id: `trivia-${Date.now()}-${index}`,
        type: 'TRIVIA',
        title: item.title,
        content: item.content,
        imageUrl: images[index % images.length],
        durationMs: 12000,
      }));

    } catch (error) {
      console.error('Failed to fetch trivia from Gemini', error);
      return this.getFallbackTrivia();
    }
  }

  private getFallbackWeather(): WeatherSlide {
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

  private getFallbackTrivia(): TriviaSlide[] {
    return [
      {
        id: 'trivia-1',
        type: 'TRIVIA',
        title: 'Curiosidade Potiguar',
        content: 'O Rio Grande do Norte é o maior produtor de sal marinho do Brasil, responsável por cerca de 95% da produção nacional.',
        imageUrl: 'https://images.unsplash.com/photo-1508138221679-760a23a2285b?auto=format&fit=crop&w=1920&q=80',
        durationMs: 12000,
      },
      {
        id: 'trivia-2',
        type: 'TRIVIA',
        title: 'Tábua de Marés',
        content: 'A Praia de Ponta Negra registra hoje maré alta às 15:30 (2.4m) e maré baixa às 09:15 (0.3m).',
        imageUrl: 'https://images.unsplash.com/photo-1498698365971-460193132e18?auto=format&fit=crop&w=1920&q=80',
        durationMs: 12000,
      },
      {
        id: 'trivia-3',
        type: 'TRIVIA',
        title: 'Dica de Saúde',
        content: 'Beba pelo menos 2 litros de água por dia para manter o corpo hidratado, especialmente no clima tropical de Natal.',
        imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c5fbc5b08c9?auto=format&fit=crop&w=1920&q=80',
        durationMs: 10000,
      }
    ];
  }
}
