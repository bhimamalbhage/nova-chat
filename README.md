# Nova Chat

Nova Chat is an advanced AI-powered assistant that acts as a "Second Brain" by integrating deep memory context with powerful external tools. Built with Next.js and the Vercel AI SDK, it bridges the gap between chat interfaces and your digital life.

## 🚀 Key Features

*   **🧠 Supermemory Integration**: Maintains a persistent "Memory Graph" of your interactions, allowing the AI to recall preferences, facts, and past conversations intelligently.
*   **🛠️ Deep Integrations (via Composio)**:
    *   **Slack**: Two-way persistent chat. Mention `@Nova` in Slack to get answers, or have it perform tasks like "Pull up my last email".
    *   **Gmail**: Read, draft, and send emails directly from conversation.
    *   **Google Calendar**: Schedule, update, and check your events.
    *   **Notion**: Search and manage your knowledge base.
    *   **Web Search**: Real-time web capabilities using Exa.ai.
*   **🔌 Omnichannel Experience**: Talk to Nova via the dedicated Web UI or directly inside Slack.
*   **🎨 Modern UI**: Sleek, glassmorphism-inspired interface with real-time typing indicators and memory visualization.

## 🛠️ Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **AI**: Vercel AI SDK (v5)
*   **Database**: Supabase
*   **Tools/Agents**: Composio & Exa.ai
*   **Memory**: Supermemory
*   **Styling**: TailwindCSS & Shadcn UI

## 🏁 Getting Started

1.  **Clone the repo**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment Variables**:
    *   Copy `.env.example` to `.env.local`
    *   Configure Supabase, OpenAI, Composio, Exa, and Supermemory keys.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🤖 Capabilities

- **Memory Graph**: Visualizes how Nova connects your queries to stored memories.
- **Two-Pass Synthesis**: Ensures tool outputs (like JSON from APIs) are always converted into natural, human-readable responses.
- **Multi-Tenant Slack**: Supports multiple workspaces via database-backed token management.


