import express from "express";
import { db } from "../db/index.js";
import { farmersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId }: { userId?: string } = req.query;
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
});

export default router;
