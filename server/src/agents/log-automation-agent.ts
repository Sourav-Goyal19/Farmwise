import z from "zod";
import "dotenv/config";
import { db } from "../db/index.js";
import * as openai from "@livekit/agents-plugin-openai";
import * as google from "@livekit/agents-plugin-google";
import * as silero from "@livekit/agents-plugin-silero";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as neuphonic from "@livekit/agents-plugin-neuphonic";
import {
  cli,
  defineAgent,
  JobProcess,
  llm,
  metrics,
  voice,
  WorkerOptions,
} from "@livekit/agents";
import {
  activityLogsTable,
  activityTypeEnum,
  FarmerSelect,
  SelectActivityLogType,
} from "../db/schema.js";
import { voiceToLogAutomationAgentPrompt } from "../prompts/log-automation-agent-prompts.js";
import { and, desc, eq } from "drizzle-orm";
import { fileURLToPath } from "url";

type FarmerProfileData = Partial<FarmerSelect>;

type ActivityLogData = Partial<Omit<SelectActivityLogType, "id">>;

type RoomData = FarmerProfileData &
  ActivityLogData & {
    logId?: string;
    prevAgent?: voice.Agent<RoomData>;
    agents: Record<string, voice.Agent<RoomData>>;
  };

function summarizeFarmerDetails(farmer: RoomData) {
  return JSON.stringify({
    age: farmer.age || "unknown",
    name: farmer.name || "unknown",
    gender: farmer.gender || "unknown",
    primaryLanguage: farmer.primaryLanguage || "unknown",
    village: farmer.village || "unknown",
    district: farmer.district || "unknown (optional)",
    educationLevel: farmer.educationLevel || "unknown",
    totalLandArea: farmer.totalLandArea || "unknown",
    experience: farmer.experience || "unknown",
  });
}

function summarizeActivityLogs(data: RoomData) {
  return JSON.stringify({
    activityType: data.activityType || "unknown",
    summary: data.summary || "nothing",
    said: data.said || "unknown",
    photoUrl: data.photoUrl || "unknown (optional)",
    suggestions: data.suggestions || "nothing",
    notes: data.notes || "nothing (optional)",
    details: data.details || "unknown",
  });
}

function createRoomData(data: RoomData) {
  return data;
}

class BaseAgent extends voice.Agent<RoomData> {
  name: string;

  constructor(options: voice.AgentOptions<RoomData> & { name: string }) {
    const { name, ...opts } = options;
    super(opts);
    this.name = name;
  }

  async onEnter(): Promise<void> {
    const userData = this.session.userData;
    const chatCtx = this.session.chatCtx.copy();

    if (userData.prevAgent) {
      const truncatedChatCtx = userData.prevAgent.chatCtx.copy({
        excludeFunctionCall: true,
        excludeInstructions: true,
      });
      const existingIds = new Set(chatCtx.items.map((item) => item.id));
      const newItems = truncatedChatCtx.items.filter(
        (item) => !existingIds.has(item.id)
      );
      chatCtx.items.push(...newItems);
    }

    chatCtx.addMessage({
      role: "system",
      content: `Your name is ${
        this.name
      } agent. Here is the current user's data ${summarizeFarmerDetails(
        userData
      )}. Here the current log's data ${summarizeActivityLogs(userData)}`,
    });

    await this.updateChatCtx(chatCtx);
    this.session.generateReply({
      toolChoice: "none",
      instructions:
        "Greet the farmer warmly in their native/primary language. Introduce yourself and ask them about their farming activity today. Do NOT use any tools yet, just greet them.",
    });

    // this.session.say("नमस्ते! मैं आपका खेती सहायक हूं। आज आपने क्या काम किया?");
  }

  async transferToAgent(options: {
    name: string;
    ctx: voice.RunContext<RoomData>;
  }) {
    const { name, ctx } = options;
    const userData = ctx.userData;
    const currAgent = this.session.currentAgent;
    const nextAgent = userData.agents[name];
    if (!nextAgent) {
      throw new Error(`No ${name} agent found.`);
    }
    userData.prevAgent = currAgent;

    return llm.handoff({
      agent: nextAgent,
      returns: `Transferring to ${name} agent.`,
    });
  }
}

const createLogAgent = () => {
  const logAgent = new BaseAgent({
    name: "voice-to-log agent",
    instructions: voiceToLogAutomationAgentPrompt,
    tools: {
      updateActivityType: llm.tool({
        description: "Updates the type of activity the farmer performed.",
        parameters: z.object({
          activityType: z
            .enum(activityTypeEnum)
            .describe("The type of activity"),
          otherActivity: z
            .string()
            .optional()
            .describe("Name of the activity, if type is 'other'."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.activityType = input.activityType;
          if (input.otherActivity) {
            ctx.userData.notes = input.otherActivity;
          }
          return "Activity type updated successfully";
        },
      }),
      updateUserSaidLog: llm.tool({
        description: "Saves the exact log input provided by the farmer.",
        parameters: z.object({
          said: z.string().describe("What the farmer said for the log."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.said = input.said;
          return "User's exact log saved successfully.";
        },
      }),
      updatePhotoUrl: llm.tool({
        description: "Updates the URL of a photo related to the activity.",
        parameters: z.object({
          url: z.string().url().describe("The URL of a photo."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.photoUrl = input.url;
          return "Photo URL updated successfully.";
        },
      }),
      updateNotes: llm.tool({
        description: "Adds or updates extra notes about the log.",
        parameters: z.object({
          notes: z.string().describe("The notes to be added or updated."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.notes = input.notes;
          return "Notes added/updated successfully.";
        },
      }),
      updateLogSummary: llm.tool({
        description: "Adds or updates the summary of the log details.",
        parameters: z.object({
          summary: z.string().describe("A summary of the log."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.summary = input.summary;
          return "Log summary added/updated successfully.";
        },
      }),
      updateDetails: llm.tool({
        description: "Adds specific details about the log.",
        parameters: z.object({
          detail: z.string().describe("A specific detail about the log."),
        }),
        execute: async (input, { ctx }) => {
          if (!ctx.userData.details) ctx.userData.details = [];
          ctx.userData.details.push(input.detail);
          return "Detail added successfully.";
        },
      }),
      getLogDetails: llm.tool({
        description:
          "Retrieves the latest details of the farmer's activity log.",
        parameters: undefined,
        execute: async (input, { ctx }) => {
          return summarizeActivityLogs(ctx.userData);
        },
      }),
      getFarmerDetails: llm.tool({
        description:
          "Retrieve all the information collected about the farmer so far.",
        parameters: undefined,
        execute: async (input, { ctx }) => {
          return summarizeFarmerDetails(ctx.userData);
        },
      }),
      insertLogToDatabase: llm.tool({
        description:
          "Used to save the complete farmer's log in an online database.",
        parameters: z.object({
          activityType: z
            .enum(activityTypeEnum)
            .describe("The type of a activity"),
          details: z
            .array(z.string())
            .describe("All activites details that you have collected so far."),
          summary: z
            .string()
            .describe(
              "A summary of all the activity that the farmer performed."
            ),
          said: z
            .string()
            .describe("What the actually farmer said about his/her log."),
          notes: z.string().optional().describe("Extra notes about the log."),
          photoUrl: z
            .string()
            .optional()
            .describe("The url of an uploaded photograph."),
        }),
        execute: async (input, { ctx }) => {
          try {
            const [log] = await db
              .insert(activityLogsTable)
              .values({
                cropId: ctx.userData.cropId!,
                activityType: input.activityType,
                details: input.details,
                summary: input.summary,
                said: input.said,
                farmerId: ctx.userData.id!,
                notes: input.notes,
                photoUrl: input.photoUrl,
              })
              .returning();

            ctx.userData.logId = log.id;

            return `Log added to the database successfully. Log: ${JSON.stringify(
              log
            )}`;
          } catch (error) {
            console.error("INSERTLOG:", error);
            return "Something went wrong. Here is the error:" + error;
          }
        },
      }),
      getPreviousLogs: llm.tool({
        description: "Provides last 10 or less farmer's log.",
        parameters: z.object({
          farmerId: z.string().describe("Farmer's Id whose latest logs need."),
          cropId: z.string().describe("The id of a crop plant"),
        }),
        execute: async (input, { ctx }) => {
          try {
            const logs = await db
              .select({
                summary: activityLogsTable.summary,
              })
              .from(activityLogsTable)
              .where(
                and(
                  eq(activityLogsTable.farmerId, input.farmerId),
                  eq(activityLogsTable.cropId, input.cropId)
                )
              )
              .orderBy(desc(activityLogsTable.createdAt))
              .limit(10);

            return logs;
          } catch (error) {
            console.error("PREVIOUSLOGS[GET]:", error);
            return "Something went wrong. Hers is the error:" + error;
          }
        },
      }),
    },
  });
  return logAgent;
};

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx) => {
    const farmerData = ctx.job.metadata ? JSON.parse(ctx.job.metadata) : {};
    const farmerDetails = farmerData.farmer;

    const agents = {
      logAgent: createLogAgent(),
    };

    const userData = createRoomData({
      ...farmerDetails,
      agents,
      prevAgent: undefined,
    });

    const session = new voice.AgentSession<RoomData>({
      userData,
      stt: getSTT(farmerDetails.primaryLanguage!),
      llm: getLLM("moonshot"),
      tts: getTTS(farmerDetails.primaryLanguage!),
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
          topic: "log-automation-topic",
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
          topic: "log-automation-topic",
        });
      }
    });

    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      console.log("User speech committed:", ev.transcript);
    });

    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error("Agent session error:", ev.error);
    });

    await session.start({
      agent: agents.logAgent,
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
      return new deepgram.STT({
        model: "nova-2-general",
        language: "hi",
        apiKey: process.env.DEEPGRAM_API_KEY,
      });
    case "english":
      return new deepgram.STT({
        model: "nova-2-general",
        language: "en",
        apiKey: process.env.DEEPGRAM_API_KEY,
      });
    default:
      return new deepgram.STT({
        model: "nova-2-general",
        language: "en",
        apiKey: process.env.DEEPGRAM_API_KEY,
      });
  }
}

function getTTS(language: string) {
  language = language.toLowerCase();

  console.log(`Creating TTS for language: ${language}`);

  switch (language) {
    case "hindi":
      return new neuphonic.TTS({
        voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
        apiKey: process.env.NEUPHONIC_API_KEY!,
      });
    case "english":
      return new neuphonic.TTS({
        voiceId: "06fde793-8929-45f6-8a87-643196d376e4",
        apiKey: process.env.NEUPHONIC_API_KEY!,
      });
    default:
      return new neuphonic.TTS({
        voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
        apiKey: process.env.NEUPHONIC_API_KEY!,
      });
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

// function getTTS(language: string) {
//   language = language.toLowerCase();
//   switch (language) {
//     case "hindi":
//       return new neuphonic.TTS({
//         voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
//       });
//     case "english":
//       return new neuphonic.TTS({
//         voiceId: "06fde793-8929-45f6-8a87-643196d376e4",
//       });
//     default:
//       return new neuphonic.TTS({
//         voiceId: "a2103bbb-ab1f-4b1a-b4b7-f2466ce14f11",
//       });
//   }
// }

cli.runApp(
  new WorkerOptions({
    agentName: "log-automation-agent",
    agent: fileURLToPath(import.meta.url),
  })
);
