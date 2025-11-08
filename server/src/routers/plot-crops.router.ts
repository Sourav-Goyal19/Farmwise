import express from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { plotCropsTable, farmerPlotsTable } from "../db/schema.js";
import { insertPlotCropsSchema } from "../db/schema.js";

const router = express.Router();

const createPlotCropSchema = insertPlotCropsSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

const updatePlotCropSchema = insertPlotCropsSchema
    .omit({
        id: true,
        plotId: true,
        createdAt: true,
        updatedAt: true,
    })
    .partial();

router
    .get("/plot/:plotId", async (req, res) => {
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
                .where(eq(plotCropsTable.plotId, plotId))
                .orderBy(plotCropsTable.createdAt);

            return res.status(200).json({
                message: "Crops retrieved successfully",
                crops,
            });
        } catch (error) {
            console.error("CROPS[GET]:", error);
            res.status(500).json({ error: "Something went wrong" });
        }
    })
    .get("/:cropId", async (req, res) => {
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

            return res.status(200).json({
                message: "Crop found successfully",
                crop,
            });
        } catch (error) {
            console.error("CROP[GET]:", error);
            res.status(500).json({ error: "Something went wrong" });
        }
    })
    .post("/", async (req, res) => {
        try {
            const validationResult = createPlotCropSchema.safeParse(req.body);

            console.log("Error: ", validationResult);
            if (!validationResult.success) {
                console.log("here is the error");
                res.status(400).json({
                    error: "Invalid Data",
                    details: validationResult.error.message,
                });
                return;
            }

            const cropData = validationResult.data;

            const [plot] = await db
                .select()
                .from(farmerPlotsTable)
                .where(eq(farmerPlotsTable.id, cropData.plotId));

            if (!plot) {
                res.status(404).json({ error: "Plot not found" });
                return;
            }

            const [newCrop] = await db
                .insert(plotCropsTable)
                .values(cropData)
                .returning();

            return res.status(201).json({
                message: "Crop created successfully",
                crop: newCrop,
            });
        } catch (error) {
            console.error("CROP[POST]:", error);
            res.status(500).json({ error: "Something went wrong" });
        }
    })
    .put("/:cropId", async (req, res) => {
        try {
            const { cropId } = req.params;

            if (!cropId) {
                res.status(400).json({ error: "Crop ID is required" });
                return;
            }

            const validationResult = updatePlotCropSchema.safeParse(req.body);

            if (!validationResult.success) {
                console.log("here is the error");
                res.status(400).json({
                    error: "Invalid data",
                    details: validationResult.error.message,
                });
                return;
            }

            const [existingCrop] = await db
                .select()
                .from(plotCropsTable)
                .where(eq(plotCropsTable.id, cropId));

            if (!existingCrop) {
                res.status(404).json({ error: "Crop not found" });
                return;
            }

            const updateData = validationResult.data;

            const [updatedCrop] = await db
                .update(plotCropsTable)
                .set({
                    ...updateData,
                    updatedAt: new Date(),
                })
                .where(eq(plotCropsTable.id, cropId))
                .returning();

            return res.status(200).json({
                message: "Crop updated successfully",
                crop: updatedCrop,
            });
        } catch (error) {
            console.error("CROP[PUT]:", error);
            res.status(500).json({ error: "Something went wrong" });
        }
    })
    .delete("/:cropId", async (req, res) => {
        try {
            const { cropId } = req.params;

            if (!cropId) {
                res.status(400).json({ error: "Crop ID is required" });
                return;
            }

            const [existingCrop] = await db
                .select()
                .from(plotCropsTable)
                .where(eq(plotCropsTable.id, cropId));

            if (!existingCrop) {
                res.status(404).json({ error: "Crop not found" });
                return;
            }

            await db
                .delete(plotCropsTable)
                .where(eq(plotCropsTable.id, cropId));

            return res.status(200).json({
                message: "Crop deleted successfully",
            });
        } catch (error) {
            console.error("CROP[DELETE]:", error);
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

            const crops = await db
                .select({
                    crop: plotCropsTable,
                    plot: farmerPlotsTable,
                })
                .from(plotCropsTable)
                .innerJoin(
                    farmerPlotsTable,
                    eq(plotCropsTable.plotId, farmerPlotsTable.id),
                )
                .where(eq(farmerPlotsTable.farmerId, farmerId))
                .orderBy(plotCropsTable.createdAt);

            return res.status(200).json({
                message: "Farmer crops retrieved successfully",
                crops,
            });
        } catch (error) {
            console.error("FARMER_CROPS[GET]:", error);
            res.status(500).json({ error: "Something went wrong" });
        }
    });

export default router;
