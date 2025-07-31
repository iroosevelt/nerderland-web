// stores/streamStore.ts
import { create } from "zustand";
import { Socket } from "socket.io-client";

interface Participant {
  userId: number;
  username: string;
  peerId?: string;
  isHost: boolean;
  socketId: string;
}

interface StreamStore {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;

  // Stream state
  streamId: string | null;
  isLive: boolean;
  viewerCount: number;

  // Participants
  participants: Map<string, Participant>;

  // Local media
  localStream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;

  // Actions
  setSocket: (socket: Socket | null) => void;
  setStreamId: (streamId: string) => void;
  setIsLive: (isLive: boolean) => void;
  setViewerCount: (count: number) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;

  // Participant management
  addParticipant: (socketId: string, participant: Participant) => void;
  removeParticipant: (socketId: string) => void;
  clearParticipants: () => void;

  // Reset store
  reset: () => void;
}

const useStreamStore = create<StreamStore>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  streamId: null,
  isLive: false,
  viewerCount: 0,
  participants: new Map(),
  localStream: null,
  audioEnabled: true,
  videoEnabled: true,

  // Actions
  setSocket: (socket) => set({ socket, isConnected: !!socket }),

  setStreamId: (streamId) => set({ streamId }),

  setIsLive: (isLive) => set({ isLive }),

  setViewerCount: (viewerCount) => set({ viewerCount }),

  setLocalStream: (localStream) => set({ localStream }),

  toggleAudio: () => {
    const { localStream, audioEnabled } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        set({ audioEnabled: !audioEnabled });
      }
    }
  },

  toggleVideo: () => {
    const { localStream, videoEnabled } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        set({ videoEnabled: !videoEnabled });
      }
    }
  },

  addParticipant: (socketId, participant) => {
    set((state) => ({
      participants: new Map(state.participants).set(socketId, participant),
    }));
  },

  removeParticipant: (socketId) => {
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.delete(socketId);
      return { participants: newParticipants };
    });
  },

  clearParticipants: () => set({ participants: new Map() }),

  reset: () => {
    const { localStream, socket } = get();

    // Clean up resources
    localStream?.getTracks().forEach((track) => track.stop());
    socket?.disconnect();

    // Reset state
    set({
      socket: null,
      isConnected: false,
      streamId: null,
      isLive: false,
      viewerCount: 0,
      participants: new Map(),
      localStream: null,
      audioEnabled: true,
      videoEnabled: true,
    });
  },
}));

export default useStreamStore;
