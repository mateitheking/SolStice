import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services/newsService';

export function usePublicNews() {
  return useQuery({
    queryKey: ['public-news'],
    queryFn: newsService.fetchPublicNews,
    staleTime: 1000 * 60 * 5,
  });
}
