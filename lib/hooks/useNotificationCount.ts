import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotificationCount() {
  const { data, error, isLoading } = useSWR<{ count: number }>(
    "/api/notifications/unread-count",
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    count: data?.count || 0,
    isLoading,
    isError: error,
  };
}
