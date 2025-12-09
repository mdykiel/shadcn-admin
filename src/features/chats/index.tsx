import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  MoreVertical,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { chatService, type Conversation, type Message } from '@/services/chat'

export function Chats() {
  const queryClient = useQueryClient()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch conversations list
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  })

  // Fetch selected conversation messages
  const { data: currentConversation, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => chatService.getConversation(selectedConversationId!),
    enabled: !!selectedConversationId,
  })

  // Create new conversation
  const createMutation = useMutation({
    mutationFn: () => chatService.createConversation('Nowa rozmowa'),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedConversationId(newConv.id)
    },
  })

  // Send message
  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(selectedConversationId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setInputMessage('')
    },
    onError: () => {
      toast.error('Błąd podczas wysyłania wiadomości')
    },
  })

  // Delete conversation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (selectedConversationId === conversationToDelete) {
        setSelectedConversationId(null)
      }
      setDeleteDialogOpen(false)
      toast.success('Rozmowa usunięta')
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedConversationId || sendMutation.isPending) return
    sendMutation.mutate(inputMessage.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversationToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex h-full gap-4'>
          {/* Left Side - Conversations List */}
          <div className='flex w-72 flex-col border-r pr-4'>
            <div className='flex items-center justify-between pb-4'>
              <div className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5 text-primary' />
                <h1 className='text-xl font-bold'>Asystent AI</h1>
              </div>
              <Button
                size='icon'
                variant='ghost'
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                <MessageSquarePlus className='h-5 w-5' />
              </Button>
            </div>

            <ScrollArea className='flex-1 -mx-2'>
              {loadingConversations ? (
                <div className='flex justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : conversations.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground text-sm'>
                  Brak rozmów. Kliknij + aby rozpocząć.
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className='px-2'>
                    <button
                      type='button'
                      className={cn(
                        'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent',
                        selectedConversationId === conv.id && 'bg-muted'
                      )}
                      onClick={() => setSelectedConversationId(conv.id)}
                    >
                      <div className='flex-1 truncate'>
                        <div className='font-medium truncate'>{conv.title}</div>
                        <div className='text-xs text-muted-foreground truncate'>
                          {conv.messages?.[0]?.content?.slice(0, 40) || 'Pusta rozmowa'}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-6 w-6 opacity-0 group-hover:opacity-100'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={(e) => handleDeleteClick(conv.id, e)}>
                            <Trash2 className='mr-2 h-4 w-4' />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </button>
                    <Separator className='my-1' />
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right Side - Chat Area */}
          <div className='flex flex-1 flex-col rounded-lg border bg-card'>
            {selectedConversationId && currentConversation ? (
              <>
                {/* Messages Area */}
                <ScrollArea className='flex-1 p-4'>
                  {loadingMessages ? (
                    <div className='flex justify-center py-8'>
                      <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                    </div>
                  ) : currentConversation.messages?.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full py-16 text-center'>
                      <Bot className='h-16 w-16 text-muted-foreground mb-4' />
                      <h3 className='text-lg font-medium'>Jak mogę Ci pomóc?</h3>
                      <p className='text-sm text-muted-foreground mt-2 max-w-md'>
                        Jestem asystentem księgowym. Mogę pomóc z dekretowaniem operacji,
                        planem kont, klasyfikacją budżetową i sprawozdawczością.
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {currentConversation.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex gap-3',
                            msg.role === 'USER' && 'flex-row-reverse'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                              msg.role === 'USER' ? 'bg-primary' : 'bg-muted'
                            )}
                          >
                            {msg.role === 'USER' ? (
                              <User className='h-4 w-4 text-primary-foreground' />
                            ) : (
                              <Bot className='h-4 w-4' />
                            )}
                          </div>
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg px-4 py-2',
                              msg.role === 'USER'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <p className='whitespace-pre-wrap text-sm'>{msg.content}</p>
                            <span className='text-xs opacity-70 mt-1 block'>
                              {format(new Date(msg.createdAt), 'HH:mm', { locale: pl })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {sendMutation.isPending && (
                        <div className='flex gap-3'>
                          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
                            <Bot className='h-4 w-4' />
                          </div>
                          <div className='bg-muted rounded-lg px-4 py-2'>
                            <Loader2 className='h-4 w-4 animate-spin' />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className='border-t p-4'>
                  <div className='flex gap-2'>
                    <Textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder='Zadaj pytanie...'
                      className='min-h-[44px] max-h-32 resize-none'
                      disabled={sendMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMutation.isPending}
                      size='icon'
                      className='shrink-0'
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Send className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex flex-1 flex-col items-center justify-center text-center p-8'>
                <div className='rounded-full bg-primary/10 p-6 mb-6'>
                  <Sparkles className='h-12 w-12 text-primary' />
                </div>
                <h2 className='text-2xl font-bold mb-2'>Asystent Księgowy Budzeto</h2>
                <p className='text-muted-foreground max-w-md mb-6'>
                  Zadaj pytanie o dekretowanie operacji, plan kont, klasyfikację budżetową
                  lub sprawozdawczość jednostek budżetowych.
                </p>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <MessageSquarePlus className='mr-2 h-4 w-4' />
                  )}
                  Rozpocznij rozmowę
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć rozmowę?</AlertDialogTitle>
              <AlertDialogDescription>
                Ta operacja jest nieodwracalna. Cała historia rozmowy zostanie usunięta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => conversationToDelete && deleteMutation.mutate(conversationToDelete)}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
