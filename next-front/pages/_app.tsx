import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchInterval: 1000 * 10,
      retry: 1,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${inter.className} min-h-screen`}>
        <Component {...pageProps} />
        <Toaster richColors position="top-center" />
      </div>
      {/*<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />*/}
    </QueryClientProvider>
  );
}
