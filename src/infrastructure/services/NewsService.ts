import { INewsService } from '../../domain/ports';
import { NewsSlide } from '../../domain/models';

export class NewsService implements INewsService {
  private readonly apiUrl = 'https://tjrn.jus.br/api/noticias';
  private readonly htmlUrl = 'https://www.tjrn.jus.br/noticias/';
  private readonly proxyUrl = 'https://api.allorigins.win/get?url=';
  private readonly localRssUrl = 'https://thimacedo.github.io/TV_TJ/tjrn_noticias_imagens.xml';
  private readonly defaultImageUrl = 'https://tjrn.jus.br/wp-content/themes/tjrn/assets/images/logo-tjrn.png';

  public async fetchLatestNews(limit: number): Promise<NewsSlide[]> {
    let slides = await this.tryFetchLocalRss(this.localRssUrl, limit);
    if (slides.length > 0) return slides;

    slides = await this.tryFetchApi(`${this.apiUrl}?size=${limit}`, limit, false);
    if (slides.length > 0) return slides;

    slides = await this.tryFetchApi(`${this.proxyUrl}${encodeURIComponent(`${this.apiUrl}?size=${limit}`)}`, limit, true);
    if (slides.length > 0) return slides;

    slides = await this.tryFetchHtml(this.htmlUrl, limit, false);
    if (slides.length > 0) return slides;

    slides = await this.tryFetchHtml(`${this.proxyUrl}${encodeURIComponent(this.htmlUrl)}`, limit, true);
    if (slides.length > 0) return slides;

    // Estratégia 6: Fallback com Gemini (IA) - Mais resiliente a bloqueios
    slides = await this.tryFetchGemini(limit);
    if (slides.length > 0) return slides;

    console.error('[Sistema] Falha crítica de extração de dados. Nenhuma fonte retornou dados válidos. Usando notícias de contingência.');
    return this.getHardcodedFallbackNews();
  }

  private async tryFetchGemini(limit: number): Promise<NewsSlide[]> {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return [];

      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Acesse o portal de notícias do TJRN (Tribunal de Justiça do Rio Grande do Norte) em https://tjrn.jus.br/noticias/ e extraia as ${limit} notícias mais recentes.
        Retorne APENAS um JSON array válido com objetos contendo:
        - "headline": o título da notícia
        - "publishDate": a data da notícia no formato DD/MM/AAAA
        - "imageUrl": uma URL de imagem representativa (pode ser a da notícia ou uma genérica de alta qualidade sobre justiça/tribunal se não encontrar a específica).
        
        Priorize notícias reais e recentes.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                publishDate: { type: Type.STRING },
                imageUrl: { type: Type.STRING }
              },
              required: ["headline", "publishDate", "imageUrl"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) return [];
      
      const items = JSON.parse(jsonStr);
      
      return items.map((item: any, index: number) => ({
        id: `news-ai-${index}-${Date.now()}`,
        type: 'NEWS',
        headline: item.headline,
        imageUrl: item.imageUrl || this.defaultImageUrl,
        publishDate: item.publishDate,
        durationMs: 15000,
      }));
    } catch (e) {
      console.warn('Gemini fallback failed', e);
      return [];
    }
  }

  private getHardcodedFallbackNews(): NewsSlide[] {
    return [
      {
        id: 'news-fallback-1',
        type: 'NEWS',
        headline: 'TJRN mantém funcionamento normal e atendimento ao público em todo o estado',
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1920&q=80',
        publishDate: new Date().toLocaleDateString('pt-BR'),
        durationMs: 15000,
      },
      {
        id: 'news-fallback-2',
        type: 'NEWS',
        headline: 'Poder Judiciário do RN amplia serviços digitais para facilitar acesso do cidadão',
        imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1920&q=80',
        publishDate: new Date().toLocaleDateString('pt-BR'),
        durationMs: 15000,
      },
      {
        id: 'news-fallback-3',
        type: 'NEWS',
        headline: 'Corregedoria Geral de Justiça realiza inspeções em comarcas do interior do RN',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1920&q=80',
        publishDate: new Date().toLocaleDateString('pt-BR'),
        durationMs: 15000,
      }
    ];
  }

  private async tryFetchLocalRss(url: string, limit: number): Promise<NewsSlide[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const xmlString = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      const items = Array.from(doc.querySelectorAll('item'));
      
      return items.slice(0, limit).map((item, index) => {
        const title = item.querySelector('title')?.textContent || 'Sem título';
        const rawDate = item.querySelector('pubDate')?.textContent || '';
        const enclosure = item.querySelector('enclosure');
        const imageUrl = enclosure?.getAttribute('url') || this.defaultImageUrl;

        let publishDate = rawDate;
        if (rawDate.includes('+0000')) {
          publishDate = new Date(rawDate).toLocaleDateString('pt-BR');
        }

        return {
          id: `news-rss-${index}`,
          type: 'NEWS',
          headline: title,
          imageUrl: imageUrl,
          publishDate: publishDate || new Date().toLocaleDateString('pt-BR'),
          durationMs: 15000,
        };
      });
    } catch (e) {
      return [];
    }
  }

  private async tryFetchApi(url: string, limit: number, isProxy: boolean): Promise<NewsSlide[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const rawData = await response.json();
      const data = isProxy ? JSON.parse(rawData.contents) : rawData;

      if (!data?.content || !Array.isArray(data.content)) return [];

      return data.content.slice(0, limit).map((item: any) => ({
        id: `news-api-${item.id}`,
        type: 'NEWS',
        headline: item.titulo,
        imageUrl: item.url_img || this.defaultImageUrl,
        publishDate: new Date(item.data_publicacao).toLocaleDateString('pt-BR'),
        durationMs: 15000
      }));
    } catch (e) {
      return [];
    }
  }

  private async tryFetchHtml(url: string, limit: number, isProxy: boolean): Promise<NewsSlide[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const rawData = isProxy ? await response.json() : null;
      const htmlString = isProxy ? rawData.contents : await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a[href]'));
      const regexData = /\b(\d{2}\/\d{2}\/\d{4})\b/;
      const processedLinks = new Set<string>();
      const newsSlides: NewsSlide[] = [];

      for (const a of anchors) {
        if (newsSlides.length >= limit) break;

        const href = a.getAttribute('href') || '';
        if (!href.includes('/noticias/') || href === '/noticias/') continue;

        const fullUrl = href.startsWith('http') ? href : `https://www.tjrn.jus.br${href}`;
        if (processedLinks.has(fullUrl)) continue;

        const container = a.closest('article, div, li') || a.parentElement || a;
        let titulo = a.textContent?.trim() || a.getAttribute('title')?.trim() || '';

        if (titulo.length < 15) {
          const heading = container.querySelector('h1, h2, h3, h4');
          if (heading) titulo = heading.textContent?.trim() || '';
        }

        if (titulo.length < 15) continue;

        const imgTag = container.querySelector('img');
        let imageUrl = this.defaultImageUrl;
        if (imgTag) {
          const src = imgTag.getAttribute('src') || imgTag.getAttribute('data-src') || '';
          if (src) imageUrl = src.startsWith('http') ? src : `https://www.tjrn.jus.br${src}`;
        }

        const textContent = container.textContent || '';
        const matchData = textContent.match(regexData);
        const publishDate = matchData ? matchData[1] : new Date().toLocaleDateString('pt-BR');

        processedLinks.add(fullUrl);
        newsSlides.push({
          id: `news-html-${newsSlides.length}`,
          type: 'NEWS',
          headline: titulo,
          imageUrl: imageUrl,
          publishDate: publishDate,
          durationMs: 15000,
        });
      }

      return newsSlides;
    } catch (e) {
      return [];
    }
  }
}