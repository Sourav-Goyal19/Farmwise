import { z } from "zod";
import express from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { farmerPlotsTable, plotCropsTable } from "../db/schema.js";

const router = express.Router();

const createPlotSchema = z.object({
  farmerId: z.string().min(1),
  plotName: z.string().optional(),
  area: z.string().min(1),
  soilType: z.enum(["clay", "loamy", "sandy", "laterite", "black"]).optional(),
  irrigationType: z.enum(["drip", "canal", "rain-fed", "sprinkler"]).optional(),
  waterSource: z.string().optional(),
  latitude: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((num) => !isNaN(num) && num >= -90 && num <= 90, {
      message: "Invalid latitude value",
    })
    .optional(),
  longitude: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((num) => !isNaN(num) && num >= -180 && num <= 180, {
      message: "Invalid longitude value",
    })
    .optional(),
  isOwned: z.boolean().default(true),
  ownershipProofUrl: z.string().optional(),
});

const updatePlotSchema = z.object({
  plotName: z.string().optional(),
  area: z.string().min(1).optional(),
  soilType: z.enum(["clay", "loamy", "sandy", "laterite", "black"]).optional(),
  irrigationType: z.enum(["drip", "canal", "rain-fed", "sprinkler"]).optional(),
  waterSource: z.string().optional(),
  latitude: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((num) => !isNaN(num) && num >= -90 && num <= 90, {
      message: "Invalid latitude value",
    })
    .optional(),
  longitude: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((num) => !isNaN(num) && num >= -180 && num <= 180, {
      message: "Invalid longitude value",
    })
    .optional(),
  isOwned: z.boolean().optional(),
  ownershipProofUrl: z.string().optional(),
});

router
  .get("/farmer/:farmerId", async (req, res) => {
    try {
      const { farmerId } = req.params;

      if (!farmerId) {
        res.status(400).json({ error: "Farmer ID is required" });
        return;
      }

      const plots = await db
        .select()
        .from(farmerPlotsTable)
        .where(eq(farmerPlotsTable.farmerId, farmerId))
        .orderBy(farmerPlotsTable.createdAt);

      return res.status(200).json({
        message: "Plots retrieved successfully",
        plots,
      });
    } catch (error) {
      console.error("PLOTS[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .get("/:plotId", async (req, res) => {
    try {
      const { plotId } = req.params;

      if (!plotId) {
        res.status(400).json({ error: "Plot ID is required" });
        return;
      }

      const [plot] = await db
        .select()
        .from(farmerPlotsTable)
        .where(eq(farmerPlotsTable.id, plotId));

      if (!plot) {
        res.status(404).json({ error: "Plot not found" });
        return;
      }

      const crops = await db
        .select()
        .from(plotCropsTable)
        .where(eq(plotCropsTable.plotId, plotId));

      return res.status(200).json({
        message: "Plot found successfully",
        plot: {
          ...plot,
          crops,
        },
      });
    } catch (error) {
      console.error("PLOT[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .post("/", async (req, res) => {
    try {
      const validationResult = createPlotSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
        return;
      }

      const plotData = validationResult.data;

      const [newPlot] = await db
        .insert(farmerPlotsTable)
        .values(plotData)
        .returning();

      return res.status(201).json({
        message: "Plot created successfully",
        plot: newPlot,
      });
    } catch (error) {
      console.error("PLOT[POST]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .put("/:plotId", async (req, res) => {
    try {
      const { plotId } = req.params;

      if (!plotId) {
        res.status(400).json({ error: "Plot ID is required" });
        return;
      }

      const validationResult = updatePlotSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
        return;
      }

      const [existingPlot] = await db
        .select()
        .from(farmerPlotsTable)
        .where(eq(farmerPlotsTable.id, plotId));

      if (!existingPlot) {
        res.status(404).json({ error: "Plot not found" });
        return;
      }

      const updateData = validationResult.data;

      const [updatedPlot] = await db
        .update(farmerPlotsTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(farmerPlotsTable.id, plotId))
        .returning();

      return res.status(200).json({
        message: "Plot updated successfully",
        plot: updatedPlot,
      });
    } catch (error) {
      console.error("PLOT[PUT]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .delete("/:plotId", async (req, res) => {
    try {
      const { plotId } = req.params;

      if (!plotId) {
        res.status(400).json({ error: "Plot ID is required" });
        return;
      }

      const [existingPlot] = await db
        .select()
        .from(farmerPlotsTable)
        .where(eq(farmerPlotsTable.id, plotId));

      if (!existingPlot) {
        res.status(404).json({ error: "Plot not found" });
        return;
      }

      await db.delete(farmerPlotsTable).where(eq(farmerPlotsTable.id, plotId));

      return res.status(200).json({
        message: "Plot deleted successfully",
      });
    } catch (error) {
      console.error("PLOT[DELETE]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

export default router;
