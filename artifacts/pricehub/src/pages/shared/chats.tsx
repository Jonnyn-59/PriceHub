import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { 
  useListChats, 
  useListChatMessages, 
  useSendChatMessage, 
  useListChatContacts, 
  useCreateChat,
  getListChatMessagesQueryKey,
  getListChatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Search, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

export default function Chats() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chats, isLoading: chatsLoading } = useListChats({ query: { refetchInterval: 10000 } });
  const { data: messages, isLoading: msgsLoading } = useListChatMessages(activeChatId!, { 
    query: { enabled: !!activeChatId, refetchInterval: 5000 } 
  });
  const sendMessage = useSendChatMessage();
  
  // Contacts logic
  const { data: contacts } = useListChatContacts({ query: { enabled: isNewChatOpen } });
  const createChat = useCreateChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChatId) return;

    const content = message;
    setMessage("");
    
    sendMessage.mutate({ id: activeChatId, data: { content } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListChatMessagesQueryKey(activeChatId) });
        qc.invalidateQueries({ queryKey: getListChatsQueryKey() });
      },
      onError: (err: any) => {
        toast.error("Ошибка: " + err.message);
        setMessage(content); // restore on error
      }
    });
  };

  const handleCreateChat = (userId: number) => {
    createChat.mutate({ data: { otherUserId: userId } }, {
      onSuccess: (chat) => {
        qc.invalidateQueries({ queryKey: getListChatsQueryKey() });
        setIsNewChatOpen(false);
        setActiveChatId(chat.id);
      },
      onError: (err: any) => toast.error(err.message)
    });
  };

  const filteredContacts = contacts?.filter(c => c.displayName.toLowerCase().includes(contactSearch.toLowerCase()) || c.hubId.toLowerCase().includes(contactSearch.toLowerCase()));

  return (
    <div className="h-[calc(100vh-8rem)] border border-border rounded-xl bg-card overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/20">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold tracking-tight">Сообщения</h2>
          <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <MessageSquarePlus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Новый диалог</DialogTitle>
              </DialogHeader>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Поиск по имени или Hub ID..." 
                  className="pl-9"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredContacts?.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors" onClick={() => handleCreateChat(contact.id)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={contact.avatarUrl || ""} />
                        <AvatarFallback>{contact.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{contact.displayName}</div>
                        <div className="text-xs text-muted-foreground font-mono">@{contact.hubId} ({contact.role})</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !chats?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              У вас нет активных диалогов. Нажмите + чтобы начать.
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={chat.otherUser.avatarUrl || ""} />
                    <AvatarFallback>{chat.otherUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="font-medium text-sm truncate">{chat.otherUser.displayName}</div>
                      {chat.lastMessageAt && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {new Date(chat.lastMessageAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{chat.lastMessage || "Нет сообщений"}</div>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                      {chat.unread}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-card relative">
        {activeChatId ? (
          <>
            <div className="h-16 border-b border-border flex items-center px-6 sticky top-0 bg-card z-10">
              {(() => {
                const activeChat = chats?.find(c => c.id === activeChatId);
                if (!activeChat) return null;
                return (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={activeChat.otherUser.avatarUrl || ""} />
                      <AvatarFallback>{activeChat.otherUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium leading-none">{activeChat.otherUser.displayName}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 capitalize">{activeChat.otherUser.role}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
              {msgsLoading ? (
                <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : messages?.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                      <div className="text-sm">{msg.content}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">
                      {new Date(msg.sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  placeholder="Написать сообщение..." 
                  className="flex-1 bg-muted/50 focus-visible:ring-primary"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
                  {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <MessageSquarePlus className="w-16 h-16 mb-4" />
            <p>Выберите диалог слева или создайте новый</p>
          </div>
        )}
      </div>
    </div>
  );
}
