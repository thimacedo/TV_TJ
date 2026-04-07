import { INewsService } from '../../domain/ports';
import { NewsSlide } from '../../domain/models';

export class NewsService implements INewsService {
  private readonly baseUrl = 'https://www.tjrn.jus.br';
  private readonly newsUrl = `${this.baseUrl}/noticias/`;
  private readonly proxyUrl = 'https://api.allorigins.win/get?url=';
  private readonly defaultImageUrl = 'https://tjrn.jus.br/wp-content/themes/tjrn/assets/images/logo-tjrn.png';

  public async fetchLatestNews(limit: number): Promise<NewsSlide[]> {
    try {
      const response = await fetch(`${this.proxyUrl}${encodeURIComponent(this.newsUrl)}`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      return this.extractNewsFromHtml(doc, limit);
    } catch (error) {
      console.error('Failed to fetch or parse news HTML', error);
      return [];
    }
  }

  private extractNewsFromHtml(doc: Document, limit: number): NewsSlide[] {
    const anchorTags = Array.from(doc.querySelectorAll('a[href]'));
    const processedLinks = new Set<string>();
    const newsSlides: NewsSlide[] = [];
    const dateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;

    for (const anchor of anchorTags) {
      if (newsSlides.length >= limit) {
        break;
      }

      const href = anchor.getAttribute('href') || '';
      
      if (!this.isValidNewsLink(href)) {
        continue;
      }

      const fullUrl = this.resolveUrl(href);

      if (processedLinks.has(fullUrl)) {
        continue;
      }

      const container = anchor.closest('article, div, li') || anchor;
      const title = this.extractTitle(anchor, container);

      if (!title || title.length < 15) {
        continue;
      }

      processedLinks.add(fullUrl);

      newsSlides.push({
        id: `news-${newsSlides.length}`,
        type: 'NEWS',
        headline: title,
        imageUrl: this.extractImage(container),
        publishDate: this.extractDate(container, dateRegex),
        durationMs: 15000,
      });
    }

    return newsSlides;
  }

  private isValidNewsLink(href: string): boolean {
    return href.includes('/noticias/') && href !== '/noticias/';
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private extractTitle(anchor: Element, container: Element): string {
    let title = anchor.textContent?.trim() || anchor.getAttribute('title') || '';
    
    if (title.length < 15) {
      const heading = container.querySelector('h1, h2, h3, h4');
      if (heading) {
        title = heading.textContent?.trim() || title;
      }
    }
    
    return title;
  }

  private extractImage(container: Element): string {
    const imgTag = container.querySelector('img');
    
    if (!imgTag) {
      return this.defaultImageUrl;
    }

    const src = imgTag.getAttribute('src');
    
    if (!src) {
      return this.defaultImageUrl;
    }

    return this.resolveUrl(src);
  }

  private extractDate(container: Element, dateRegex: RegExp): string {
    const containerText = container.textContent || '';
    const dateMatch = containerText.match(dateRegex);
    
    if (dateMatch) {
      return dateMatch[1];
    }
    
    return new Date().toLocaleDateString('pt-BR');
  }
}