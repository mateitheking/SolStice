import { useQuery } from '@tanstack/react-query';
import { decisionService } from '../services/decisionService';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: decisionService.fetchDashboardSnapshot,
    refetchInterval: 30_000,
  });
}
