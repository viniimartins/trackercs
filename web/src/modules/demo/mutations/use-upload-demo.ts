import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { Demo } from '../model';

export function useUploadDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<Demo>('/demos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demos'] });
    },
  });
}
