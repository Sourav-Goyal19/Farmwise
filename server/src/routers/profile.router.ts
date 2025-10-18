import { z } from "zod";
import express from "express";
import {
  AccessToken,
  AccessTokenOptions,
  AgentDispatchClient,
  VideoGrant,
} from "livekit-server-sdk";

const router = express.Router();

const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

const tokenRequestSchema = z.object({
  participantName: z.string().min(1, "Participant name is required"),
  userId: z.string().min(1, "User Id is Required"),
  primaryLanguage: z.string().min(1, "Primary Language is Required"),
});

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

router.post("/token", async (req, res) => {
  const parseResult = tokenRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.flatten().fieldErrors;
    return res.status(400).json({
      errorMessage: "Invalid request body",
      errors,
    });
  }

  const { participantName, userId, primaryLanguage } = parseResult.data;

  const participantIdentity = `farmer_${Math.floor(Math.random() * 10000)}`;
  const roomName = `farmer_profile_builder_room_${Math.floor(
    Math.random() * 10000
  )}`;

  const agentName = "core-profile-agent";
  const agentDispatchClient = new AgentDispatchClient(
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  );

  const dispatchOptions = {
    metadata: JSON.stringify({
      userId,
      participantName,
      primaryLanguage,
    }),
  };

  const dispatch = await agentDispatchClient.createDispatch(
    roomName,
    agentName,
    dispatchOptions
  );

  const token = await createParticipantToken(
    {
      identity: participantIdentity,
      name: userId,
      metadata: JSON.stringify({
        userId,
        primaryLanguage,
      }),
    },
    roomName
  );

  const data: ConnectionDetails = {
    serverUrl: LIVEKIT_URL,
    roomName,
    participantName: participantIdentity,
    participantToken: token,
  };

  res
    .json({
      message: "Token generated successfully",
      data,
    })
    .header({ "Cache-Control": "no-store" });
});

export default router;

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };

  at.addGrant(grant);
  return at.toJwt();
}
