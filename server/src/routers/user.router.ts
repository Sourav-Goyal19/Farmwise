import { z } from "zod";
import express from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { farmersTable } from "../db/schema.js";

const router = express.Router();

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  primaryLanguage: z.string().min(1).optional(),
  village: z.string().min(1).optional(),
  district: z.string().optional().nullable(),
  age: z.number().int().min(0).optional(),
  educationLevel: z.string().optional().nullable(),
  totalLandArea: z.string().min(1).optional(),
  experience: z.string().min(1).optional(),
});

router
  .get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(401).json({ error: "UserId is missing" });
        return;
      }

      const [user] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, userId));

      if (!user) {
        res.status(404).send({ error: "No user found" });
        return;
      }

      return res.status(200).json({ message: "User found successfully", user });
    } catch (error) {
      console.error("USER[GET]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  })
  .put("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(401).json({ error: "UserId is missing" });
        return;
      }

      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
        return;
      }

      const [existingUser] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, userId));

      if (!existingUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const updateData = validationResult.data;

      const [updatedUser] = await db
        .update(farmersTable)
        .set(updateData)
        .where(eq(farmersTable.id, userId))
        .returning();

      return res.status(200).json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("USER[PUT]:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

export default router;
