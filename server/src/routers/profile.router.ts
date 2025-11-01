import { z } from "zod";
import express from "express";
import { ConnectionDetails } from "../types.js";
import { AgentDispatchClient } from "livekit-server-sdk";
import { createParticipantToken } from "../libs/utils.js";

const router = express.Router();

const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

const tokenRequestSchema = z.object({
  roomName: z.string().min(1, "Participant name is required"),
  userId: z.string().min(1, "User Id is Required"),
  primaryLanguage: z.string().min(1, "Primary Language is Required"),
});

router.post("/token", async (req, res) => {
  console.log("Got Request to /profile/token");
  const parseResult = tokenRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.flatten().fieldErrors;
    return res.status(400).json({
      errorMessage: "Invalid request body",
      errors,
    });
  }

  const { roomName, userId, primaryLanguage } = parseResult.data;

  const participantIdentity = `farmer_${userId}`;

  const agentName = "core-profile-agent";
  const agentDispatchClient = new AgentDispatchClient(
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  );

  const dispatchOptions = {
    metadata: JSON.stringify({
      userId,
      primaryLanguage,
    }),
  };

  const dispatch = await agentDispatchClient.createDispatch(
    roomName,
    agentName,
    dispatchOptions
  );

  const token = await createParticipantToken(roomName, {
    identity: participantIdentity,
    name: userId,
    metadata: JSON.stringify({
      userId,
      primaryLanguage,
    }),
  });

  const data: ConnectionDetails = {
    livekitServerUrl: LIVEKIT_URL,
    roomName,
    participantIdentity,
    participantToken: token,
  };

  res.status(200).set("Cache-Control", "no-store").json({
    message: "Token generated successfully",
    data,
  });
});

export default router;
