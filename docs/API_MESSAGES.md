# Messages API Documentation

## GET /api/messages

Fetches the current user's conversations, including both active chats and newly accepted connections.

### Response Format

Returns an array of `Conversation` objects:

```typescript
type Conversation = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId: string;
    read: boolean;
  } | null;
};
```

### Behavior

1.  **Active Conversations**: Returns users with whom the current user has exchanged messages. `lastMessage` contains the most recent message.
2.  **New Connections**: Returns users who have an `ACCEPTED` connection request with the current user but no messages yet. `lastMessage` is `null`.
3.  **Sorting**:
    - New connections (null `lastMessage`) are displayed at the top.
    - Active conversations are sorted by `lastMessage.createdAt` (descending).

### Usage

This endpoint is used by the `MessagesPage` to display the list of conversations. It uses SWR for polling to ensure real-time updates when new connections are accepted or new messages arrive.

```typescript
const { data } = useSWR("/api/messages", fetcher);
```
