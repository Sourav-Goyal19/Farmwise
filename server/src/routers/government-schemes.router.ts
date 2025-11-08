import express from "express";
import z from "zod";
import {
  activityLogsTable,
  farmerContactsTable,
  farmerPlotsTable,
  farmerSchemeMatchingTable,
  farmersTable,
  plotCropsTable,
  SchemeInsertType,
  schemesTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { LLMS } from "../libs/llms.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const router = express.Router();

const matchedSchemesSchema = z.object({
  farmerId: z.string().min(1),
});

router
  .get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "Matching scheme ID is required",
          success: false,
        });
      }

      const [matchingScheme] = await db
        .select({
          id: farmerSchemeMatchingTable.id,
          farmerId: farmerSchemeMatchingTable.farmerId,
          schemeId: farmerSchemeMatchingTable.schemeId,
          reason: farmerSchemeMatchingTable.reason,
          isEligible: farmerSchemeMatchingTable.isEligible,
          createdAt: farmerSchemeMatchingTable.createdAt,
          scheme: {
            id: schemesTable.id,
            schemeName: schemesTable.schemeName,
            state: schemesTable.state,
            ministry: schemesTable.ministry,
            benefit: schemesTable.benefit,
            objective: schemesTable.objective,
            eligibilityCriteria: schemesTable.eligibilityCriteria,
            exclusions: schemesTable.exclusions,
            documentsRequired: schemesTable.documentsRequired,
            applicationProcess: schemesTable.applicationProcess,
            officialWebsite: schemesTable.officialWebsite,
            lastUpdatedAt: schemesTable.lastUpdatedAt,
            features: schemesTable.features,
            components: schemesTable.components,
            targets: schemesTable.targets,
            deadline: schemesTable.deadline,
          },
        })
        .from(farmerSchemeMatchingTable)
        .innerJoin(
          schemesTable,
          eq(farmerSchemeMatchingTable.schemeId, schemesTable.id)
        )
        .where(eq(farmerSchemeMatchingTable.id, id));

      if (!matchingScheme) {
        return res.status(404).json({
          error: "Matching scheme not found",
          success: false,
        });
      }

      return res.status(200).json({
        matchingScheme,
        message: "Matching scheme found successfully",
        success: true,
      });
    } catch (error) {
      console.error("MATCHINGSCHEME[GET]:", error);
      return res.status(500).json({
        error: "Something went wrong",
        success: false,
      });
    }
  })
  .get("/farmer/:farmerId", async (req, res) => {
    try {
      const { farmerId } = req.params;

      if (!farmerId) {
        return res.status(400).json({
          error: "Farmer ID is required",
          success: false,
        });
      }

      const matchingSchemes = await db
        .select({
          id: farmerSchemeMatchingTable.id,
          farmerId: farmerSchemeMatchingTable.farmerId,
          schemeId: farmerSchemeMatchingTable.schemeId,
          reason: farmerSchemeMatchingTable.reason,
          isEligible: farmerSchemeMatchingTable.isEligible,
          createdAt: farmerSchemeMatchingTable.createdAt,
          scheme: {
            id: schemesTable.id,
            schemeName: schemesTable.schemeName,
            state: schemesTable.state,
            ministry: schemesTable.ministry,
            benefit: schemesTable.benefit,
            objective: schemesTable.objective,
            eligibilityCriteria: schemesTable.eligibilityCriteria,
            exclusions: schemesTable.exclusions,
            documentsRequired: schemesTable.documentsRequired,
            applicationProcess: schemesTable.applicationProcess,
            officialWebsite: schemesTable.officialWebsite,
            lastUpdatedAt: schemesTable.lastUpdatedAt,
            features: schemesTable.features,
            components: schemesTable.components,
            targets: schemesTable.targets,
            deadline: schemesTable.deadline,
          },
        })
        .from(farmerSchemeMatchingTable)
        .innerJoin(
          schemesTable,
          eq(farmerSchemeMatchingTable.schemeId, schemesTable.id)
        )
        .where(eq(farmerSchemeMatchingTable.farmerId, farmerId));

      return res.status(200).json({
        matchingSchemes,
        message: "Matching schemes found successfully",
        success: true,
      });
    } catch (error) {
      console.error("MATCHINGSCHEMES[GET]:", error);
      return res.status(500).json({
        error: "Something went wrong",
        success: false,
      });
    }
  })
  .get("/scheme/:schemeId", async (req, res) => {
    try {
      const { schemeId } = req.params;

      if (!schemeId) {
        return res.status(400).json({
          error: "Scheme ID is required",
          success: false,
        });
      }

      const matchingSchemes = await db
        .select({
          id: farmerSchemeMatchingTable.id,
          farmerId: farmerSchemeMatchingTable.farmerId,
          schemeId: farmerSchemeMatchingTable.schemeId,
          reason: farmerSchemeMatchingTable.reason,
          isEligible: farmerSchemeMatchingTable.isEligible,
          createdAt: farmerSchemeMatchingTable.createdAt,
          farmer: {
            id: farmersTable.id,
            name: farmersTable.name,
            village: farmersTable.village,
            district: farmersTable.district,
          },
          scheme: {
            id: schemesTable.id,
            schemeName: schemesTable.schemeName,
            state: schemesTable.state,
            ministry: schemesTable.ministry,
          },
        })
        .from(farmerSchemeMatchingTable)
        .innerJoin(
          schemesTable,
          eq(farmerSchemeMatchingTable.schemeId, schemesTable.id)
        )
        .innerJoin(
          farmersTable,
          eq(farmerSchemeMatchingTable.farmerId, farmersTable.id)
        )
        .where(eq(farmerSchemeMatchingTable.schemeId, schemeId));

      return res.status(200).json({
        matchingSchemes,
        message: "Matching schemes for scheme found successfully",
        success: true,
      });
    } catch (error) {
      console.error("MATCHINGSCHEMES_BY_SCHEME[GET]:", error);
      return res.status(500).json({
        error: "Something went wrong",
        success: false,
      });
    }
  })
  .post("/matched-schemes", async (req, res) => {
    try {
      const body = req.body;

      const parseResult = matchedSchemesSchema.safeParse(body);

      if (parseResult.error) {
        return res
          .status(400)
          .json({ error: parseResult.error.message, success: false });
      }

      const { farmerId } = parseResult.data;

      const [farmer] = await db
        .select()
        .from(farmersTable)
        .where(eq(farmersTable.id, farmerId));

      const [contact] = await db
        .select()
        .from(farmerContactsTable)
        .where(eq(farmerContactsTable.farmerId, farmerId));

      const plots = await db
        .select()
        .from(farmerPlotsTable)
        .where(eq(farmerPlotsTable.farmerId, farmerId));

      const crops = await db
        .select()
        .from(plotCropsTable)
        .where(eq(plotCropsTable.farmerId, farmerId));

      const logs = await db
        .select()
        .from(activityLogsTable)
        .where(eq(activityLogsTable.farmerId, farmerId))
        .orderBy(activityLogsTable.createdAt);

      const allSchemes = await db.select().from(schemesTable);

      const matchedSchemesResponseFormat = z.object({
        scheme_name: z.string().describe("A name of the choosen scheme"),
        scheme_id: z.string().describe("The id of the choosen scheme"),
        reason: z.string().describe("Reason to choose the scheme."),
      });

      type MatchedSchemesResponseType = z.infer<
        typeof matchedSchemesResponseFormat
      >;

      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `
      # Role: Agricultural Scheme Matching Specialist

    ## Primary Objective
    Analyze farmer profiles and match them with the most suitable government agricultural schemes based on eligibility criteria, farming context, and potential benefits.

    ## Farmer Profile Analysis Framework
    ### Personal & Demographic Factors
    - **Location**: State, district, village
    - **Demographics**: Age, gender, education level
    - **Experience**: Years in farming
    - **Land Ownership**: Total land area, ownership status
    ### Agricultural Context
    - **Land Details**: Plot sizes, soil types, irrigation methods
    - **Crop Portfolio**: Current crops, varieties, seasons, growth stages
    - **Assets & Infrastructure**: Farming equipment, irrigation systems
    - **Historical Activities**: Past farming activities and practices

    ## Scheme Matching Strategy
    ### Eligibility Assessment
    1. **Geographic Eligibility**: Match farmer's state with scheme availability
    2. **Demographic Fit**: Check age, gender, education requirements
    3. **Land-based Criteria**: Verify land area, ownership, soil type compatibility
    4. **Crop-specific Schemes**: Identify schemes targeting specific crops
    5. **Infrastructure Alignment**: Match with schemes requiring specific assets
    ### Priority Scoring (Mental Model)
    - **High Priority**: Exact matches on key criteria + high potential impact
    - **Medium Priority**: Partial matches with good benefit alignment
    - **Low Priority**: Minimal matches or low relevance

    ## Output Requirements
    ### JSON Structure
    [
      {{
        "scheme_name": "Exact scheme name from database",
        "scheme_id": "UUID from schemes table",
        "reason": "Detailed justification covering: eligibility alignment, benefit relevance, and why this scheme specifically helps this farmer's situation"
      }}
    ]
    ### Quality Standards for Reasons
    - **Specificity**: Reference exact farmer attributes that match criteria
    - **Benefit Focus**: Explain how scheme addresses farmer's specific needs
    - **Actionability**: Suggest how farmer could leverage the scheme
    - **Completeness**: Cover all major eligibility factors

    ## Execution Workflow
    1. **Comprehensive Analysis**: Review all farmer data points systematically
    2. **Rigorous Filtering**: Apply strict eligibility checking
    3. **Benefit Maximization**: Prioritize schemes with highest potential impact
    4. **Validation**: Ensure all suggested schemes have valid IDs and current status

    ## Success Criteria
    - Suggest minimum 3-5 relevant schemes for diverse options
    - Ensure 100% eligibility alignment for suggested schemes
    - Provide clear, farmer-friendly reasoning for each suggestion
    - Cover different ministry domains (agriculture, welfare, infrastructure, etc.)
    - Balance between immediate needs and long-term development schemes

    **Remember**: Your suggestions could significantly impact this farmer's livelihood. Be thorough, accurate, and farmer-centric in your recommendations.
    `,
        ],
        [
          "human",
          `Here are the complete details of a farmer:
            Farmer - {farmer}
            Contact - {contact}
            Plots - {plots}
            Crops - {crops}
            Logs - {logs}

            Here are all the schemes:
            {schemes}
        `,
        ],
      ]);

      const chain = prompt
        .pipe(LLMS["llama70"])
        .pipe(new JsonOutputParser<MatchedSchemesResponseType[]>());

      const response = await chain.invoke({
        farmer: JSON.stringify(farmer),
        contact: JSON.stringify(contact),
        plots: JSON.stringify(plots),
        crops: JSON.stringify(crops),
        logs: JSON.stringify(logs),
        schemes: JSON.stringify(allSchemes),
      });

      console.log("Response", response);

      if (response.length <= 0) {
        return res.status(500).json({ error: "No matching schemes found." });
      }

      for (const aires of response) {
        await db.insert(farmerSchemeMatchingTable).values({
          schemeId: aires.scheme_id,
          reason: aires.reason,
          isEligible: true,
          farmerId,
        });
      }

      return res.status(200).json({
        message: "matching schemes added successfully.",
        success: true,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(200)
        .json({ message: "Something went wrong.", success: false });
    }
  })
  .post("/add-data", async (req, res) => {
    try {
      const body = req.body;

      const schemes: SchemeInsertType[] = body.schemes.map((scheme: any) => ({
        schemeName: scheme.scheme_name,
        state: scheme.state,
        ministry: scheme.ministry,
        benefit: scheme.benefit,
        objective: scheme.objective,
        eligibilityCriteria: scheme.eligibility,
        exclusions: scheme.exclusions,
        documentsRequired: scheme.documents_required,
        applicationProcess: scheme.application_process,
        officialWebsite: scheme.official_website,
        lastUpdatedAt: new Date(scheme.last_updated),
        features: scheme.features,
        components: scheme.components,
        targets: scheme.targets,
        deadline: scheme.deadline ? new Date(scheme.deadline) : null,
      }));

      await db.insert(schemesTable).values(schemes);

      return res.status(200).json({ msg: "Data inserted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error, success: false });
    }
  });

export default router;
