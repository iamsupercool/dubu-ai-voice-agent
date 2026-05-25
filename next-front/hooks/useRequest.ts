import { useCallback, useState } from 'react'
import { AxiosError } from 'axios'
import apiClient from '@/lib/apiClient'

interface UseRequestOptions<T> {
  url: string
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
  body?: unknown
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export function useRequest<T = unknown>(options: UseRequestOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (overrideBody?: unknown) => {
      setIsLoading(true)
      setError(null)
      try {
        const { data: result } = await apiClient.request<T>({
          url: options.url,
          method: options.method ?? 'GET',
          data: overrideBody !== undefined ? overrideBody : options.body,
        })
        setData(result)
        options.onSuccess?.(result)
        return result
      } catch (e: unknown) {
        // 401은 interceptor에서 처리하므로 여기서는 메시지만 노출
        const msg =
          e instanceof AxiosError
            ? (e.response?.data?.message ?? e.message)
            : '알 수 없는 오류'
        setError(msg)
        options.onError?.(msg)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.url, options.method],
  )

  return { data, isLoading, error, execute }
}
