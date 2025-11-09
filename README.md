# FarmWise 🌱
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762666815/Screenshot_2025-11-09_at_11.09.03_pqphty.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667059/Screenshot_2025-11-09_at_11.13.45_wdvo0r.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667134/Screenshot_2025-11-09_at_11.15.12_znujma.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667264/Screenshot_2025-11-09_at_11.17.30_mizgjt.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667351/Screenshot_2025-11-09_at_11.18.59_o31whh.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667230/Screenshot_2025-11-09_at_11.16.50_mk74my.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667397/Screenshot_2025-11-09_at_11.19.45_q6wgjf.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667444/Screenshot_2025-11-09_at_11.20.27_goqvlv.png)
![](https://res.cloudinary.com/dvovo1lfg/image/upload/v1762667546/Screenshot_2025-11-09_at_11.22.08_gn3v2y.png)

**FarmWise** is an innovative platform designed to empower Indian farmers—especially small and marginal ones—by simplifying access to vital information and personalized guidance. It bridges the gap between complex government schemes and the farmers who need them most.

Through a personalized, interactive AI agent, the platform builds a unique farmer profile to deliver tailored advice on subsidies, daily farm management, crop pricing, and future planning. All features are delivered through a seamless, multilingual, and voice-enabled interface, ensuring accessibility for everyone.

## Features 🎉

- 🤖 **Interactive Profile Building:** An intelligent AI agent interactively builds a detailed farmer profile, capturing data on land holdings, crop types, location, and existing resources.
- 🌾 **Personalized Scheme Matching:** Delivers tailored recommendations for government subsidies and schemes (at central and state levels) that the farmer is eligible for.
- 🗣️ **Multilingual Voice Agent:** Full-featured support in multiple Indian languages, accessible via an interactive voice agent (powered by LiveKit) for maximum accessibility.
- 📈 **Live Market Pricing:** Provides up-to-date crop price suggestions based on current market trends and location, helping farmers get the best value for their produce.
- 🗓️ **Daily Activity Management:** Helps farmers log, track, and manage their daily activities, such as planting, irrigation, and fertilization.
- 💡 **Proactive Farm Guidance:** Suggests future courses of action (e.g., best time to plant, soil health tips, pest control) based on profile data and activity logs.
- 🔔 **Smart AI Reminders:** The AI intelligently sets reminders for important upcoming tasks, such as subsidy application deadlines, irrigation schedules, or harvesting times.
- 🧠 **Persistent Contextual Memory:** (Powered by `mem0`) The AI remembers past conversations and farm details for a continuous, contextual, and truly personal experience.
- 🔄 **Reliable Task Orchestration:** (Powered by `LangGraph` and `Inngest`) Robust, stateful, and reliable management of complex AI flows and background tasks like fetching market data or processing scheme updates.
- ⚡ **Fast & Scalable:** Built on a modern, high-performance stack to ensure a responsive and reliable experience for all users.

## Tech Stack 🛠️

- **Frontend:** Next.js, TypeScript
- **Backend:** Node.js
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM (Type-safe SQL)
- **Vector Database:** QdrantDB (For semantic search on schemes/profiles)
- **AI Orchestration:** LangChain, LangGraph (For complex, stateful AI agents)
- **Real-time & Voice:** LiveKit (WebRTC for AI voice agent), MCP Server
- **AI Memory:** mem0 (Persistent memory for the agent)
- **Task & Event Management:** Inngest (Reliable background jobs and async tasks)

## Installation

To set up and run FarmWise locally, follow these steps:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/farmwise.git](https://github.com/your-username/farmwise.git)
    cd farmwise
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Provide your own database connection strings and API keys in the `.env` file. Create a `.env.local` file in the root directory and add the following:
    ```bash
    # Postgres (Drizzle)
    DATABASE_URL="postgresql://user:password@host:port/dbname"

    # Qdrant
    QDRANT_URL="http://localhost:6333"
    # QDRANT_API_KEY="" # If applicable

    # LiveKit
    LIVEKIT_API_KEY="your_api_key"
    LIVEKIT_API_SECRET="your_api_secret"
    LIVEKIT_URL="wss://your-project.livekit.cloud"

    # LLM Provider (e.g., OpenAI)
    OPENAI_API_KEY="your_llm_api_key"

    # Inngest
    INNGEST_EVENT_KEY="your_inngest_event_key"

    # mem0 (if using cloud)
    MEM0_API_KEY="your_mem0_api_key"

    # App
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

## Usage

-   Log in to the platform to start interacting with the AI agent.
-   Build your profile by answering the agent's questions via text or voice.
-   Once your profile is set, you can ask for:
    -   "Which schemes am I eligible for?"
    -   "What is the current market price for wheat in my area?"
    -   "Remind me to irrigate my fields in two days."
    -   "I just finished planting, please log it."

## Deployment

For deployment, follow the standard Next.js deployment process. The application is designed to be easily deployable on platforms like Vercel (for the frontend) and a separate server/container service (for the Node.js backend components).

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull request workflow. Ensure your code adheres to the project's coding standards and passes all tests.
