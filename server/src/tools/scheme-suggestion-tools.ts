import z from "zod";
import { tool } from "langchain";
import { db } from "../db/index.js";
import { eq, sql } from "drizzle-orm";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import {
  activityLogsTable,
  farmerContactsTable,
  farmerPlotsTable,
  farmersTable,
  plotCropsTable,
  schemesTable,
} from "../db/schema.js";

export const getSchemeByName = tool(
  async ({ name }) => {
    const result = await db
      .select()
      .from(schemesTable)
      .where(sql`LOWER(${schemesTable.schemeName}) LIKE LOWER(${`%${name}%`})`);
    return JSON.stringify(result);
  },
  {
    name: "getSchemeByName",
    description: "Find schemes by (partial) name match.",
    schema: z.object({
      name: z
        .string()
        .min(1)
        .describe(
          "Full or partial name of the government scheme to search for. Example: 'PM Kisan' or 'Ujjwala'."
        ),
    }),
  }
);

export const getSchemesByMinistry = tool(
  async ({ ministry }) => {
    const result = await db
      .select()
      .from(schemesTable)
      .where(
        sql`LOWER(${schemesTable.ministry}) LIKE LOWER(${`%${ministry}%`})`
      );
    return JSON.stringify(result);
  },
  {
    name: "getSchemesByMinistry",
    description: "Get all schemes under a specific ministry.",
    schema: z.object({
      ministry: z
        .string()
        .min(1)
        .describe(
          "Exact name of the ministry managing the schemes. Example: 'Ministry of Agriculture and Farmers Welfare'."
        ),
    }),
  }
);

export const getSchemeByState = tool(
  async ({ state }) => {
    const schemes = await db
      .select()
      .from(schemesTable)
      .where(sql`LOWER(${schemesTable.state}) LIKE LOWER(${`%${state}%`})`);
    return JSON.stringify(schemes);
  },
  {
    name: "getSchemeByState",
    description: "Get all the schemes according to the state of India.",
    schema: z.object({
      state: z
        .string()
        .min(1)
        .describe(
          "Name of the Indian state or union territory for which you want to retrieve the available schemes. Example: 'Maharashtra' or 'Tamil Nadu'."
        ),
    }),
  }
);

export const getSchemeById = tool(
  async ({ scheme_id }) => {
    const [scheme] = await db
      .select()
      .from(schemesTable)
      .where(eq(schemesTable.id, scheme_id));

    return JSON.stringify(scheme);
  },
  {
    name: "getSchemeById",
    description: "Provide the complete scheme through its unique ID.",
    schema: z.object({
      scheme_id: z
        .string()
        .uuid()
        .describe(
          "The unique identifier (UUID format) of the scheme. Example: 'a3c52f1a-bb24-4f0a-bbf0-08d9a88f765a'."
        ),
    }),
  }
);

export const searchSchemesHybrid = tool(
  async ({ query, filters, topK }) => {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY!,
      model: "text-embedding-004",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_ENDPOINT!,
        collectionName: "schemes-data",
        apiKey: process.env.QDRANT_API_KEY!,
      }
    );

    const retriever = vectorStore.asRetriever({
      searchType: "similarity",
      k: topK || 10,
      filter: filters || {},
    });

    const results = await retriever.invoke(query);
    return JSON.stringify(results);
  },
  {
    name: "searchSchemesHybrid",
    description:
      "Performs a semantic search for government schemes using Qdrant and Google embeddings, with optional metadata filters.",
    schema: z.object({
      query: z.string(),
      topK: z.number().default(10).nullish(),
      filters: z.record(z.any()).nullish(),
    }),
  }
);

export const getFarmerProfile = tool(
  async ({ farmerId }) => {
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

    return JSON.stringify({
      farmer: farmer || {},
      contact: contact || {},
      plots: plots || [],
      crops: crops || [],
      logs: logs || [],
    });
  },
  {
    name: "getFarmerProfile",
    description: "Provide the complete details of a farmer",
    schema: z.object({
      farmerId: z
        .string()
        .min(1)
        .describe("The id(not name) of the farmer to get the details."),
    }),
  }
);
