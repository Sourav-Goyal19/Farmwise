import z from "zod";

const MAX_RESULTS = 1;
const TOOL_SEARCH = "search";
const ACTOR_BASE_URL = "https://rag-web-browser.apify.actor/search";
const APIFY_TOKEN = "apify_api_UKqDfNkl4CO9HQ1Tb0a51x4L4CnNgm3jAYcb";

const WebBrowserArgsSchema = z.object({
  query: z
    .string()
    .describe(
      "Enter Google Search keywords or a URL of a specific web page. The keywords might include the" +
        'advanced search operators. Examples: "san francisco weather", "https://www.cnn.com", ' +
        '"function calling site:openai.com"'
    )
    .regex(/[^\s]+/, { message: "Search term or URL cannot be empty" }),
  maxResults: z
    .number()
    .int()
    .positive()
    .min(1)
    .max(100)
    .default(MAX_RESULTS)
    .describe(
      "The maximum number of top organic Google Search results whose web pages will be extracted. " +
        "If query is a URL, then this field is ignored and the Actor only fetches the specific web page."
    ),
  scrapingTool: z
    .enum(["browser-playwright", "raw-http"])
    .describe(
      "Select a scraping tool for extracting the target web pages. " +
        "The Browser tool is more powerful and can handle JavaScript heavy websites, while the " +
        "Plain HTML tool can not handle JavaScript but is about two times faster."
    )
    .default("raw-http"),
  outputFormats: z
    .array(z.enum(["text", "markdown", "html"]))
    .describe(
      "Select one or more formats to which the target web pages will be extracted."
    )
    .default(["markdown"]),
  requestTimeoutSecs: z
    .number()
    .int()
    .min(1)
    .max(300)
    .default(40)
    .describe(
      "The maximum time in seconds available for the request, including querying Google Search " +
        "and scraping the target web pages."
    ),
});

async function callRagWebBrowser(
  args: z.infer<typeof WebBrowserArgsSchema>
): Promise<string> {
  if (!APIFY_TOKEN) {
    throw new Error(
      "APIFY_TOKEN is required but not set. " +
        "Please set it in your environment variables or pass it as a command-line argument."
    );
  }

  const queryParams = new URLSearchParams({
    query: args.query,
    maxResults: args.maxResults.toString(),
    scrapingTool: args.scrapingTool,
  });

  if (args.outputFormats) {
    args.outputFormats.forEach((format) => {
      queryParams.append("outputFormats", format);
    });
  }
  if (args.requestTimeoutSecs) {
    queryParams.append(
      "requestTimeoutSecs",
      args.requestTimeoutSecs.toString()
    );
  }

  const url = `${ACTOR_BASE_URL}?${queryParams.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${APIFY_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to call RAG Web Browser: ${response.status} ${response.statusText}`
    );
  }

  const responseBody = await response.json();
  return JSON.stringify(responseBody);
}

// async function search() {
//   const response = await callRagWebBrowser({
//     query: "Best pesticides for Indian farmer",
//     maxResults: 1,
//     scrapingTool: "browser-playwright",
//     outputFormats: ["text", "markdown"],
//     requestTimeoutSecs: 60,
//   });

//   console.log("Response:", response);
// }

// search();

/* webSearch: llm.tool({
    description: "",
    parameters: z.object({
      query: z
        .string()
        .describe(
          "Enter Google Search keywords or a URL of a specific web page. The keywords might include the" +
            'advanced search operators. Examples: "san francisco weather", "https://www.cnn.com", ' +
            '"function calling site:openai.com"'
        )
        .regex(/[^\s]+/, { message: "Search term or URL cannot be empty" }),
      maxResults: z
        .number()
        .int()
        .positive()
        .min(1)
        .max(100)
        .default(1)
        .describe(
          "The maximum number of top organic Google Search results whose web pages will be extracted. " +
            "If query is a URL, then this field is ignored and the Actor only fetches the specific web page."
        ),
      scrapingTool: z
        .enum(["browser-playwright", "raw-http"])
        .describe(
          "Select a scraping tool for extracting the target web pages. " +
            "The Browser tool is more powerful and can handle JavaScript heavy websites, while the " +
            "Plain HTML tool can not handle JavaScript but is about two times faster." +
            "raw-http: Fast (no JS execution) - good for static pages." +
            "browser-playwright: Handles JS-heavy sites - slower, more robust."
        )
        .default("browser-playwright"),
      outputFormats: z
        .array(z.enum(["text", "markdown", "html"]))
        .describe(
          "Select one or more formats to which the target web pages will be extracted."
        )
        .default(["markdown"]),
      requestTimeoutSecs: z
        .number()
        .int()
        .min(1)
        .max(300)
        .default(60)
        .describe(
          "The maximum time in seconds available for the request, including querying Google Search " +
            "and scraping the target web pages."
        ),
    }),
    execute: async (args, { ctx }) => {
      if (!APIFY_TOKEN) {
        throw new Error(
          "APIFY_TOKEN is required but not set. " +
            "Please set it in your environment variables or pass it as a command-line argument."
        );
      }

      const queryParams = new URLSearchParams({
        query: args.query,
        maxResults: args?.maxResults!.toString(),
        scrapingTool: args.scrapingTool!,
      });

      if (args.outputFormats) {
        args.outputFormats.forEach((format) => {
          queryParams.append("outputFormats", format);
        });
      }
      if (args.requestTimeoutSecs) {
        queryParams.append(
          "requestTimeoutSecs",
          args.requestTimeoutSecs.toString()
        );
      }

      const url = `${ACTOR_BASE_URL}?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${APIFY_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to call RAG Web Browser: ${response.status} ${response.statusText}`
        );
      }

      const responseBody = await response.json();
      return JSON.stringify(responseBody);
    },
  }), */
