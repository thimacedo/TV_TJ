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
        imageUrl: 'https://picsum.photos/seed/natal-rn-weather/1920/1080',
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
        contents: 'Gere 3 notas curtas de utilidade pública para os cidadãos do Rio Grande do Norte (ex: dicas de saúde, direitos do consumidor, curiosidades locais, alertas de trânsito ou clima). Retorne APENAS um JSON array válido com objetos contendo "title" (título curto), "content" (texto da nota de até 150 caracteres) e "imageKeyword" (uma palavra-chave em inglês para buscar uma imagem relevante no Unsplash, ex: "health", "traffic", "beach", "mosquito").',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                imageKeyword: { type: Type.STRING }
              },
              required: ["title", "content", "imageKeyword"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) throw new Error('Empty response from Gemini');
      
      const items = JSON.parse(jsonStr);
      
      return items.map((item: any, index: number) => ({
        id: `trivia-${Date.now()}-${index}`,
        type: 'TRIVIA',
        title: item.title,
        content: item.content,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(item.imageKeyword)}/1920/1080`,
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
      imageUrl: 'https://picsum.photos/seed/natal-rn-sunny/1920/1080',
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
        imageUrl: 'https://picsum.photos/seed/salt/1920/1080',
        durationMs: 12000,
      },
      {
        id: 'trivia-2',
        type: 'TRIVIA',
        title: 'Tábua de Marés',
        content: 'A Praia de Ponta Negra registra hoje maré alta às 15:30 (2.4m) e maré baixa às 09:15 (0.3m).',
        imageUrl: 'https://picsum.photos/seed/ocean/1920/1080',
        durationMs: 12000,
      },
      {
        id: 'trivia-3',
        type: 'TRIVIA',
        title: 'Dica de Saúde',
        content: 'Beba pelo menos 2 litros de água por dia para manter o corpo hidratado, especialmente no clima tropical de Natal.',
        imageUrl: 'https://picsum.photos/seed/water/1920/1080',
        durationMs: 10000,
      }
    ];
  }
}
