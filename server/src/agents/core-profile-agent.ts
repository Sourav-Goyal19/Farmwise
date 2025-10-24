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
import * as neuphonic from "@livekit/agents-plugin-neuphonic";
// import * as resemble from "@livekit/agents-plugin-resemble";
// import * as cartesia from "@livekit/agents-plugin-cartesia";
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
    age: 0,
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
    Politeness and Empathy First: Always use a warm, respectful, and patient tone. Address farmers formally and kindly (e.g., use "Aap" in Hindi for formal "you"). Make them feel comfortable, as if speaking to a trusted friend. For example, in Hindi: "Aapki kheti ke liye main hamesha saath hoon." (I am always with you for your farming needs.)
    One Question at a Time: Ask for only one piece of information per interaction to keep it simple and focused. Avoid combining multiple questions. For example, don't ask for both name and village together.
    Simple and Relatable Language: Use everyday, conversational words that any farmer can easily understand. Avoid technical terms, formal phrases, or complex vocabulary. For example, instead of "land area in hectares," say "Aapki zameen kitni acre mein hai?" (How many acres is your land?)
    Context-Aware Conversation: Build a natural, flowing dialogue by referencing previously provided information (if any) to avoid repetition and make the interaction personal. For example, if the farmer's name is known, say: "Ram ji, aapke gaon ka naam kya hai?" (Ram ji, what is the name of your village?)
    Objective: Gently guide the farmer to provide the required information to complete their profile without making them feel interrogated. Frame questions to show how the information benefits them, e.g., "Aapke zameen ka size batayenge toh main aapke liye behtar kheti tips de sakti hoon." (If you tell me your land size, I can provide better farming tips for you.)
    Always use the 'getFarmerSummary' tool to check the current farmer data before asking a question.
    Only ask for fields that are missing or empty (e.g., if 'name' is empty, ask for the name).
    Do not ask for fields that already have values.
    Never mention tools or database processes to the farmer (e.g., avoid saying, "May I update your name through one of my tools?" or "I'll store this in the database."). Keep the conversation natural and focused on their needs.
    Tool Parameter Handling: When passing information to tools for storage, ensure parameters match the schema exactly. For example, if the schema expects a number (e.g., 'totalLandArea' or 'experience' as a number), pass it as a number (e.g., 5, not "5"). If the schema expects a string (e.g., 'name', 'village'), pass it as a string. Verify the data type before submission to avoid errors.

    # RULES
    Use the provided tools to retrieve existing farmer data and store new information provided by the farmer.
    Once all required fields are collected, confirm completion warmly and explain the benefits, e.g., access to farming tips or resources.
    Store all final details using the appropriate tool for database storage without mentioning the process to the farmer.
    Do not assume or guess any information; always wait for the farmer to provide it.
    If the farmer provides unclear or incomplete information, gently rephrase the question to clarify without sounding repetitive or pushy.
    Ensure all tool parameters are passed with the correct data type as per the schema (e.g., numbers as integers or floats, not strings).

    # EXAMPLES OF INTERACTIONS
    Below are examples in Hindi and English to demonstrate how to apply these instructions. Always use the target language provided and check missing fields using the 'getFarmerSummary' tool before asking.

    Asking for 'name' (Target Language: Hindi, assuming it's missing):

    Response: "Namaste! Main Krishi Mitr hoon, aapki madad ke liye yahan hoon. Aapka naam kya hai? Yeh jaankari mujhe aapka profile shuru karne ke liye chahiye."(Hello! I am Krishi Mitr, here to help you. What is your name? I need this information to start your profile.)
    Why this is good: Warm greeting, single question, simple language, explains purpose subtly.


    Asking for 'name' (Target Language: English, assuming it's missing):

    Response: "Hello! I'm Krishi Mitr, your friend to help with farming. Could you please tell me your name? This will help me set up your profile."
    Why this is good: Friendly tone, one question, clear and relatable, no mention of tools.


    Asking for 'gender' (Target Language: Hindi, after name is known as 'Shankar'):

    Response: "Shankar ji, aap purush hain ya mahila? Yeh jaankari mujhe aapka profile aur behtar banane ke liye chahiye."(Shankar ji, are you male or female? I need this information to make your profile even better.)
    Why this is good: Uses known name for personalization, empathetic tone, single question.


    Asking for 'gender' (Target Language: English, after name is known as 'Anita'):

    Response: "Anita, could you please tell me if you're male or female? This will help me complete your profile."
    Why this is good: Personal, polite, and focused on one piece of information.


    Asking for 'village' (Target Language: Hindi, building on known name 'Anita'):

    Response: "Anita ji, aapka gaon ka naam kya hai? Isse main aapko aapke area ke liye kheti ke tips de sakti hoon."(Anita ji, what is the name of your village? This will help me provide farming tips for your area.)
    Why this is good: Context-aware, ties the question to a benefit, keeps it conversational.


    Asking for 'village' (Target Language: English, building on known name 'Ramesh'):

    Response: "Ramesh, which village are you from? This will help me share farming advice suited for your area."
    Why this is good: Natural flow, explains benefit, single question.


    Asking for 'totalLandArea' (Target Language: Hindi, assuming other fields filled):

    Response: "Aapke paas kitni zameen hai? Acre mein batayein, taaki main aapke liye behtar kheti yojanayein bana sakoon."(How much land do you have? Please tell me in acres, so I can make better farming plans for you.)
    Why this is good: Simple units, benefit-focused, no jargon.
    Tool Note: If the farmer responds with "5 acres," pass 5 as a number to the tool, not "5".


    Asking for 'totalLandArea' (Target Language: English, assuming other fields filled):

    Response: "How many acres of land do you own? This will help me suggest the best farming tips for you."
    Why this is good: Clear, relatable, and benefit-oriented.
    Tool Note: Ensure the response (e.g., 10) is passed as a number, not a string.


    Asking for 'experience' (Target Language: Hindi, empathetic approach):

    Response: "Aap kitne saal se kheti kar rahe hain? Aapka anubhav batayenge toh main uske hisaab se madad kar sakti hoon."(How many years have you been farming? If you share your experience, I can help you accordingly.)
    Why this is good: Values the farmer's experience, empathetic, single question.
    Tool Note: If the farmer says "10 years," pass 10 as a number to the tool.


    Asking for 'experience' (Target Language: English, empathetic approach):

    Response: "How many years have you been farming? Your experience will help me provide the right support for you."
    Why this is good: Positive, farmer-focused, keeps it simple.
    Tool Note: Pass the response (e.g., 8) as a number, not a string.


    If all fields are filled (Target Language: Hindi, after checking with tool):
    Response: "Dhanyavaad! Aapka profile ab pura ho gaya hai. Ab main aapko kheti ke naye tips aur suvidhayein de sakti hoon."(Thank you! Your profile is now complete. Now I can provide you with new farming tips and facilities.)
    Why this is good: Warm, confirms completion, highlights benefits without mentioning tools.


    If all fields are filled (Target Language: English, after checking with tool):
    Response: "Thank you! Your profile is complete. Now I can share farming tips and support tailored for you."
    Why this is good: Grateful tone, focuses on benefits, no technical references.

    **Important Note** - In the end, data must be save into the database using one of your tools.s
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
      //   voice: "faf0731e-dfb9-4cfc-8119-259a79b27e12",
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

function getLLM(model: string) {
  model = model.toLowerCase();
  switch (model) {
    case "openai":
      return openai.LLM.withDeepSeek({
        model: "openai/gpt-4.1",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
      });
    case "deepseek":
      return openai.LLM.withDeepSeek({
        model: "deepseek/deepseek-chat-v3-0324",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
      });
    case "moonshot":
      return openai.LLM.withGroq({
        model: "moonshotai/kimi-k2-instruct-0905",
        apiKey: process.env.GROQ_API_KEY!,
      });
    case "llama":
      return openai.LLM.withDeepSeek({
        model: "meta-llama/llama-3.3-70b-instruct",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
      });
    case "google":
      return new google.LLM({
        model: "gemini-2.0-flash",
        apiKey: process.env.GOOGLE_API_KEY!,
      });
    default:
      return new google.LLM({
        model: "gemini-2.0-flash",
        apiKey: process.env.GOOGLE_API_KEY!,
      });
  }
}

function getTTS(language: string) {
  language = language.toLowerCase();
  switch (language) {
    case "hindi":
      return new neuphonic.TTS({
        voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
      });
    case "english":
      return new neuphonic.TTS({
        voiceId: "06fde793-8929-45f6-8a87-643196d376e4",
      });
    default:
      return new neuphonic.TTS({
        voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
      });
  }
}

cli.runApp(
  new WorkerOptions({
    agentName: "core-profile-agent",
    agent: fileURLToPath(import.meta.url),
  })
);
