export type SlideType = 'NEWS' | 'WEATHER' | 'TRIVIA';

export interface BaseSlide {
  id: string;
  type: SlideType;
  durationMs: number;
}

export interface NewsSlide extends BaseSlide {
  type: 'NEWS';
  headline: string;
  imageUrl: string;
  publishDate: string;
}

export interface WeatherSlide extends BaseSlide {
  type: 'WEATHER';
  city: string;
  temperature: number;
  condition: string;
  imageUrl: string;
}

export interface TriviaSlide extends BaseSlide {
  type: 'TRIVIA';
  title: string;
  content: string;
  imageUrl: string;
}

export type SlideContent = NewsSlide | WeatherSlide | TriviaSlide;
