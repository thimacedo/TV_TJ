import { SlideContent } from '../domain/models';

export class PlaylistBuilder {
  public static build(news: SlideContent[], utilities: SlideContent[]): SlideContent[] {
    const playlist: SlideContent[] = [];
    let utilityIndex = 0;

    for (let i = 0; i < news.length; i++) {
      playlist.push(news[i]);
      
      if (utilities.length > 0) {
        playlist.push(utilities[utilityIndex % utilities.length]);
        utilityIndex++;
      }
    }

    return playlist;
  }
}
