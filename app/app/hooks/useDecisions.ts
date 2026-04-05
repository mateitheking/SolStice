import { useQuery } from '@tanstack/react-query';
import { decisionService } from '../services/decisionService';

export function useDecisions() {
  return useQuery({
    queryKey: ['decisions'],
    queryFn: decisionService.fetchDecisions,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}
