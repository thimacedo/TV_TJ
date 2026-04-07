import { NewsSlide, WeatherSlide, TriviaSlide } from './models';

export interface INewsService {
  fetchLatestNews(limit: number): Promise<NewsSlide[]>;
}

export interface IUtilityService {
  fetchWeather(): Promise<WeatherSlide>;
  fetchTrivia(): Promise<TriviaSlide[]>;
}
