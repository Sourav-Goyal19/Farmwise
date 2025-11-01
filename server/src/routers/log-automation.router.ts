import z from "zod";
import express from "express";
import { db } from "../db/index.js";
import { eq, desc } from "drizzle-orm";
import { ConnectionDetails } from "../types.js";
import { AgentDispatchClient } from "livekit-server-sdk";
import {
  farmersTable,
  plotCropsTable,
  activityLogsTable,
  insertActivityLogSchema,
} from "../db/schema.js";
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

const createActivityLogSchema = insertActivityLogSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateActivityLogSchema = insertActivityLogSchema
  .omit({
    id: true,
    cropId: true,
    farmerId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

router
  .post("/create/token", async (req, res) => {
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
  })
  .get("/", async (req, res) => {
    try {
      const logs = await db
        .select({
          activityLog: activityLogsTable,
          crop: plotCropsTable,
        })
        .from(activityLogsTable)
        .innerJoin(
          plotCropsTable,
          eq(activityLogsTable.cropId, plotCropsTable.id)
        )
        .orderBy(desc(activityLogsTable.createdAt));

      return res.status(200).json({
        message: "Activity logs retrieved successfully",
        logs,
      });
    } catch (error) {
      console.error("ACTIVITY_LOGS[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .get("/crop/:cropId", async (req, res) => {
    try {
      const { cropId } = req.params;

      if (!cropId) {
        res.status(400).json({ error: "Crop ID is required" });
        return;
      }

      const [crop] = await db
        .select()
        .from(plotCropsTable)
        .where(eq(plotCropsTable.id, cropId));

      if (!crop) {
        res.status(404).json({ error: "Crop not found" });
        return;
      }

      const logs = await db
        .select({
          activeLog: activityLogsTable,
          crop: plotCropsTable,
        })
        .from(activityLogsTable)
        .innerJoin(
          plotCropsTable,
          eq(activityLogsTable.cropId, plotCropsTable.id)
        )
        .where(eq(activityLogsTable.cropId, cropId))
        .orderBy(desc(activityLogsTable.createdAt));

      return res.status(200).json({
        message: "Activity logs for crop retrieved successfully",
        logs,
      });
    } catch (error) {
      console.error("CROP_ACTIVITY_LOGS[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .get("/farmer/:farmerId", async (req, res) => {
    try {
      const { farmerId } = req.params;

      if (!farmerId) {
        res.status(400).json({ error: "Farmer ID is required" });
        return;
      }

      const [farmer] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, farmerId));

      if (!farmer) {
        res.status(404).json({ error: "Farmer not found" });
        return;
      }

      const logs = await db
        .select({
          activityLog: activityLogsTable,
          crop: plotCropsTable,
        })
        .from(activityLogsTable)
        .innerJoin(
          plotCropsTable,
          eq(activityLogsTable.cropId, plotCropsTable.id)
        )
        .where(eq(activityLogsTable.farmerId, farmerId))
        .orderBy(desc(activityLogsTable.createdAt));

      return res.status(200).json({
        message: "Activity logs for farmer retrieved successfully",
        logs,
      });
    } catch (error) {
      console.error("FARMER_ACTIVITY_LOGS[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .get("/:logId", async (req, res) => {
    try {
      const { logId } = req.params;

      if (!logId) {
        res.status(400).json({ error: "Activity log ID is required" });
        return;
      }

      const [log] = await db
        .select({
          activityLog: activityLogsTable,
          crop: plotCropsTable,
        })
        .from(activityLogsTable)
        .innerJoin(
          plotCropsTable,
          eq(activityLogsTable.cropId, plotCropsTable.id)
        )
        .where(eq(activityLogsTable.id, logId));

      if (!log) {
        res.status(404).json({ error: "Activity log not found" });
        return;
      }

      return res.status(200).json({
        message: "Activity log found successfully",
        log,
      });
    } catch (error) {
      console.error("ACTIVITY_LOG[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .post("/", async (req, res) => {
    try {
      const validationResult = createActivityLogSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
        return;
      }

      const logData = validationResult.data;

      const [crop] = await db
        .select()
        .from(plotCropsTable)
        .where(eq(plotCropsTable.id, logData.cropId));

      if (!crop) {
        res.status(404).json({ error: "Crop not found" });
        return;
      }

      const [farmer] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, logData.farmerId));

      if (!farmer) {
        res.status(404).json({ error: "Farmer not found" });
        return;
      }

      const [newLog] = await db
        .insert(activityLogsTable)
        .values(logData)
        .returning();

      return res.status(201).json({
        message: "Activity log created successfully",
        log: newLog,
      });
    } catch (error) {
      console.error("ACTIVITY_LOG[POST]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .put("/:logId", async (req, res) => {
    try {
      const { logId } = req.params;

      if (!logId) {
        res.status(400).json({ error: "Activity log ID is required" });
        return;
      }

      const validationResult = updateActivityLogSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
        return;
      }

      const [existingLog] = await db
        .select()
        .from(activityLogsTable)
        .where(eq(activityLogsTable.id, logId));

      if (!existingLog) {
        res.status(404).json({ error: "Activity log not found" });
        return;
      }

      const updateData = validationResult.data;

      const [updatedLog] = await db
        .update(activityLogsTable)
        .set({
          ...updateData,
        })
        .where(eq(activityLogsTable.id, logId))
        .returning();

      return res.status(200).json({
        message: "Activity log updated successfully",
        log: updatedLog,
      });
    } catch (error) {
      console.error("ACTIVITY_LOG[PUT]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .delete("/:logId", async (req, res) => {
    try {
      const { logId } = req.params;

      if (!logId) {
        res.status(400).json({ error: "Activity log ID is required" });
        return;
      }

      const [existingLog] = await db
        .select()
        .from(activityLogsTable)
        .where(eq(activityLogsTable.id, logId));

      if (!existingLog) {
        res.status(404).json({ error: "Activity log not found" });
        return;
      }

      await db.delete(activityLogsTable).where(eq(activityLogsTable.id, logId));

      return res.status(200).json({
        message: "Activity log deleted successfully",
      });
    } catch (error) {
      console.error("ACTIVITY_LOG[DELETE]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

export default router;
