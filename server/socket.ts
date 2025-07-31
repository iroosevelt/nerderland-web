// server/socket.ts
import { Server } from "socket.io";
import { createServer } from "http";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@db/schema";
import { eq, and } from "drizzle-orm";

// Load environment variables
config({ path: ".env.local" });

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

interface SocketData {
  userId?: number;
  username?: string;
  streamId?: string;
  isHost?: boolean;
}

interface SignalData {
  to: string;
  from: string;
  signal: any;
  type: "offer" | "answer" | "ice-candidate";
}

const httpServer = createServer();

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Middleware for auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return next(new Error("Authentication required"));
    }

    // Verify user exists
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user.length) {
      return next(new Error("User not found"));
    }

    socket.data.userId = userId;
    socket.data.username = user[0].username || `User${userId}`;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// Room management
const streamRooms = new Map<string, Set<string>>();
const peerConnections = new Map<string, string>(); // socketId -> peerId

io.on("connection", (socket) => {
  console.log(`User ${socket.data.userId} connected`);

  // Join stream room
  socket.on(
    "join-stream",
    async (data: { streamId: string; peerId?: string }) => {
      try {
        const { streamId, peerId } = data;

        // Verify stream exists and is live
        const stream = await db
          .select()
          .from(schema.live_streams)
          .where(eq(schema.live_streams.stream_identifier, streamId))
          .limit(1);

        if (!stream.length || !stream[0].is_live) {
          socket.emit("error", { message: "Stream not found or not live" });
          return;
        }

        // Check if user is host or participant
        const participant = await db
          .select()
          .from(schema.stream_participants)
          .where(
            and(
              eq(schema.stream_participants.stream_id, stream[0].id),
              eq(schema.stream_participants.user_id, socket.data.userId!)
            )
          )
          .limit(1);

        const isHost = stream[0].user_id === socket.data.userId;
        const isParticipant = participant.length > 0 || isHost;

        socket.data.streamId = streamId;
        socket.data.isHost = isHost;

        // Join socket room
        socket.join(streamId);

        // Track room members
        if (!streamRooms.has(streamId)) {
          streamRooms.set(streamId, new Set());
        }
        streamRooms.get(streamId)!.add(socket.id);

        if (peerId && isParticipant) {
          peerConnections.set(socket.id, peerId);
        }

        // Notify room about new member
        socket.to(streamId).emit("user-joined", {
          userId: socket.data.userId,
          username: socket.data.username,
          isHost,
          isParticipant,
          peerId: isParticipant ? peerId : undefined,
        });

        // Send current participants to new member
        const roomMembers = Array.from(streamRooms.get(streamId) || [])
          .filter((id) => id !== socket.id)
          .map((id) => {
            const memberSocket = io.sockets.sockets.get(id);
            return {
              socketId: id,
              userId: memberSocket?.data.userId,
              username: memberSocket?.data.username,
              isHost: memberSocket?.data.isHost,
              peerId: peerConnections.get(id),
            };
          });

        socket.emit("room-members", roomMembers);

        // Update viewer count
        const viewerCount = streamRooms.get(streamId)?.size || 0;
        io.to(streamId).emit("viewer-count", viewerCount);

        await db
          .update(schema.live_streams)
          .set({ viewer_count: viewerCount })
          .where(eq(schema.live_streams.stream_identifier, streamId));
      } catch (error) {
        console.error("Error joining stream:", error);
        socket.emit("error", { message: "Failed to join stream" });
      }
    }
  );

  // WebRTC signaling
  socket.on("signal", (data: SignalData) => {
    const targetSocket = io.sockets.sockets.get(data.to);
    if (targetSocket && socket.data.streamId === targetSocket.data.streamId) {
      targetSocket.emit("signal", {
        ...data,
        from: socket.id,
      });
    }
  });

  // Stream control
  socket.on("end-stream", async () => {
    if (!socket.data.isHost || !socket.data.streamId) return;

    try {
      await db
        .update(schema.live_streams)
        .set({
          is_live: false,
          ended_at: new Date(),
          viewer_count: 0,
        })
        .where(eq(schema.live_streams.stream_identifier, socket.data.streamId));

      io.to(socket.data.streamId).emit("stream-ended");

      // Clear room
      streamRooms.delete(socket.data.streamId);
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log(`User ${socket.data.userId} disconnected`);

    if (socket.data.streamId) {
      const room = streamRooms.get(socket.data.streamId);
      if (room) {
        room.delete(socket.id);

        // Update viewer count
        const viewerCount = room.size;
        io.to(socket.data.streamId).emit("viewer-count", viewerCount);

        await db
          .update(schema.live_streams)
          .set({ viewer_count: viewerCount })
          .where(
            eq(schema.live_streams.stream_identifier, socket.data.streamId)
          );

        // Notify others
        socket.to(socket.data.streamId).emit("user-left", {
          userId: socket.data.userId,
          socketId: socket.id,
        });

        // Clean up empty rooms
        if (room.size === 0) {
          streamRooms.delete(socket.data.streamId);
        }
      }
    }

    peerConnections.delete(socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

export default io;
