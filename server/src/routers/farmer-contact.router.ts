import { z } from "zod";
import express from "express";
import { db } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { farmerContactsTable, farmersTable } from "../db/schema.js";

const router = express.Router();

const createContactSchema = z.object({
  phoneNumber: z.string().length(10, "Phone number must be 10 digits"),
  aadhaarNumber: z
    .string()
    .length(12, "Aadhaar number must be 12 digits")
    .optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  verified: z.boolean().optional().default(false),
});

const updateContactSchema = z.object({
  phoneNumber: z
    .string()
    .length(10, "Phone number must be 10 digits")
    .optional(),
  aadhaarNumber: z
    .string()
    .length(12, "Aadhaar number must be 12 digits")
    .optional()
    .nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  verified: z.boolean().optional(),
});

router
  .get("/farmer/:farmerId", async (req, res) => {
    try {
      const { farmerId } = req.params;

      if (!farmerId) {
        return res.status(400).json({ error: "Farmer ID is required" });
      }

      const contacts = await db
        .select()
        .from(farmerContactsTable)
        .where(eq(farmerContactsTable.farmerId, farmerId))
        .orderBy(farmerContactsTable.createdAt);

      return res.status(200).json({
        message: "Contacts retrieved successfully",
        contacts,
      });
    } catch (error) {
      console.error("CONTACTS[GET ALL]:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  })
  .get("/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      const [contact] = await db
        .select()
        .from(farmerContactsTable)
        .where(eq(farmerContactsTable.id, contactId));

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      return res.status(200).json({
        message: "Contact retrieved successfully",
        contact,
      });
    } catch (error) {
      console.error("CONTACTS[GET SINGLE]:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  })
  .post("/", async (req, res) => {
    try {
      const validationResult = createContactSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
      }

      const { farmerId } = req.body;

      if (!farmerId) {
        return res.status(400).json({ error: "Farmer ID is required" });
      }

      const [farmer] = await db
        .select({ id: farmersTable.id })
        .from(farmersTable)
        .where(eq(farmersTable.id, farmerId));

      if (!farmer) {
        return res.status(404).json({ error: "Farmer not found" });
      }

      const [existingContact] = await db
        .select()
        .from(farmerContactsTable)
        .where(
          and(
            eq(farmerContactsTable.farmerId, farmerId),
            eq(
              farmerContactsTable.phoneNumber,
              validationResult.data.phoneNumber
            )
          )
        );

      if (existingContact) {
        return res.status(409).json({
          error:
            "Contact with this phone number already exists for this farmer",
        });
      }

      const [newContact] = await db
        .insert(farmerContactsTable)
        .values({
          farmerId,
          ...validationResult.data,
        })
        .returning();

      return res.status(201).json({
        message: "Contact created successfully",
        contact: newContact,
      });
    } catch (error) {
      console.error("CONTACTS[POST]:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  })
  .put("/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      const validationResult = updateContactSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          details: validationResult.error.issues,
        });
      }

      const [existingContact] = await db
        .select()
        .from(farmerContactsTable)
        .where(eq(farmerContactsTable.id, contactId));

      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (
        validationResult.data.phoneNumber &&
        validationResult.data.phoneNumber !== existingContact.phoneNumber
      ) {
        const [duplicateContact] = await db
          .select()
          .from(farmerContactsTable)
          .where(
            and(
              eq(farmerContactsTable.farmerId, existingContact.farmerId),
              eq(
                farmerContactsTable.phoneNumber,
                validationResult.data.phoneNumber
              )
            )
          );

        if (duplicateContact) {
          return res.status(409).json({
            error:
              "Another contact with this phone number already exists for this farmer",
          });
        }
      }

      const [updatedContact] = await db
        .update(farmerContactsTable)
        .set({
          ...validationResult.data,
          updatedAt: new Date(),
        })
        .where(eq(farmerContactsTable.id, contactId))
        .returning();

      return res.status(200).json({
        message: "Contact updated successfully",
        contact: updatedContact,
      });
    } catch (error) {
      console.error("CONTACTS[PUT]:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  })
  .delete("/:contactId", async (req, res) => {
    try {
      const { contactId } = req.params;

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      const [existingContact] = await db
        .select()
        .from(farmerContactsTable)
        .where(eq(farmerContactsTable.id, contactId));

      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      await db
        .delete(farmerContactsTable)
        .where(eq(farmerContactsTable.id, contactId));

      return res.status(200).json({
        message: "Contact deleted successfully",
      });
    } catch (error) {
      console.error("CONTACTS[DELETE]:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  })
  .patch("/:contactId/verify", async (req, res) => {
    try {
      const { contactId } = req.params;

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      const [updatedContact] = await db
        .update(farmerContactsTable)
        .set({
          verified: true,
          updatedAt: new Date(),
        })
        .where(eq(farmerContactsTable.id, contactId))
        .returning();

      if (!updatedContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      return res.status(200).json({
        message: "Contact verified successfully",
        contact: updatedContact,
      });
    } catch (error) {
      console.error("CONTACTS[PATCH VERIFY]:", error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  });

export default router;
