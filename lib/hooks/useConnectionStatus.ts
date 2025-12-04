import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useConnectionStatus(targetId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    targetId ? `/api/requests?targetId=${targetId}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Don't revalidate on window focus to save requests
      dedupingInterval: 5000,   // Cache for 5 seconds
    }
  );

  // If data is null, it means no request exists.
  // If data is an object, it is the request object.
  const request = data;

  return {
    request,
    isLoading,
    isError: error,
    mutate,
  };
}
