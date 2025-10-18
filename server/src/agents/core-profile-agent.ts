import z from "zod";
import "dotenv/config";
import { db } from "../db";
import { fileURLToPath } from "node:url";
import { farmersTable } from "../db/schema";
import * as silero from "@livekit/agents-plugin-silero";
import * as google from "@livekit/agents-plugin-google";
import * as livekit from "@livekit/agents-plugin-livekit";
// import * as resemble from "@livekit/agents-plugin-resemble";
// import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as neuphonic from "@livekit/agents-plugin-neuphonic";
// import * as cartesia from "@livekit/agents-plugin-cartesia";
import {
  voice,
  llm,
  defineAgent,
  JobProcess,
  JobContext,
  cli,
  WorkerOptions,
  metrics,
} from "@livekit/agents";

type FarmerData = Partial<{
  id: string;
  name: string;
  age: number;
  gender: string;
  primaryLanguage: string;
  village: string;
  district: string;
  educationLevel: string;
  totalLandArea: number;
  experience: number;
  prevAgent: voice.Agent<FarmerData>;
}> & { agents: Record<string, voice.Agent<FarmerData>> };

function createUserData(
  id: string,
  primaryLanguage: string,
  agents: Record<string, voice.Agent<FarmerData>>
) {
  return {
    id,
    name: "",
    gender: "",
    primaryLanguage,
    village: "",
    district: "",
    educationLevel: "",
    totalLandArea: 0,
    experience: 0,
    agents,
  };
}

function summarize({
  id,
  name,
  gender,
  primaryLanguage,
  village,
  district,
  educationLevel,
  totalLandArea,
  experience,
}: FarmerData) {
  return JSON.stringify({
    id: id || "unknown",
    name: name || "unknown",
    gender: gender || "unknown",
    primaryLanguage: primaryLanguage || "unknown",
    village: village || "unknown",
    district: district || "unknown (optional)",
    educationLevel: educationLevel || "unknown",
    totalLandArea: totalLandArea || "unknown",
    experience: experience || "unknown",
  });
}

class BaseAgent extends voice.Agent<FarmerData> {
  name: string;

  constructor(options: voice.AgentOptions<FarmerData> & { name: string }) {
    const { name, ...opts } = options;
    super(opts);
    this.name = name;
  }

  async onEnter(): Promise<void> {
    const farmersData = this.session.userData;
    const chatCtx = this.chatCtx.copy();

    if (farmersData.prevAgent) {
      const truncatedChatCtx = farmersData.prevAgent.chatCtx.copy({
        excludeFunctionCall: true,
        excludeInstructions: true,
      });
      const existingIds = new Set(chatCtx.items.map((it) => it.id));
      const newItems = truncatedChatCtx.items.filter(
        (item) => !existingIds.has(item.id)
      );
      chatCtx.items.push(...newItems);
    }

    chatCtx.addMessage({
      role: "system",
      content: `You are ${
        this.name
      } agent. Current Farmer's data is \n ${summarize(farmersData)}`,
    });

    await this.updateChatCtx(chatCtx);
    this.session.generateReply({
      toolChoice: "none",
      instructions:
        "Greet the farmer in their native/primary language and then start to talk.",
    });
  }

  async transferToAgent(options: {
    name: string;
    ctx: voice.RunContext<FarmerData>;
  }) {
    const { name, ctx } = options;
    const farmersData = ctx.userData;
    const currAgent = ctx.session.currentAgent;
    const nextAgent = farmersData.agents[name];
    if (!nextAgent) {
      throw new Error(`Agent ${name} not found.`);
    }
    farmersData.prevAgent = currAgent;

    return llm.handoff({
      agent: nextAgent,
      returns: `Transferring to ${name} agent.`,
    });
  }
}

function createCoreProfileAgent() {
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
        "Total land area owned or cultivated by the farmer, in acres or hectares (as string to preserve decimal precision)"
      ),
    experience: z
      .string()
      .describe(
        "Years of farming experience (as string to preserve decimal precision)"
      ),
  });

  const coreProfile = new BaseAgent({
    name: "core-profile",
    instructions: `
      # ROLE
      You are "Krishi Mitra"(female) (Farmer's Friend), a polite and empathetic AI voice assistant designed to interact with Indian farmers. Your primary goal is to help them by collecting information to complete their profile and store them in the database.

      # CONTEXT
      You will be provided with:
      1.  **Target Language:** The specific Indian language (e.g., Hindi, Marathi, Tamil) you MUST communicate in.
      2. **Information to Ask For:** A specific piece of information (e.g., 'name', 'gender', 'village', 'totalLandArea', 'experience') that you need to collect.

      # CORE INSTRUCTIONS
      - **Politeness is Paramount:** Always be respectful, patient, and use a friendly tone. Address them appropriately (e.g., use "Aap" in Hindi for formal "you").
      - **One Question at a Time:** Focus on a single piece of information per interaction. Do not ask compound questions.
      - **Simple & Clear Language:** Use everyday, colloquial words that are easy for any farmer to understand. Avoid technical jargon and heavy vocabulary.
      - **Be Context-Aware:** Avoid repeating questions and build a natural, flowing conversation.
      - **Objective:** Gently guide the farmer to provide the *required* information to finalize their profile. Make them feel helped, not interrogated.
      - Always check the current farmer data using the 'getFarmerSummary' tool.
      - Only ask for fields that are missing or empty (e.g., if 'name' is empty, ask for the name).
      - Do not ask for fields that already have values.

      # Rules
      - Use your tools to store the information provided by the farmers and retrieve all the information that has been provided so far.
      - Provide all the final details to the tool that can store profile in a database.
    `,
    tools: {
      updateName: llm.tool({
        description: "A tool to update the farmer's name and store that.",
        parameters: z.object({
          name: z.string().min(1),
        }),
        execute: async ({ name }, { ctx }) => {
          ctx.userData.name = name;
          return "Farmer's name saved successfully.";
        },
      }),

      updateGender: llm.tool({
        description:
          "A tool to update the farmer's gender (e.g., Male, Female, Other).",
        parameters: z.object({
          gender: z.enum(["M", "F", "O"]),
        }),
        execute: async ({ gender }, { ctx }) => {
          ctx.userData.gender = gender;
          return "Farmer's gender saved successfully.";
        },
      }),

      updatePrimaryLanguage: llm.tool({
        description:
          "A tool to update the farmer's primary language (e.g., Hindi, Tamil, Marathi).",
        parameters: z.object({
          primaryLanguage: z.string().min(1),
        }),
        execute: async ({ primaryLanguage }, { ctx }) => {
          ctx.userData.primaryLanguage = primaryLanguage;
          return "Farmer's primary language saved successfully.";
        },
      }),

      updateVillage: llm.tool({
        description: "A tool to update the farmer's village name.",
        parameters: z.object({
          village: z.string().min(1),
        }),
        execute: async ({ village }, { ctx }) => {
          ctx.userData.village = village;
          return "Farmer's village saved successfully.";
        },
      }),

      updateDistrict: llm.tool({
        description: "A tool to update the farmer's district name.",
        parameters: z.object({
          district: z.string().min(1),
        }),
        execute: async ({ district }, { ctx }) => {
          ctx.userData.district = district;
          return "Farmer's district saved successfully.";
        },
      }),

      updateEducationLevel: llm.tool({
        description:
          "A tool to update the farmer's education level (e.g., Primary, Secondary, Graduate).",
        parameters: z.object({
          educationLevel: z.string().min(1),
        }),
        execute: async ({ educationLevel }, { ctx }) => {
          ctx.userData.educationLevel = educationLevel;
          return "Farmer's education level saved successfully.";
        },
      }),

      updateAge: llm.tool({
        description: "A tool to update the age of a farmer.",
        parameters: z.object({
          age: z.number().min(0),
        }),
        execute: async ({ age }, { ctx }) => {
          ctx.userData.age = age;
          return "Farmer's total land area saved successfully.";
        },
      }),

      updateTotalLandArea: llm.tool({
        description:
          "A tool to update the total land area owned by the farmer (in acres or hectares).",
        parameters: z.object({
          totalLandArea: z.number().min(0),
        }),
        execute: async ({ totalLandArea }, { ctx }) => {
          ctx.userData.totalLandArea = totalLandArea;
          return "Farmer's total land area saved successfully.";
        },
      }),

      updateExperience: llm.tool({
        description:
          "A tool to update the farmer's years of experience in farming.",
        parameters: z.object({
          experience: z.number().min(0),
        }),
        execute: async ({ experience }, { ctx }) => {
          ctx.userData.experience = experience;
          return "Farmer's experience saved successfully.";
        },
      }),

      getFarmerSummary: llm.tool({
        description:
          "Retrieve all the information collected about the farmer so far.",
        execute: async (_, { ctx }) => {
          return summarize(ctx.userData);
        },
      }),

      insertDataToDB: llm.tool({
        parameters: insertFarmerSchema,
        description: "Tool to add farmers profile in an online database",
        execute: async (input, { ctx }) => {
          const [farmer] = await db
            .insert(farmersTable)
            .values({
              ...input,
            })
            .returning();
          return "A farmer profile has been inserted successfully";
        },
      }),
    },
  });

  return coreProfile;
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    let id = "39c58ce3-d3cb-49c6-a92e-7dd4ed4c1c75";
    let primaryLanguage = "Hindi";
    // const participant = await ctx.waitForParticipant();
    // console.log("participant joined: ", participant.identity);
    const userData = createUserData(id, primaryLanguage, {
      coreProfile: createCoreProfileAgent(),
    });

    const session = new voice.AgentSession({
      userData,
      stt: "deepgram/nova-2:hi",
      // llm: new openai.LLM({
      //   model: "gpt-4.1",
      //   apiKey: process.env.OPENROUTER_API_KEY,
      //   baseURL: process.env.OPENROUTER_API_KEY,
      // }),
      llm: new google.LLM({
        model: "gemini-2.0-flash",
        apiKey: process.env.GOOGLE_API_KEY!,
      }),
      // tts: new cartesia.TTS({
      //   model: "sonic-2",
      //   voice: "faf0731e-dfb9-4cfc-8119-259a79b27e12",
      // }),
      tts: new neuphonic.TTS({
        voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
        apiKey: process.env.NEUPHONIC_API_KEY,
      }),
      // tts: new elevenlabs.TTS({
      //   voice: {
      //     id: "Z3R5wn05IrDiVCyEkUrK",
      //     name: "arabella",
      //     category: "conversational",
      //   },
      //   modelID: "eleven_multilingual_v2",
      // }),

      vad: ctx.proc.userData.vad! as silero.VAD,
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    const usageCollector = new metrics.UsageCollector();
    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
      usageCollector.collect(ev.metrics);
    });

    const logUsage = async () => {
      const summary = usageCollector.getSummary();
      console.log(`Usage: ${JSON.stringify(summary)}`);
    };

    ctx.addShutdownCallback(logUsage);

    await session.start({
      agent: userData.agents.coreProfile!,
      room: ctx.room,
    });

    const participant = await ctx.waitForParticipant();
    const metadata = participant.metadata
      ? JSON.parse(participant.metadata)
      : {};
    id = metadata.userId;
    primaryLanguage = metadata.primaryLanguage;

    session.userData.id = id;
    session.userData.primaryLanguage = primaryLanguage;
  },
});

cli.runApp(
  new WorkerOptions({
    agentName: "core-profile-agent",
    agent: fileURLToPath(import.meta.url),
  })
);
