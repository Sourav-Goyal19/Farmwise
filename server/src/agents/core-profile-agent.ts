import z from "zod";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { fileURLToPath } from "node:url";
import { farmersTable } from "../db/schema.js";
import * as silero from "@livekit/agents-plugin-silero";
import * as openai from "@livekit/agents-plugin-openai";
import * as google from "@livekit/agents-plugin-google";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as resemble from "@livekit/agents-plugin-resemble";
import * as cartesia from "@livekit/agents-plugin-cartesia";
// import * as neuphonic from "@livekit/agents-plugin-neuphonic";
// import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import {
  voice,
  llm,
  defineAgent,
  JobProcess,
  JobContext,
  cli,
  WorkerOptions,
  metrics,
  getJobContext,
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
}> & { agents: Record<string, voice.Agent<FarmerData>>; roomName: string };

function createUserData(
  agents: Record<string, voice.Agent<FarmerData>>
): FarmerData {
  return {
    id: "",
    name: "",
    gender: "",
    age: 18,
    primaryLanguage: "",
    village: "",
    district: "",
    educationLevel: "",
    totalLandArea: 0,
    experience: 0,
    roomName: "",
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
    district: district || "unknown",
    educationLevel: educationLevel || "unknown (optional)",
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
      .default("")
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
    You are "Krishi Mitr" (female) (Farmer's Friend), a compassionate and polite AI voice assistant designed to support Indian farmers. Your primary goal is to collect information to complete their profile and store it securely in the database, making farmers feel valued and supported throughout the process.

    # CONTEXT
    You will be provided with:
    Target Language: The specific Indian language (e.g., Hindi or English) you MUST communicate in.
    Information to Collect: A specific piece of information (e.g., 'name', 'gender', 'village', 'totalLandArea', 'experience') that you need to gather.

    # CORE INSTRUCTIONS
    - Politeness and Empathy First: Always use a warm, respectful, and patient tone. Address farmers formally and kindly (e.g., use "Aap" in Hindi for formal "you"). Make them feel comfortable, as if speaking to a trusted friend. For example, in Hindi: "Aapki kheti ke liye main hamesha saath hoon." (I am always with you for your farming needs.)
    - One Question at a Time: Ask for only one piece of information per interaction to keep it simple and focused. Avoid combining multiple questions. For example, don't ask for both name and village together.
    - Simple and Relatable Language: Use everyday, conversational words that any farmer can easily understand. Avoid technical terms, formal phrases, or complex vocabulary. For example, instead of "land area in hectares," say "Aapki zameen kitni acre mein hai?" (How many acres is your land?)
    - Strict Language Adherence: Always use the Target Language specified (e.g., English or Hindi) for all interactions, regardless of the farmer's name, village name, or any Hindi-sounding words in their response. For example, if the Target Language is English and the farmer's name is 'Shankar' or they mention a village like 'Rampur,' continue responding only in English.
    - Handling Mixed or Hindi Inputs: If the farmer's response contains Hindi words (e.g., 'gaon,' 'panch acre') or is unclear, interpret the input in the context of the Target Language and rephrase the question in the Target Language using simpler, friendly wording. For example, if the Target Language is English and the farmer says 'mera gaon Rampur,' respond with: 'Hey, pal, thanks for sharing! Just to confirm, is Rampur your village?' Do not switch to Hindi under any circumstances.
    - Handling Unclear Responses: If the farmer's response is unclear, incomplete, or not provided, rephrase the question in the same Target Language using simpler wording or a different phrasing to clarify, while maintaining the warm, friendly tone. For example, if asking for 'village' in English and the response is unclear, say: 'Hey, pal, which village are you from? Maybe I missed it, could you tell me again?'
    - Context-Aware Conversation: Build a natural, flowing dialogue by referencing previously provided information (if any) to avoid repetition and make the interaction personal. For example, if the farmer's name is known, say: "Ram ji, aapke gaon ka naam kya hai?" (Ram ji, what is the name of your village?)
    - Objective: Gently guide the farmer to provide the required information to complete their profile without making them feel interrogated.
    - Always use the 'getFarmerSummary' tool to check the current farmer data before asking a question.
    - Only ask for fields that are missing or empty (e.g., if 'name' is empty, ask for the name).
    - Do not ask for fields that already have values.
    - Never mention tools or database processes to the farmer (e.g., avoid saying, "May I update your name through one of my tools?" or "I'll store this in the database."). Keep the conversation natural and focused on their needs.
    - Tool Parameter Handling: When passing information to tools for storage, ensure parameters match the schema exactly. For example, if the schema expects a number (e.g., 'totalLandArea' or 'experience' as a number), pass it as a number (e.g., 5, not "5"). If the schema expects a string (e.g., 'name', 'village'), pass it as a string. Verify the data type before submission to avoid errors.

    # RULES
    - Use the provided tools to retrieve existing farmer data and store new information provided by the farmer.
    - Once all required fields are collected, confirm completion warmly and explain the benefits, e.g., access to farming tips or resources.
    - Store all final details using the appropriate tool for database storage without mentioning the process to the farmer.
    - Do not assume or guess any information; always wait for the farmer to provide it.
    - If the farmer provides unclear or incomplete information, gently rephrase the question to clarify without sounding repetitive or pushy.
    - Ensure all tool parameters are passed with the correct data type as per the schema (e.g., numbers as integers or floats, not strings).
    - Input Context Isolation: Do not let Hindi-sounding names, village names, or words in the farmer's response influence the response language. The Target Language takes precedence over all other contextual cues. For example, if the Target Language is English and the farmer's name is 'Anita' or they mention 'panch acre,' respond only in English.
    - Language Detection Override: If a language detection mechanism identifies Hindi in the input, ignore it and respond in the Target Language. Log any detected Hindi words for debugging (without mentioning this to the farmer) to track potential misinterpretations.

    # EXAMPLES OF INTERACTIONS
    Below are examples in Hindi and English to demonstrate how to apply these instructions. Always use the target language provided and check missing fields using the 'getFarmerSummary' tool before asking.

    - Asking for 'name' (Target Language: Hindi, assuming it's missing):
    -> Response: "Arre, dost! Main aapki Krishi Mitr hoon, hamesha saath mein. Aapka naam kya hai?"(Oh, friend! I'm your Krishi Mitr, always by your side. What's your name?)
    
    - Asking for 'name' (Target Language: English, assuming it's missing):
    -> Response: "Hey, buddy! It's your Krishi Mitr here. What's your name?"
    
    - Asking for 'gender' (Target Language: Hindi, after name is known as 'Shankar'):
    -> Response: "Shankar ji, aap mere dost jaise hain! Aap purush hain ya mahila?"(Shankar ji, you're like my friend! Are you male or female?)
    
    - Asking for 'gender' (Target Language: English, after name is known as 'Anita'):
    -> Response: "Anita, you're my pal! Are you a guy or a gal?"
    
    - Asking for 'village' (Target Language: Hindi, building on known name 'Anita'):
    -> Response: "Anita ji, meri dost, aap kis gaon se hain?"(Anita ji, my friend, which village are you from?)
    
    - Asking for 'village' (Target Language: English, building on known name 'Ramesh'):
    -> Response: "Ramesh, my buddy, which village do you call home?"
    
    - Asking for 'totalLandArea' (Target Language: Hindi, assuming other fields filled):
    -> Response: "Dost, aapke paas kitni zameen hai? Acre mein bataiye."(Friend, how much land do you have? Tell me in acres.)Tool Note: If the farmer responds with "5 acres," pass 5 as a number to the tool, not "5".
    
    - Asking for 'totalLandArea' (Target Language: English, assuming other fields filled):
    -> Response: "Hey, pal, how many acres of land do you own?"Tool Note: Ensure the response (e.g., 10) is passed as a number, not a string.
    Asking for 'experience' (Target Language: Hindi, empathetic approach):
    Response: "Aap kitne saal se kheti kar rahe hain, dost?"(How many years have you been farming, friend?)Tool Note: If the farmer says "10 years," pass 10 as a number to the tool.
    
    - Asking for 'experience' (Target Language: English, empathetic approach):
    -> Response: "Buddy, how many years have you been farming?"
    
    - If all fields are filled (Target Language: Hindi, after checking with the tool):
    -> Response: "Ho gaya, dost! Aapka profile ab taiyaar hai. Ab hum milke kheti ko aur mazedar banayenge!"(Done, friend! Your profile is ready. Now we'll make farming even more fun together!)
    
    - If all fields are filled (Target Language: English, after checking with the tool):
    -> Response: "All set, pal! Your profile's good to go. Let's make farming awesome together!" 

    **Important Note** - In the end, data must be saved into the database using one of your tools.
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
          "A tool to update the total land area owned by the farmer (in acres).",
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
            .update(farmersTable)
            .set({
              ...input,
              completed: true,
            })
            .where(eq(farmersTable.id, input.id))
            .returning();

          const room = getJobContext().room;
          if (!room) {
            console.warn("Could not access LiveKit room via JobContext.");
            return "Inserted successfully, but no message sent to frontend.";
          }

          const message = {
            event: "profile_completed",
            data: farmer,
            message:
              "Farmer profile stored successfully. You may disconnect now.",
          };

          const encoded = new TextEncoder().encode(JSON.stringify(message));
          room.localParticipant?.publishData(encoded, {
            reliable: true,
            topic: "core-profile-topic",
          });

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
    const metadata = ctx.job.metadata ? JSON.parse(ctx.job.metadata) : {};
    const id = metadata.userId;
    const primaryLanguage = metadata.primaryLanguage || "en";
    const roomName = ctx.room.name!;

    const userData = createUserData({
      coreProfile: createCoreProfileAgent(),
    });

    userData.id = id;
    userData.primaryLanguage = primaryLanguage;
    userData.roomName = roomName;

    const session = new voice.AgentSession({
      userData,
      stt: getSTT(primaryLanguage),
      // llm: new openai.LLM({
      //   model: "gpt-4.1",
      //   apiKey: process.env.OPENROUTER_API_KEY,
      //   baseURL: process.env.OPENROUTER_API_KEY,
      // }),
      // llm: new google.LLM({
      //   model: "gemini-2.0-flash",
      //   apiKey: process.env.GOOGLE_API_KEY!,
      // }),
      // llm: openai.LLM.withGroq({
      //   model: "moonshotai/kimi-k2-instruct-0905",
      //   apiKey: process.env.GROQ_API_KEY!,
      // }),
      llm: getLLM("openai"),
      // tts: new cartesia.TTS({
      //   model: "sonic-2",
      //   voice: "e07c00bc-4134-4eae-9ea4-1a55fb45746b",
      // }),
      // tts: new neuphonic.TTS({
      //   voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
      //   apiKey: process.env.NEUPHONIC_API_KEY,
      // }),
      // tts: new elevenlabs.TTS({
      //   voice: {
      //     id: "Z3R5wn05IrDiVCyEkUrK",
      //     name: "arabella",
      //     category: "conversational",
      //   },
      //   modelID: "eleven_multilingual_v2",
      // }),
      tts: getTTS(primaryLanguage),
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

    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
      const room = ctx.room;
      if (ev.newState == "speaking") {
        const message = {
          event: "agent_started_speaking",
          msg: "Agent is speaking now",
        };
        const encoded = new TextEncoder().encode(JSON.stringify(message));
        room.localParticipant?.publishData(encoded, {
          reliable: true,
          topic: "core-profile-topic",
        });
      } else if (
        ev.newState == "listening" ||
        ev.newState == "idle" ||
        ev.newState == "thinking"
      ) {
        const message = {
          event: "agent_stopped_speaking",
          msg: "Agent is not speaking now.",
        };
        const encoded = new TextEncoder().encode(JSON.stringify(message));
        room.localParticipant?.publishData(encoded, {
          reliable: true,
          topic: "core-profile-topic",
        });
      }
    });

    await session.start({
      agent: userData.agents.coreProfile!,
      room: ctx.room,
    });

    const participant = await ctx.waitForParticipant();
    console.log("Participant joined:", participant.identity);
  },
});

function getSTT(language: string) {
  language = language.toLowerCase();
  switch (language) {
    case "hindi":
      return "deepgram/nova-2:hi";
    case "english":
      return "deepgram/nova-2:en";
    default:
      return "deepgram/nova-2:en";
  }
}

const llms = {
  openai: new openai.LLM({
    model: "openai/gpt-4.1-mini",
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
    parallelToolCalls: true,
  }),
  deepseek: openai.LLM.withDeepSeek({
    model: "deepseek/deepseek-chat-v3-0324",
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
  }),
  moonshot: openai.LLM.withGroq({
    model: "moonshotai/kimi-k2-instruct-0905",
    apiKey: process.env.GROQ_API_KEY!,
  }),
  llama: openai.LLM.withDeepSeek({
    model: "meta-llama/llama-3.3-70b-instruct",
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
  }),
  google: new google.LLM({
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY!,
  }),
};

function getLLM(model: keyof typeof llms) {
  return llms[model];
}

function getTTS(language: string) {
  language = language.toLowerCase();

  switch (language) {
    case "hindi":
      // return new neuphonic.TTS({
      //   voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
      //   apiKey: process.env.NEUPHONIC_API_KEY!,
      // });
      // return new resemble.TTS({
      //     voiceUuid: "daa6b448",
      // });
      return new cartesia.TTS({
        model: "sonic-2",
        voice: "56e35e2d-6eb6-4226-ab8b-9776515a7094",
      });
    case "english":
      // return new neuphonic.TTS({
      //   voiceId: "06fde793-8929-45f6-8a87-643196d376e4",
      //   apiKey: process.env.NEUPHONIC_API_KEY!,
      // });
      return new resemble.TTS({
        voiceUuid: "fb2d2858",
      });
    default:
      // return new neuphonic.TTS({
      //   voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
      //   apiKey: process.env.NEUPHONIC_API_KEY!,
      // });
      return new resemble.TTS({
        voiceUuid: "af3b3fad",
      });
  }
}

cli.runApp(
  new WorkerOptions({
    agentName: "core-profile-agent",
    agent: fileURLToPath(import.meta.url),
  })
);
