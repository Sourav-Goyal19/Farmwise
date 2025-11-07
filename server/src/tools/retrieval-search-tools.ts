const agent = new Agent<StateType>({
  name: "scheme-suggestion-agent",
  instructions: `
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
    tool({
      name: "searchSchemesHybrid",
      description:
        "Performs a semantic search for government schemes using Qdrant and Google embeddings, with optional metadata filters.",
      parameters: z.object({
        query: z.string(),
        topK: z.number().default(10).nullish(),
        filters: z.record(z.any()).nullish(),
      }),
      execute: async ({ query, filters, topK }) => {
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
    }),
    tool({
      name: "getSchemeByName",
      description: "Find schemes by (partial) name match.",
      parameters: z.object({
        name: z
          .string()
          .min(1)
          .describe(
            "Full or partial name of the government scheme to search for. Example: 'PM Kisan' or 'Ujjwala'."
          ),
      }),
      execute: async ({ name }) => {
        const result = await db
          .select()
          .from(schemesTable)
          .where(
            sql`LOWER(${schemesTable.schemeName}) LIKE LOWER(${`%${name}%`})`
          );
        return JSON.stringify(result);
      },
    }),
    tool({
      name: "getSchemesByMinistry",
      description: "Get all schemes under a specific ministry.",
      parameters: z.object({
        ministry: z
          .string()
          .min(1)
          .describe(
            "Exact name of the ministry managing the schemes. Example: 'Ministry of Agriculture and Farmers Welfare'."
          ),
      }),
      execute: async ({ ministry }) => {
        const result = await db
          .select()
          .from(schemesTable)
          .where(
            sql`LOWER(${schemesTable.ministry}) LIKE LOWER(${`%${ministry}%`})`
          );
        return JSON.stringify(result);
      },
    }),
    tool({
      name: "getSchemeByState",
      description: "Get all the schemes according to the state of India.",
      parameters: z.object({
        state: z
          .string()
          .min(1)
          .describe(
            "Name of the Indian state or union territory for which you want to retrieve the available schemes. Example: 'Maharashtra' or 'Tamil Nadu'."
          ),
      }),
      execute: async ({ state }) => {
        const schemes = await db
          .select()
          .from(schemesTable)
          .where(sql`LOWER(${schemesTable.state}) LIKE LOWER(${`%${state}%`})`);
        return JSON.stringify(schemes);
      },
    }),
    tool({
      name: "getSchemeById",
      description: "Provide the complete scheme through its unique ID.",
      parameters: z.object({
        scheme_id: z
          .string()
          .uuid()
          .describe(
            "The unique identifier (UUID format) of the scheme. Example: 'a3c52f1a-bb24-4f0a-bbf0-08d9a88f765a'."
          ),
      }),
      execute: async ({ scheme_id }) => {
        const [scheme] = await db
          .select()
          .from(schemesTable)
          .where(eq(schemesTable.id, scheme_id));

        return JSON.stringify(scheme);
      },
    }),
    tool({
      name: "getFarmerProfile",
      description: "Provide the complete details of a farmer",
      parameters: z.object({
        farmerId: z
          .string()
          .min(1)
          .describe("The id(not name) of the farmer to get the details."),
      }),
      execute: async ({ farmerId }) => {
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
    }),
  ],
  modelSettings: {
    toolChoice: "auto",
  },
});
