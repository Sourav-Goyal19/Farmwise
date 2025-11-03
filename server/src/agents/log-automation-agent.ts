import z from "zod";
import "dotenv/config";
import { db } from "../db/index.js";
import { fileURLToPath } from "url";
import { and, desc, eq } from "drizzle-orm";
import { fetchWeatherApi } from "openmeteo";
import { notificationQueue } from "../bullmq/queues.js";
import * as openai from "@livekit/agents-plugin-openai";
import * as google from "@livekit/agents-plugin-google";
import * as silero from "@livekit/agents-plugin-silero";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as resemble from "@livekit/agents-plugin-resemble";
import {
  suggestionAgentPompt,
  voiceToLogAutomationAgentPrompt,
} from "../prompts/log-automation-agent-prompts.js";
// import * as cartesia from "@livekit/agents-plugin-cartesia";
// import * as neuphonic from "@livekit/agents-plugin-neuphonic";
// import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import {
  cli,
  llm,
  voice,
  metrics,
  JobProcess,
  defineAgent,
  WorkerOptions,
} from "@livekit/agents";
import {
  FarmerSelectType,
  activityTypeEnum,
  activityLogsTable,
  PlotCropSelectType,
  ActivityLogSelectType,
  notificationsTable,
} from "../db/schema.js";

type RoomData = {
  farmer: Partial<FarmerSelectType>;
  crop: Partial<PlotCropSelectType>;
  activityLog: Partial<Omit<ActivityLogSelectType, "id">>;
  logId?: string;
  prevAgent?: voice.Agent<RoomData>;
  agents: Record<string, voice.Agent<RoomData>>;
  latitude?: number;
  longitude?: number;
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d(\.\d+)?)?$/;

function summarizeFarmerProfileDetails(roomData: RoomData) {
  return JSON.stringify({
    age: roomData.farmer.age || "unknown",
    name: roomData.farmer.name || "unknown",
    gender: roomData.farmer.gender || "unknown",
    primaryLanguage: roomData.farmer.primaryLanguage || "unknown",
    village: roomData.farmer.village || "unknown",
    district: roomData.farmer.district || "unknown (optional)",
    educationLevel: roomData.farmer.educationLevel || "unknown",
    totalLandArea: roomData.farmer.totalLandArea || "unknown",
    experience: roomData.farmer.experience || "unknown",
  });
}

function summarizeCropDetails(roomData: RoomData) {
  const crop = roomData.crop;

  return JSON.stringify({
    cropName: crop.cropName || "unknown",
    variety: crop.variety || "unknown",
    season: crop.season || "unknown",
    sowingDate: crop.sowingDate || "unknown",
    expectedHarvestDate: crop.expectedHarvestDate || "unknown",
    currentStage: crop.currentStage || "unknown",
    estimatedYieldKg: crop.estimatedYieldKg || "unknown",
  });
}

function summarizeActivityLogs(data: RoomData) {
  return JSON.stringify({
    activityType: data.activityLog.activityType || "unknown",
    summary: data.activityLog.summary || "nothing",
    said: data.activityLog.said || "unknown",
    photoUrl: data.activityLog.photoUrl || "unknown (optional)",
    suggestions: data.activityLog.suggestions || "nothing",
    notes: data.activityLog.notes || "nothing (optional)",
    details: data.activityLog.details || "unknown",
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
      } agent. Here is the current farmer's data: ${summarizeFarmerProfileDetails(
        userData
      )}. Here are the current crop details: ${summarizeCropDetails(
        userData
      )}. Here is the current log's data: ${summarizeActivityLogs(userData)}`,
    });

    await this.updateChatCtx(chatCtx);
    this.session.generateReply({
      toolChoice: "none",
      instructions:
        "Greet the farmer warmly in their native/primary language. Ask them about their farming activity today. Do NOT use any tools yet, just greet and ask them.",
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
          ctx.userData.activityLog.activityType = input.activityType;
          if (input.otherActivity) {
            ctx.userData.activityLog.notes = input.otherActivity;
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
          ctx.userData.activityLog.said = input.said;
          return "User's exact log saved successfully.";
        },
      }),
      updatePhotoUrl: llm.tool({
        description: "Updates the URL of a photo related to the activity.",
        parameters: z.object({
          url: z.string().url().describe("The URL of a photo."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.activityLog.photoUrl = input.url;
          return "Photo URL updated successfully.";
        },
      }),
      updateNotes: llm.tool({
        description: "Adds or updates extra notes about the log.",
        parameters: z.object({
          notes: z.string().describe("The notes to be added or updated."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.activityLog.notes = input.notes;
          return "Notes added/updated successfully.";
        },
      }),
      updateLogSummary: llm.tool({
        description: "Adds or updates the summary of the log details.",
        parameters: z.object({
          summary: z.string().describe("A summary of the log."),
        }),
        execute: async (input, { ctx }) => {
          ctx.userData.activityLog.summary = input.summary;
          return "Log summary added/updated successfully.";
        },
      }),
      updateDetails: llm.tool({
        description: "Adds specific details about the log.",
        parameters: z.object({
          detail: z.string().describe("A specific detail about the log."),
        }),
        execute: async (input, { ctx }) => {
          if (!ctx.userData.activityLog.details)
            ctx.userData.activityLog.details = [];
          ctx.userData.activityLog.details.push(input.detail);
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
          return summarizeFarmerProfileDetails(ctx.userData);
        },
      }),
      getCropDetails: llm.tool({
        description: "Retrieves detailed information about the current crop.",
        execute: async (_, { ctx }) => {
          return summarizeCropDetails(ctx.userData);
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
                cropId: ctx.userData.crop.id!,
                activityType: input.activityType,
                details: input.details,
                summary: input.summary,
                said: input.said,
                farmerId: ctx.userData.farmer.id!,
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
        description:
          "Retrieves up to the 10 most recent activity logs for the current farmer and selected crop. Returns concise summaries of recent farming activities, ordered from newest to oldest.",
        execute: async (_, { ctx }) => {
          const farmerId = ctx.userData.farmer.id!;
          const cropId = ctx.userData.crop.id!;

          try {
            const logs = await db
              .select({
                summary: activityLogsTable.summary,
              })
              .from(activityLogsTable)
              .where(
                and(
                  eq(activityLogsTable.farmerId, farmerId),
                  eq(activityLogsTable.cropId, cropId)
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
      toSuggestionAgent: llm.tool({
        description: "Call when the farmer should get the suggestions.",
        execute: async (_, { ctx }): Promise<llm.AgentHandoff | string> => {
          return await logAgent.transferToAgent({
            name: "suggestionAgent",
            ctx,
          });
        },
      }),
    },
  });
  return logAgent;
};

const createSuggestionAgent = () => {
  const suggestionAgent = new BaseAgent({
    name: "suggestion-agent",
    instructions: suggestionAgentPompt,
    tools: {
      getWeatherTool: llm.tool({
        description:
          "Provides current temperature and daily temperature forecast for a few days.",
        parameters: z.object({
          days: z
            .number()
            .min(0)
            .max(7)
            .optional()
            .describe("Number of days for weather forecast"),
        }),
        execute: async ({ days }, { ctx }) => {
          const latitude = ctx.userData.latitude || 28.6214;
          const longitude = ctx.userData.longitude || 77.2148;

          const params = {
            latitude,
            longitude,
            daily: ["temperature_2m_max", "temperature_2m_min", "weather_code"],
            current: ["temperature_2m", "weather_code"],
            timezone: "GMT",
          };

          const url = "https://api.open-meteo.com/v1/forecast";

          try {
            const responses = await fetchWeatherApi(url, params);
            const response = responses[0];
            const utcOffsetSeconds = response.utcOffsetSeconds();

            const current = response.current()!;
            const daily = response.daily()!;

            const currentTemp = current.variables(0)!.value();
            const currentWeatherCode = current.variables(1)!.value();

            const daysCount =
              days && days > 0 ? Math.min(days, daily.time.length) : 0;

            const dailyTimes = Array.from(
              { length: daysCount },
              (_, i) =>
                new Date(
                  (Number(daily.time()) +
                    i * daily.interval() +
                    utcOffsetSeconds) *
                    1000
                )
            );

            const maxTemps = daily
              .variables(0)!
              .valuesArray()!
              .slice(0, daysCount);
            const minTemps = daily
              .variables(1)!
              .valuesArray()!
              .slice(0, daysCount);
            const weatherCodes = daily
              .variables(2)!
              .valuesArray()!
              .slice(0, daysCount);

            let output = `Current temperature: ${currentTemp} C, Weather code: ${currentWeatherCode}.\n`;

            if (daysCount > 0) {
              output += "Daily forecast:\n";
              for (let i = 0; i < daysCount; i++) {
                output += `Date: ${dailyTimes[i].toDateString()}, Max: ${
                  maxTemps[i]
                } C, Min: ${minTemps[i]} C, Weather code: ${weatherCodes[i]}\n`;
              }
            }

            return output;
          } catch (error) {
            console.error("Weather API error:", error);
            return "Unable to fetch weather data at the moment.";
          }
        },
      }),
      getPreviousLogs: llm.tool({
        description:
          "Retrieves up to the 10 most recent activity logs for the current farmer and selected crop. Returns concise summaries of recent farming activities, ordered from newest to oldest.",
        execute: async (_, { ctx }) => {
          const farmerId = ctx.userData.farmer.id!;
          const cropId = ctx.userData.crop.id!;

          try {
            const logs = await db
              .select({
                summary: activityLogsTable.summary,
              })
              .from(activityLogsTable)
              .where(
                and(
                  eq(activityLogsTable.farmerId, farmerId),
                  eq(activityLogsTable.cropId, cropId)
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
      getLogDetails: llm.tool({
        description:
          "Retrieves the latest details of the farmer's activity log.",
        execute: async (input, { ctx }) => {
          return summarizeActivityLogs(ctx.userData);
        },
      }),
      getCropDetails: llm.tool({
        description: "Retrieves detailed information about the current crop.",
        execute: async (_, { ctx }) => {
          return summarizeCropDetails(ctx.userData);
        },
      }),
      getFarmerProfileDetails: llm.tool({
        description:
          "Retrieve all the information collected about the farmer so far.",
        execute: async (input, { ctx }) => {
          return summarizeFarmerProfileDetails(ctx.userData);
        },
      }),
      getCurrentDateAndTime: llm.tool({
        description: "Provides current date and time.",
        execute: async (_, { ctx }) => {
          return new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          });
        },
      }),
      setReminder: llm.tool({
        description: "Used to set the reminder for the future.",
        parameters: z.object({
          date: z
            .number()
            .min(1)
            .max(31)
            .describe("The day of the month (1-31)."),
          month: z.number().min(1).max(12).describe("The month (1-12)."),
          year: z.number().min(2023).describe("The year for the reminder."),
          time: z
            .string()
            .regex(timeRegex, {
              message: "Invalid time format. Expected HH:MM:SS or HH:MM.",
            })
            .describe("The time in 24-hour format (e.g., 14:30 or 14:30:00)."),
          message: z.string().min(1).max(500).describe("The reminder message."),
        }),
        execute: async (input, { ctx }) => {
          const { date, month, year, time, message } = input;
          const farmerId = ctx.userData.farmer.id!;

          const jsMonth = month - 1;

          const [hours, minutes, seconds = "00"] = time.split(":");

          const reminderDate = new Date(
            year,
            jsMonth,
            date,
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
          );

          if (isNaN(reminderDate.getTime())) {
            return "Invalid date or time. Please check your input.";
          }

          const now = new Date();
          if (reminderDate.getTime() <= now.getTime()) {
            return "The reminder time must be in the future.";
          }

          const existingReminder = await db
            .select()
            .from(notificationsTable)
            .where(
              and(
                eq(notificationsTable.farmerId, farmerId),
                eq(notificationsTable.message, message),
                eq(notificationsTable.type, "reminder"),
                eq(notificationsTable.scheduledFor, reminderDate)
              )
            )
            .limit(1);

          if (existingReminder.length > 0) {
            return "A similar reminder already exists.";
          }

          const diffMs = reminderDate.getTime() - now.getTime();
          const job = await notificationQueue.add(
            "notification-job",
            { type: "reminder", message, farmerId },
            { delay: diffMs }
          );

          await db.insert(notificationsTable).values({
            farmerId,
            message,
            jobId: job.id!,
            type: "reminder",
            scheduledFor: reminderDate,
            isRead: false,
          });

          return `Reminder set for ${reminderDate.toLocaleString()}: "${message}"`;
        },
      }),
      listReminders: llm.tool({
        description: "List all active reminders for the farmer.",
        execute: async (_, { ctx }) => {
          const farmerId = ctx.userData.farmer.id!;
          const reminders = await db
            .select()
            .from(notificationsTable)
            .where(
              and(
                eq(notificationsTable.farmerId, farmerId),
                eq(notificationsTable.type, "reminder")
              )
            );
          return reminders.map((r) => ({
            reminderId: r.id,
            message: r.message,
            scheduledFor: new Date(r.scheduledFor!).toLocaleString(),
          }));
        },
      }),
      deleteReminder: llm.tool({
        description: "Delete a specific reminder by its ID.",
        parameters: z.object({
          reminderId: z.string().describe("The ID of the reminder to delete."),
        }),
        execute: async ({ reminderId }, { ctx }) => {
          const farmerId = ctx.userData.farmer.id!;
          const [deletedNotification] = await db
            .delete(notificationsTable)
            .where(
              and(
                eq(notificationsTable.id, reminderId),
                eq(notificationsTable.farmerId, farmerId),
                eq(notificationsTable.type, "reminder")
              )
            )
            .returning();

          await notificationQueue.remove(deletedNotification.jobId!);

          return "Reminder deleted successfully.";
        },
      }),
    },
  });

  return suggestionAgent;
};

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx) => {
    const metadata = ctx.job.metadata ? JSON.parse(ctx.job.metadata) : {};
    const farmerData = metadata.farmer || {};
    const cropData = metadata.crop || {};

    const agents = {
      logAgent: createLogAgent(),
      suggestionAgent: createSuggestionAgent(),
    };

    const userData = createRoomData({
      farmer: farmerData,
      crop: cropData,
      activityLog: {
        activityType: undefined,
        details: [],
        summary: "",
        said: "",
        photoUrl: undefined,
        notes: undefined,
        suggestions: undefined,
      },
      agents,
      prevAgent: undefined,
      latitude: cropData.latitude || farmerData.latitude,
      longitude: cropData.longitude || farmerData.longitude,
    });

    const session = new voice.AgentSession<RoomData>({
      userData,
      stt: getSTT(farmerData.primaryLanguage || "english"),
      llm: getLLM("openai"),
      tts: getTTS(farmerData.primaryLanguage || "english"),
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

const llms = {
  openai: openai.LLM.withDeepSeek({
    model: "openai/gpt-4.1",
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
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
  claude: openai.LLM.withDeepSeek({
    model: "anthropic/claude-sonnet-4",
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
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
      return new resemble.TTS({
        voiceUuid: "af3b3fad",
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
    agentName: "log-automation-agent",
    agent: fileURLToPath(import.meta.url),
  })
);
