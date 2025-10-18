import { v4 as uuidV4 } from "uuid";
import { getModel } from "../utils/llms";
import { OutputFixingParser } from "langchain/output_parsers";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { insertFarmerProfileTool } from "../tools/core-profile-tools";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import {
  askForDetailsPrompt,
  detailsCompletedPrompt,
  fillDetailsPrompt,
  thanksPrompt,
} from "../prompts/core-profile-agent-prompts";

const ProfileState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (oldMsg, newMsg) => oldMsg.concat(newMsg),
  }),
  fillDetailsMessages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (oldMsg, newMsg) => oldMsg.concat(newMsg),
  }),
  id: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  name: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  gender: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  primaryLanguage: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  village: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  district: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  educationLevel: Annotation<String>({
    default: () => "",
    reducer: (prevVal, newVal) => newVal,
  }),
  totalLandArea: Annotation<Number>({
    default: () => 0,
    reducer: (prevVal, newVal) => newVal,
  }),
  experience: Annotation<Number>({
    default: () => 0,
    reducer: (prevVal, newVal) => newVal,
  }),
  completed: Annotation<Boolean>({
    default: () => false,
    reducer: (oldVal, newVal) => newVal,
  }),
  ask: Annotation<String>({
    default: () => "",
    reducer: (oldVal, newVal) => newVal,
  }),
});

type ProfileStateType = typeof ProfileState.State;

function normalizeExtractedData(extracted: Record<string, any>) {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(extracted)) {
    if (typeof value === "string") {
      normalized[key] = value.trim().toLowerCase();
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

const toolsList = [insertFarmerProfileTool];

const toolsByName = {
  [insertFarmerProfileTool.name]: insertFarmerProfileTool,
};

type DetailsCompleteOutputFormat = {
  ask?: string;
  completed: boolean;
  extracted?: Record<string, any>;
};

async function detailsCompleteNode(
  state: ProfileStateType
): Promise<Partial<ProfileStateType>> {
  try {
    console.log("👻 Visited Details Node");
    const lastMsg = state.messages[state.messages.length - 1];

    const detailsCompleteChain = detailsCompletedPrompt
      .pipe(getModel("gptoss20"))
      .pipe(
        OutputFixingParser.fromLLM(
          getModel("gptoss20"),
          new JsonOutputParser<DetailsCompleteOutputFormat>()
        )
      );

    const details = `
    name - ${state.name}
    gender - ${state.gender}
    village - ${state.village}
    district - ${state.district} (optional)
    educationLevel - ${state.educationLevel}
    totalLandArea - ${state.totalLandArea}
    experience - ${state.experience}
    `;
    const result = await detailsCompleteChain.invoke({
      farmer_details: details,
      farmer_message: lastMsg.content,
    });

    console.log("💀 Details Node Result:", result);

    if (result.extracted && Object.keys(result.extracted).length > 0) {
      const normalizedData = normalizeExtractedData(result.extracted);

      const updatedState: { [key: string]: any } = {};

      Object.entries(normalizedData).forEach(([key, val]) => {
        if (key in state) updatedState[key] = val;
      });

      return { ...updatedState, completed: result.completed };
    }

    return { completed: result.completed, ask: result.ask };
  } catch (error) {
    console.error("DetailsNode:", error);
  }
  return state;
}

async function completedOrNotNode(state: ProfileStateType) {
  if (state.completed) return "fillDetailsNode";
  return "askAgentNode";
}

async function askAgentNode(
  state: ProfileStateType
): Promise<Partial<ProfileStateType>> {
  try {
    console.log("State: ", state);
    console.log("👻 Visited Ask Agent Node");
    const history = state.messages;

    const askAgentChain = askForDetailsPrompt.pipe(getModel("kimik2"));

    const response = await askAgentChain.invoke({
      history,
      ask: state.ask,
      primaryLanguage: state.primaryLanguage,
    });

    console.log("💀 Ask Agent Result:", response.content);

    return { messages: [response] };
  } catch (error) {
    console.error("AskAgentNode", error);
  }
  return state;
}

async function fillDetailsNode(
  state: ProfileStateType
): Promise<Partial<ProfileStateType>> {
  try {
    console.log("👻 Visited Fill Details Node");
    const llm = getModel("kimik2").bindTools(toolsList);
    const fillDetailsChain = fillDetailsPrompt.pipe(llm);
    const details = `
    id - ${state.id}
    primaryLanguage - ${state.primaryLanguage}
    name - ${state.name}
    gender - ${state.gender}
    village - ${state.village}
    district - ${state.district} (optional)
    educationLevel - ${state.educationLevel}
    totalLandArea - ${state.totalLandArea}
    experience - ${state.experience}
    `;
    const history = state.fillDetailsMessages;
    const response = await fillDetailsChain.invoke({
      history,
      farmer_details: details,
    });

    console.log("💀 Fill Details Node Result:", response);

    return { fillDetailsMessages: [response] };
  } catch (error) {
    console.error("FillDetailsNode:", error);
  }
  return state;
}

async function shouldUseTool(state: ProfileStateType) {
  const fillDetailsHistory = state.fillDetailsMessages;
  const lastMsg = fillDetailsHistory[
    fillDetailsHistory.length - 1
  ] as AIMessage;
  if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
    return "toolNode";
  } else {
    return "thanksNode";
  }
}

async function toolNode(state: ProfileStateType) {
  console.log("👻 Visited Tool Node");
  const messages = state.fillDetailsMessages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    const toolResults: ToolMessage[] = [];

    for (const tl of lastMessage.tool_calls) {
      if (tl.name in toolsByName) {
        try {
          // @ts-ignore
          const toolResponse: ToolMessage = await toolsByName[tl.name].invoke(
            tl
          );
          console.log("💀 Tool Response:", toolResponse);
          toolResults.push(toolResponse);
        } catch (error) {
          toolResults.push(
            new ToolMessage({
              content: `Error executing tool ${tl.name}: ${error}`,
              tool_call_id: tl.id || uuidV4(),
              name: tl.name,
            })
          );
        }
      }
    }

    state.fillDetailsMessages = [...toolResults];
  }

  return state;
}

async function thanksNode(
  state: ProfileStateType
): Promise<Partial<ProfileStateType>> {
  try {
    console.log("👻 Visited Thanks Node");
    const thanksChain = thanksPrompt.pipe(getModel("gptoss20"));
    const response = await thanksChain.invoke({
      primaryLanguage: state.primaryLanguage,
    });
    return { messages: [response] };
  } catch (error) {
    console.error("ThanksNode", error);
    return state;
  }
}

const createWorkflow = () => {
  const graph = new StateGraph(ProfileState)
    .addNode("detailsCompleteNode", detailsCompleteNode)
    .addNode("askAgentNode", askAgentNode)
    .addNode("fillDetailsNode", fillDetailsNode)
    .addNode("toolNode", toolNode)
    .addNode("thanksNode", thanksNode)
    .addEdge(START, "detailsCompleteNode")
    .addConditionalEdges("detailsCompleteNode", completedOrNotNode)
    .addEdge("askAgentNode", END)
    .addConditionalEdges("fillDetailsNode", shouldUseTool)
    .addEdge("toolNode", "fillDetailsNode")
    .addEdge("thanksNode", END);

  return graph.compile();
};

const workflow = createWorkflow();

export const startWorkflow = async () => {
  const initialState = {
    messages: [new HumanMessage({ content: "Namaste Ji" })],
    id: "39c58ce3-d3cb-49c6-a92e-7dd4ed4c1c75",
    primaryLanguage: "Hindi",
  };
  const config = {
    configurable: {
      thread_id: "8afb8f8a-1931-4fe4-9373-0272029545eb",
    },
  };

  const response = await workflow.invoke(initialState, config);

  // console.log(response.messages[response.messages.length - 1].content);
};
