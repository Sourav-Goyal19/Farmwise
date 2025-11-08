import z from "zod";
import { db } from "../db/index.js";
import { farmersTable } from "../db/schema.js";
import { tool } from "@langchain/core/tools";

const insertFarmerSchema = z.object({
    id: z.string().describe("Unique identifier for the farmer"),
    name: z.string().describe("Full name of the farmer"),
    gender: z.enum(["M", "F"]).describe("Gender of the farmer: M or F"),
    primaryLanguage: z
        .string()
        .describe("Primary language spoken by the farmer"),
    village: z.string().describe("Village where the farmer resides"),
    district: z
        .string()
        .optional()
        .describe("District of the farmer (optional)"),
    age: z.number().int().describe("Age of the farmer in years"),
    educationLevel: z
        .string()
        .optional()
        .describe("Highest education level attained (optional)"),
    totalLandArea: z
        .string()
        .describe(
            "Total land area owned or cultivated by the farmer, in acres or hectares (as string to preserve decimal precision)",
        ),
    experience: z
        .string()
        .describe(
            "Years of farming experience (as string to preserve decimal precision)",
        ),
    createdAt: z
        .date()
        .optional()
        .describe("Timestamp when the farmer record was created (set by DB)"),
    updatedAt: z
        .date()
        .optional()
        .describe(
            "Timestamp when the farmer record was last updated (set on update)",
        ),
});

type InsertFarmerSchemaType = z.infer<typeof insertFarmerSchema>;

const insertFarmerProfileTool = tool(
    async (input: InsertFarmerSchemaType) => {
        try {
            const [farmer] = await db
                .insert(farmersTable)
                .values({
                    ...input,
                })
                .returning();
            return "A farmer profile has been inserted successfully";
        } catch (error) {
            return error + "";
        }
    },
    {
        name: "Insert Farmer Profile",
        description: "Tool to add farmers profile in an online database",
        schema: insertFarmerSchema,
    },
);

export { insertFarmerProfileTool };
