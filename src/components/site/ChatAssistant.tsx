import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import logo from "@/assets/logo.png";
import { DUR, EASE } from "@/lib/motion";
import { CONTACT } from "@/lib/contact";

const KEY = "tpc_chat";
const IDEAS = ["What should I wear to a college fest?", "Which tee is best under ₹1,000?", "Where is my order?", "How do I contact support?"];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try {
      setInitial(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      setInitial([]);
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && initial && (
          <motion.div
            role="dialog"
            aria-label="Shopping assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: DUR.panel, ease: EASE }}
            className="fixed inset-x-2 bottom-20 z-50 flex h-[min(620px,75vh)] flex-col border border-border bg-background shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[400px]"
          >
            <ChatWindow initial={initial} onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}

function ChatWindow({ initial, onClose }: { initial: UIMessage[]; onClose: () => void }) {
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message.includes("402") ? "The assistant is out of credits right now." : e.message.includes("429") ? "Too many messages — try again in a moment." : "The assistant couldn't reply. Please try again."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") localStorage.setItem(KEY, JSON.stringify(messages));
  }, [messages, status]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text: text.trim() });
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src={logo} alt="" className="h-9 w-9 rounded-full border border-border bg-card object-contain p-1" />
        <div className="flex-1">
          <p className="font-display text-base leading-tight">Poshak Assistant</p>
          <p className="text-xs text-muted-foreground">Styling, sizes, shipping & returns</p>
        </div>
        {messages.length > 0 && (
          <button aria-label="Start new conversation" title="New conversation" onClick={() => { setMessages([]); localStorage.removeItem(KEY); }} className="p-1.5 hover:opacity-70">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button aria-label="Close" onClick={onClose} className="p-1.5 hover:opacity-70"><X className="h-4 w-4" /></button>
      </div>
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="space-y-3 py-4">
              <p className="font-display text-xl">Namaste! Looking for something?</p>
              <p className="text-sm text-muted-foreground">Tell me the occasion or your vibe and I'll pick tees from the shop.</p>
              <div className="flex flex-wrap gap-2">
                {IDEAS.map((i) => (
                  <button key={i} onClick={() => send(i)} className="border border-border px-3 py-1.5 text-left text-xs transition-colors hover:border-foreground">{i}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className={m.role === "user" ? "!bg-primary !text-primary-foreground" : ""}>
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    m.role === "assistant" ? <MessageResponse key={i}>{part.text}</MessageResponse> : <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer className="text-sm">Finding the right fit…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>Need a person?</span>
        <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">WhatsApp</a>
        <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-2 hover:text-foreground">Email</a>
        <a href="/track-order" className="underline underline-offset-2 hover:text-foreground">Track order</a>
      </div>
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={(msg) => send(msg.text)}>
          <PromptInputTextarea autoFocus placeholder="Ask about a tee, size or occasion…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
