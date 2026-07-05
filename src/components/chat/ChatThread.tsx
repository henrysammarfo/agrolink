import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Send, Loader2, Package, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  fetchThreadMessages,
  sendChatMessage,
  markThreadRead,
  subscribeToMessages,
} from "@/lib/api/chat";
import { uploadChatAttachment } from "@/lib/api/settings";
import { trackEvent } from "@/lib/analytics";
import type { MessageRow } from "@/lib/types/marketplace";

type Props = {
  userId: string;
  partnerId: string;
  partnerName: string;
  senderName: string;
  orderId?: string;
};

export function ChatThread({ userId, partnerId, partnerName, senderName, orderId }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchThreadMessages(userId, partnerId)
      .then(setMessages)
      .finally(() => setLoading(false));
    void markThreadRead(userId, partnerId);
  }, [userId, partnerId]);

  useEffect(() => {
    return subscribeToMessages(userId, (msg) => {
      if (msg.sender_id !== partnerId && msg.receiver_id !== partnerId) return;
      if (msg.sender_id !== userId && msg.receiver_id !== userId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender_id === partnerId) void markThreadRead(userId, partnerId);
    });
  }, [userId, partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const dispatchSend = async (opts: {
    content: string;
    attachmentUrl?: string;
    attachmentType?: "image" | "video";
  }) => {
    const content = opts.content.trim();
    if (!content && !opts.attachmentUrl) return;
    setSending(true);
    const optimistic: MessageRow = {
      id: `opt-${Date.now()}`,
      sender_id: userId,
      receiver_id: partnerId,
      content: content || "📷 Photo",
      read: false,
      created_at: new Date().toISOString(),
      attachment_url: opts.attachmentUrl ?? null,
      attachment_type: opts.attachmentType ?? null,
      sender: { display_name: senderName },
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    try {
      await sendChatMessage({
        senderId: userId,
        receiverId: partnerId,
        content,
        orderId,
        senderName,
        attachmentUrl: opts.attachmentUrl,
        attachmentType: opts.attachmentType,
      });
      trackEvent("chat_message_sent", {
        has_attachment: !!opts.attachmentUrl,
        attachment_type: opts.attachmentType ?? null,
      });
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setText(content);
      toast.error("Could not send message");
    } finally {
      setSending(false);
    }
  };

  const onSend = () => void dispatchSend({ content: text });

  const onPickImage = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Images and short videos only");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max file size is 10 MB");
      return;
    }
    setUploading(true);
    try {
      const { url, type } = await uploadChatAttachment(file, userId);
      await dispatchSend({ content: text, attachmentUrl: url, attachmentType: type });
    } catch {
      toast.error("Could not upload attachment");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100dvh-120px)] min-h-[480px] flex-col rounded-3xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to="/app/inbox"
          search={{ tab: "messages" }}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-sans font-semibold">{partnerName}</div>
          {orderId && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Package className="h-3 w-3" /> Order {orderId.slice(0, 8)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {m.attachment_url && m.attachment_type === "image" && (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={m.attachment_url}
                        alt="Attachment"
                        className="mb-2 max-h-48 rounded-xl object-cover"
                      />
                    </a>
                  )}
                  {m.attachment_url && m.attachment_type === "video" && (
                    <video
                      src={m.attachment_url}
                      controls
                      className="mb-2 max-h-48 rounded-xl"
                    />
                  )}
                  {m.content && m.content !== "📷 Photo" && <div>{m.content}</div>}
                  {!m.attachment_url && m.content === "📷 Photo" && <div>{m.content}</div>}
                  <div className={`mt-1 text-[9px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickImage(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:border-primary/40 disabled:opacity-45"
            aria-label="Attach photo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSend())}
            placeholder="Type a message…"
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={onSend}
            disabled={(!text.trim() && !uploading) || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-45"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
