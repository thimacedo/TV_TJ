import { INewsService } from '../../domain/ports';
import { NewsSlide } from '../../domain/models';

export class NewsService implements INewsService {
  private readonly apiUrl = 'https://tjrn.jus.br/api/noticias';
  private readonly htmlUrl = 'https://www.tjrn.jus.br/noticias/';
  private readonly proxyUrl = 'https://api.allorigins.win/get?url=';
  private readonly localRssUrl = './tjrn_noticias_imagens.xml';
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

    console.error('[Sistema] Falha crítica de extração de dados. Nenhuma fonte retornou dados válidos.');
    return [];
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