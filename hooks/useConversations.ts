import useSWR from "swr";

type User = {
  id: string;
  name: string | null;
  image: string | null;
};

type Message = {
  content: string;
  createdAt: string;
};

type Conversation = {
  user: User;
  lastMessage?: Message | null; // Optional for new connections
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR<Conversation[]>(
    "/api/messages",
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds for new messages/connections
      revalidateOnFocus: true,
    }
  );

  return {
    conversations: data,
    isLoading,
    isError: error,
    mutate,
  };
}
