import {
  VideoGrant,
  AccessToken,
  AccessTokenOptions,
} from "livekit-server-sdk";

const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

const createParticipantToken = (
  roomName: string,
  options: AccessTokenOptions
) => {
  const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    ...options,
    ttl: "15m",
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };

  accessToken.addGrant(grant);

  return accessToken.toJwt();
};

export {
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  createParticipantToken,
};
