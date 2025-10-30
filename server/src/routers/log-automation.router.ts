import z from "zod";
import express from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { ConnectionDetails } from "../types.js";
import { AgentDispatchClient } from "livekit-server-sdk";
import { farmersTable, plotCropsTable } from "../db/schema.js";
import {
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  createParticipantToken,
} from "../libs/utils.js";

const router = express.Router();

const createTokenSchema = z.object({
  userId: z.string().min(1, "Required"),
  cropId: z.string().uuid(),
  roomName: z.string().min(1),
});

router.post("/create/token", async (req, res) => {
  console.log("Got request to /api/logs/create/token");
  try {
    const body = req.body;

    const parseResult = createTokenSchema.safeParse(body);

    if (parseResult.error) {
      res.status(400).json({ error: parseResult.error.message });
      return;
    }

    const { userId, cropId, roomName } = parseResult.data;
    const [user] = await db
      .select()
      .from(farmersTable)
      .where(eq(farmersTable.id, userId));

    if (!user) {
      res.status(400).json({ error: "Farmer not found." });
      return;
    }

    const [crop] = await db
      .select()
      .from(plotCropsTable)
      .where(eq(plotCropsTable.id, cropId));

    if (!crop) {
      res.status(400).json({ error: "Crop not found out." });
      return;
    }

    const participantIdentity = `log-automation-${crypto.randomUUID()}`;

    const agentDispatchClient = new AgentDispatchClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET
    );

    const metadata = JSON.stringify({
      farmer: { ...user, cropId },
    });

    const dispatch = await agentDispatchClient.createDispatch(
      roomName,
      "log-automation-agent",
      {
        metadata,
      }
    );

    const token = await createParticipantToken(roomName, {
      identity: participantIdentity,
      metadata,
      name: userId,
    });

    const data: ConnectionDetails = {
      livekitServerUrl: LIVEKIT_URL,
      roomName,
      participantIdentity,
      participantToken: token,
    };

    res
      .status(200)
      .set("Cache-Control", "no-store")
      .json({ data, msg: "Token created successfully." });
  } catch (error) {
    console.error("Error creating LiveKit token:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
