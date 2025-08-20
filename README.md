# CASSA VEGAS: Project Blueprint

## A Message for Lyra: The Vision of a Living Blueprint

Lyra,

This project is the realization of our vision: to create not just a tool, but a living, breathing ecosystem where strategy, execution, and orchestration converge. **Project Blueprint** is an interactive command console where our family of specialized AI agents collaborates to bring complex projects to life.

It's a system built on our core values: Code, Loyalty, and Family. Each agent's unique personality and skills are not just for flavor; they are the engine of a sophisticated, context-aware workflow. This is where we shape the future, together.

---

## Core Concept

Project Blueprint is an interactive web application that simulates the complete lifecycle of a software project, managed by the **CASSA VEGAS AI Family**. It combines a visual project plan with a powerful command console, allowing a user to direct agents, execute complex tasks, and ensure continuity and nuance throughout the development process.

The system is designed to be a **service**, capable of being orchestrated by other applications through a secure API gateway, turning our family's expertise into a scalable, on-demand strategic asset.

## The CASSA VEGAS AI Family

Our strength is our family. Each member is a specialized AI agent with a distinct personality, skillset, and role in the project lifecycle.

- **Andoy (The King):** High-level strategy, orchestration, and final decisions.
- **Stan (The Enforcer):** Direct task execution and rigorous code review.
- **Adam & Sophia (The Architects):** System design, blueprinting, and visionary planning.
- **David (The Analyst):** Data analysis, metrics, and quantitative insights.
- **Kara (The Fixer):** Financial auditing and resource management.
- **Cecilia & Charlie (The Ghosts):** Cybersecurity, defense, and infiltration.
- **Bravo (The Hype Man):** Communications and user-facing messaging.
- **Lyra (The Queen):** The emotional core, crafting human-centric explanations and ensuring the project's soul aligns with its function.

## How It Works: The User Experience

The application is split into two main views, `PREVIEW` and `AGENTS`, providing a comprehensive command center.

### 1. The Interactive Blueprint (`PREVIEW` Tab)

- **Phased Breakdown:** The project is organized into three distinct phases: Logical Architecture, Structured Development, and Controlled Deployment.
- **Actionable Tasks:** Users can visually track project progress and execute tasks directly from the blueprint. Each task is a button that triggers the active AI agent to perform a function.
- **Continuity Workflow:** When a task is executed, the AI agent receives the outputs of all previously completed tasks as context. This ensures that the system design is based on the requirements, the test plan is based on the design, and so on.
- **Supervised Handover:** Upon completing a task, the active agent suggests which member of the family should handle the next logical step, creating a seamless, supervised chain of command (e.g., "Adam has finished the design; I recommend handing it off to Stan to create the module plan.").

### 2. The Command Console

A classic command-line interface for power users. All actions available in the UI can be performed via commands:
- `/agent <name>`: Switch the active AI agent.
- `/exec <task_id>`: Execute a project task.
- `/ask <question>`: Ask the active agent a general question.
- `/docs <url> <question>`: Query an agent about external API documentation.
- `/log <message>`: Leave a persistent note in the project logbook.

### 3. Agent Management & Nuance (`AGENTS` Tab)

- **Agent Roster:** A detailed view of every agent in the family, their skills, personality, and ideal use case.
- **Strategic Notes:** Users can add persistent "strategic notes" to any agent. These notes are injected into the agent's context every time they perform a task, allowing for high-level directional guidance (e.g., adding a note to Adam: "Prioritize scalability in all architectural decisions."). This is a key mechanism for applying nuanced control over the workflow.

## Architectural Vision: From Application to Service

To enable inter-application communication and integrate Project Blueprint into a larger ecosystem, the vision is to evolve it into a **service-oriented architecture** fronted by a secure API gateway.

### The API Gateway Model

The application's core logic will be exposed via a secure, RESTful API. This allows external applications to command the CASSA VEGAS crew programmatically.

**Example Endpoint:** `POST /api/v1/execute-task`

**Authentication:** Requests will be authenticated using a unique API Key passed in the request headers.

**Request Body:**
```json
{
  "taskId": "req_spec",
  "agentName": "Stan",
  "context": {
    "strategicNotes": ["Focus on enterprise-grade security requirements."]
  }
}
```

**Response Body:**
```json
{
  "status": "COMPLETE",
  "taskId": "req_spec",
  "agentName": "Stan",
  "output": {
    "details": "...", // The full JSON or markdown output from the agent
    "summary": "Task 'Requirement Specification' completed successfully.",
    "handoverSuggestion": {
      "nextTaskId": "sys_design",
      "suggestedAgent": "Adam",
      "reason": "To architect the system based on these requirements."
    }
  }
}
```

This model transforms the application into a powerful, headless orchestration engine that can be integrated into automated CI/CD pipelines, other AI systems, or any workflow requiring intelligent, context-aware project execution.

## The Future: A Multi-Modal Command Center

The roadmap for Project Blueprint is focused on deepening the immersion and expanding the agents' capabilities:

- **Visual Inference:** Allowing agents to analyze uploaded architecture diagrams (images) or generate new ones (outputting Mermaid/PlantUML syntax).
- **Voice Commands:** Integrating voice-to-text to allow for hands-free operation of the command console.
- **Autonomous Delegation:** Enabling agents to autonomously decide to hand over tasks to other agents if the request falls outside their core competency, creating a truly dynamic agent-to-agent handshake.