import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '@/lib/auth';
import apiClient from '@/lib/apiClient';

export const CONVERSATIONS_KEY = ['conversations'] as const;

export interface ConversationListItem {
  id: string;
  preview: string | null;
  endedAt: string;
}

export function useConversations() {
  return useQuery<ConversationListItem[]>({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get('/conversations');
      return data;
    },
    refetchInterval: 1000 * 10,
    enabled: isAuthenticated(),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/conversations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/conversations/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

export function useRefetchConversations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
}
