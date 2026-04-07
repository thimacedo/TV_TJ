import { SlideContent } from '../domain/models';

export class PlaylistBuilder {
  public static build(news: SlideContent[], utilities: SlideContent[]): SlideContent[] {
    const playlist: SlideContent[] = [];
    
    if (news.length === 0) {
      return utilities;
    }

    if (utilities.length === 0) {
      return news;
    }

    const maxLength = Math.max(news.length, utilities.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < news.length) {
        playlist.push(news[i]);
      }
      
      if (i < utilities.length) {
        playlist.push(utilities[i]);
      } else if (utilities.length > 0) {
        // Repeat utilities if there are more news than utilities
        playlist.push(utilities[i % utilities.length]);
      }
    }

    return playlist;
  }
}
