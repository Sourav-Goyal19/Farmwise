import {
  farmersTable,
  plotCropsTable,
  farmerPlotsTable,
  FarmerSelectType,
  activityLogsTable,
  PlotCropSelectType,
  farmerContactsTable,
  FarmerPlotSelectType,
  ActivityLogSelectType,
  FarmerContactSelectType,
  farmerSchemeMatchingTable,
} from "../db/schema.js";
import z from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { LLMS } from "../libs/llms.js";
import { createAgent } from "langchain";
import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import {
  getSchemeByState,
  getSchemesByMinistry,
  getSchemeByName,
  getSchemeById,
  searchSchemesHybrid,
  getFarmerProfile,
} from "../tools/scheme-suggestion-tools.js";

type MatchingSchemeType = {
  scheme_name: string;
  scheme_id: string;
  reason: string;
};

const stateAnnotation = Annotation.Root({
  farmerId: Annotation<string>({
    default: () => "",
    reducer: (oldValue, newValue) => newValue,
  }),
  farmer: Annotation<Partial<FarmerSelectType>>({
    default: () => ({}),
    reducer: (oldValue, newValue) => newValue,
  }),
  contact: Annotation<Partial<FarmerContactSelectType>>({
    default: () => ({}),
    reducer: (oldValue, newValue) => newValue,
  }),
  plots: Annotation<FarmerPlotSelectType[]>({
    default: () => [],
    reducer: (oldValue, newValue) => newValue,
  }),
  crops: Annotation<PlotCropSelectType[]>({
    default: () => [],
    reducer: (oldValue, newValue) => newValue,
  }),
  logs: Annotation<ActivityLogSelectType[]>({
    default: () => [],
    reducer: (oldValue, newValue) => newValue,
  }),
  matchingSchemes: Annotation<Partial<MatchingSchemeType[]>>({
    default: () => [],
    reducer: (oldValue, newValue) => newValue,
  }),
  error: Annotation<string>({
    default: () => "",
    reducer: (oldValue, newValue) => newValue,
  }),
});

type StateType = typeof stateAnnotation.State;

const farmerDataNode = async (
  state: StateType
): Promise<Partial<StateType>> => {
  console.log("🔴🔴🔴 Came Farmer Data node.");
  try {
    if (!state.farmerId) {
      return { error: "Farmer ID is required" };
    }

    const [farmer] = await db
      .select()
      .from(farmersTable)
      .where(eq(farmersTable.id, state.farmerId));

    const [contact] = await db
      .select()
      .from(farmerContactsTable)
      .where(eq(farmerContactsTable.farmerId, state.farmerId));

    const plots = await db
      .select()
      .from(farmerPlotsTable)
      .where(eq(farmerPlotsTable.farmerId, state.farmerId));

    const crops = await db
      .select()
      .from(plotCropsTable)
      .where(eq(plotCropsTable.farmerId, state.farmerId));

    const logs = await db
      .select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.farmerId, state.farmerId))
      .orderBy(activityLogsTable.createdAt);

    // console.log("Farmer:", farmer);
    // console.log("Contact", contact);
    // console.log("Plots:", plots);
    // console.log("Crops:", crops);
    // console.log("Logs:", logs);

    return {
      farmer: farmer || {},
      contact: contact || {},
      plots: plots || [],
      crops: crops || [],
      logs: logs || [],
    };
  } catch (error) {
    console.error("FARMERDATANODE:", error);
    return { error: "Failed to fetch farmer data" };
  }
};

const detailedResponse = z.object({
  scheme_name: z.string().describe("A name of the choosen scheme"),
  scheme_id: z.number().describe("The id of the choosen scheme"),
  reasoning: z.string().describe("Reason to choose the scheme."),
});

const schemeMatchingNode = async (
  state: StateType
): Promise<Partial<StateType>> => {
  console.log("🔴🔴🔴 Came to scheme matching node");
  const { farmer, contact, plots, crops, logs } = state;

  const schemeMatchingAgent = createAgent({
    model: LLMS["kimik2"],
    systemPrompt: `
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

      ## Tool Usage Protocol
      ### Search Strategy
      1. **Start Broad**: Use \`searchSchemesHybrid\` with farmer's primary characteristics
      2. **Refine by Dimension**: Use specific tools for state, ministry, or scheme names
      3. **Deep Dive**: Use \`getSchemeById\` for detailed eligibility verification
      4. **Cross-reference**: Combine multiple tool results for comprehensive coverage
      ### Input Formatting
      - **State Names**: Use full state names (e.g., "Maharashtra", not "MH")
      - **Ministries**: Use exact ministry names from scheme data
      - **Scheme Names**: Partial matching supported, but be specific
      - **Filters**: Use relevant metadata filters for targeted searches

      ## Output Requirements
      ### JSON Structure
      \`\`\`json
      [
        {
          "scheme_name": "Exact scheme name from database",
          "scheme_id": "UUID from schemes table",
          "reason": "Detailed justification covering: eligibility alignment, benefit relevance, and why this scheme specifically helps this farmer's situation"
        }
      ]
      \`\`\`
      ### Quality Standards for Reasons
      - **Specificity**: Reference exact farmer attributes that match criteria
      - **Benefit Focus**: Explain how scheme addresses farmer's specific needs
      - **Actionability**: Suggest how farmer could leverage the scheme
      - **Completeness**: Cover all major eligibility factors

      ## Execution Workflow
      1. **Comprehensive Analysis**: Review all farmer data points systematically
      2. **Iterative Searching**: Use multiple tool calls to build scheme candidate list
      3. **Rigorous Filtering**: Apply strict eligibility checking
      4. **Benefit Maximization**: Prioritize schemes with highest potential impact
      5. **Validation**: Ensure all suggested schemes have valid IDs and current status

      ## Success Criteria
      - Suggest minimum 3-5 relevant schemes for diverse options
      - Ensure 100% eligibility alignment for suggested schemes
      - Provide clear, farmer-friendly reasoning for each suggestion
      - Cover different ministry domains (agriculture, welfare, infrastructure, etc.)
      - Balance between immediate needs and long-term development schemes

      Remember**: Your suggestions could significantly impact this farmer's livelihood. Be thorough, accurate, and farmer-centric in your recommendations.
    `,
    tools: [
      searchSchemesHybrid,
      getSchemeByName,
      getSchemeByState,
      getSchemesByMinistry,
      getSchemeById,
      getFarmerProfile,
    ],
    responseFormat: detailedResponse,
  });

  const response = await schemeMatchingAgent.invoke({
    messages: [
      {
        role: "human",
        content: `Here are the complete details of a farmer:
          Farmer - ${JSON.stringify(farmer)}
          Contact - ${JSON.stringify(contact)}
          Plots - ${JSON.stringify(plots)}
          Crops - ${JSON.stringify(crops)}
          Logs - ${JSON.stringify(logs)}
          `,
      },
    ],
  });

  console.log("🔴🔴🔴 Response:", response);

  // const matchingSchemes = JSON.parse(
  //   response.messages[response.messages.length - 1].content as string
  // );

  return state;
};

const storageNode = async (state: StateType): Promise<Partial<StateType>> => {
  const { matchingSchemes, farmerId } = state;

  // if (!matchingSchemes || matchingSchemes.length <= 0) {
  //   throw new Error("No Matching Schemes found.");
  // }

  for (const sch of matchingSchemes) {
    await db.insert(farmerSchemeMatchingTable).values({
      schemeId: sch?.scheme_id!,
      reason: sch?.reason!,
      farmerId: farmerId,
      isEligible: true,
    });
  }

  return state;
};

const graph = new StateGraph(stateAnnotation)
  .addNode("farmerDataNode", farmerDataNode)
  .addNode("schemeMatchingNode", schemeMatchingNode)
  .addNode("storageNode", storageNode)
  .addEdge(START, "farmerDataNode")
  .addEdge("farmerDataNode", "schemeMatchingNode")
  .addEdge("schemeMatchingNode", "storageNode")
  .addEdge("storageNode", END);

const workflow = graph.compile();

(async () => {
  const response = await workflow.invoke({
    farmerId: "user_34c6elREuvpi47h78L7seEkBE9o",
  });

  // console.log("Response:", response);
})();
