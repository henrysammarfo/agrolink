import { createFileRoute } from "@tanstack/react-router";
import { sendChatMessageServer } from "@/server/comms";

export const Route = createFileRoute("/api/chat/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            senderId: string;
            receiverId: string;
            content: string;
            orderId?: string;
            senderName?: string;
            attachmentUrl?: string;
            attachmentType?: "image" | "video";
          };

          if (!body.senderId || !body.receiverId) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }
          if (!body.content?.trim() && !body.attachmentUrl) {
            return Response.json({ error: "Empty message" }, { status: 400 });
          }
          if (body.senderId === body.receiverId) {
            return Response.json({ error: "Cannot message yourself" }, { status: 400 });
          }

          const id = await sendChatMessageServer({
            senderId: body.senderId,
            receiverId: body.receiverId,
            content: body.content?.trim() ?? "",
            orderId: body.orderId,
            senderName: body.senderName,
            attachmentUrl: body.attachmentUrl,
            attachmentType: body.attachmentType,
          });

          return Response.json({ ok: true, id });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Send failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
