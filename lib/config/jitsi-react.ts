// lib/config/jitsi-react.ts
export const JITSI_CONFIG = {
  domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "localhost:8000",

  // Connection options
  connection: {
    hosts: {
      domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "localhost:8000",
      muc: `conference.${
        process.env.NEXT_PUBLIC_JITSI_DOMAIN || "localhost:8000"
      }`,
    },
    bosh: `${process.env.NEXT_PUBLIC_JITSI_PROTOCOL || "http"}://${
      process.env.NEXT_PUBLIC_JITSI_DOMAIN || "localhost:8000"
    }/http-bind`,
    websocket: `${
      process.env.NEXT_PUBLIC_JITSI_PROTOCOL === "https" ? "wss" : "ws"
    }://${
      process.env.NEXT_PUBLIC_JITSI_DOMAIN || "localhost:8000"
    }/xmpp-websocket`,
  },

  // Meeting configuration
  conference: {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    prejoinPageEnabled: false,

    // Quality settings
    resolution: 720,
    constraints: {
      video: {
        height: { ideal: 720, max: 1080, min: 240 },
        aspectRatio: 16 / 9,
      },
    },

    // Disable Jitsi branding completely
    brandWatermarkLink: "",
    showBrandWatermark: false,
    showJitsiWatermark: false,
    showWatermarkForGuests: false,
    showPoweredBy: false,

    // Disable authentication (we handle our own)
    enableAuth: false,
    enableGuests: true,
    requireDisplayName: false,

    // Performance
    enableLayerSuspension: true,
    channelLastN: 20,
  },
};
