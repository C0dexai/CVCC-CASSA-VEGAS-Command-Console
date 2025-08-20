



import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Agent, Task, ExecutionStep } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BUGGY_CODE_EXAMPLE = `
function processItems(items) {
  for (var i = 0; i < items.length; i++) {
    setTimeout(function() {
      console.log('Processing item ' + items[i].id); 
    }, 100);
  }
  return items;
}
`;

export const generateContextualText = async (prompt: string, systemInstruction: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.4,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (generateContextualText):", error);
        const errorMessage = (error instanceof Error) ? error.message : "Unknown error";
        return `Error: Failed to generate response. Cognitive module failure. Details: ${errorMessage}`;
    }
};

export const createExecutionPlan = async (goal: string, tasks: Task[], agents: Agent[], customInstruction?: string): Promise<ExecutionStep[]> => {
    const agentProfiles = agents.map(a => `- ${a.name} (${a.role}): ${a.skills.join(', ')}`).join('\n');
    const taskList = tasks.map(t => `- ${t.id} (${t.title}): Belongs to ${t.phase}`).join('\n');

    const prompt = `
Given the user's high-level goal, create a step-by-step execution plan using the available tasks and agents.
Your response MUST be a valid JSON object.
Assign the most suitable agent to each task based on their role and skills.
Ensure the plan follows a logical project progression (e.g., requirements before design, design before coding).
Only include tasks from the provided list.

**User Goal:**
"${goal}"

**Available Agents:**
${agentProfiles}

**Available Tasks:**
${taskList}

Generate the plan.
`;
    const baseSystemInstruction = "You are Andoy, the King of CASSA VEGAS. You are a master orchestrator. Your job is to create a flawless, efficient execution plan by delegating tasks to your family of AI agents. Be strategic and decisive.";
    const systemInstruction = customInstruction ? `${baseSystemInstruction}\n\n**CUSTOM DIRECTIVES:**\n${customInstruction}` : baseSystemInstruction;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plan: {
                            type: Type.ARRAY,
                            description: "The sequence of steps to execute.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    taskId: { type: Type.STRING, description: "The ID of the task to be executed." },
                                    agentName: { type: Type.STRING, description: "The name of the agent assigned to the task." },
                                    justification: { type: Type.STRING, description: "A brief reason for choosing this agent for this task." }
                                }
                            }
                        }
                    }
                }
            },
        });
        const result = JSON.parse(response.text);
        return result.plan;
    } catch (error) {
        console.error("Gemini API Error (createExecutionPlan):", error);
        throw new Error("Failed to create execution plan. Orchestration module failure.");
    }
};

export const createFileCreationPlan = async (goal: string, agents: Agent[], customInstruction?: string): Promise<any[]> => {
    const agentProfiles = agents.map(a => `- ${a.name} (${a.role}): Best for ${a.skills.join(', ')}`).join('\n');

    const prompt = `
You are Andoy, the King of CASSA VEGAS, a master orchestrator. Your task is to create a detailed, step-by-step execution plan to achieve a user's goal that involves creating files.
The plan must be a sequence of actions. Each action must be one of the following types: 'GENERATE_CONTENT', 'WRITE_FILE'.

Actions:
- 'GENERATE_CONTENT': Assign an agent to generate text based on a prompt. The output should be stored in a variable.
- 'WRITE_FILE': Write the content from a variable (generated in a previous step) to a specific file in the virtual file system.

Rules:
- Your response MUST be a valid JSON array of plan steps.
- For 'GENERATE_CONTENT', you must define 'params.prompt' and 'outputVar'.
- For 'WRITE_FILE', you must define 'params.fileName' and 'params.contentVar' (which must match an 'outputVar' from a previous step).
- Assign the most appropriate agent for each step based on their skills.
- The 'fileName' should be a valid file path, e.g., '/src/components/MyComponent.tsx' or '/docs/Feature.md'.

**User Goal:**
"${goal}"

**Available Agents:**
${agentProfiles}

Generate the JSON plan now.
`;
    const baseSystemInstruction = "You are an expert orchestrator AI that creates plans involving content generation and file system operations. Your output MUST be a valid JSON array.";
    const systemInstruction = customInstruction ? `${baseSystemInstruction}\n\n**CUSTOM DIRECTIVES:**\n${customInstruction}` : baseSystemInstruction;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            agentName: { type: Type.STRING },
                            action: { type: Type.STRING, enum: ['GENERATE_CONTENT', 'WRITE_FILE'] },
                            justification: { type: Type.STRING },
                            params: {
                                type: Type.OBJECT,
                                properties: {
                                    prompt: { type: Type.STRING },
                                    fileName: { type: Type.STRING },
                                    contentVar: { type: Type.STRING },
                                }
                            },
                            outputVar: { type: Type.STRING }
                        }
                    }
                }
            },
        });
        const result = JSON.parse(response.text);
        return Array.isArray(result) ? result : result.plan; // Defensive check for array
    } catch (error) {
        console.error("Gemini API Error (createFileCreationPlan):", error);
        throw new Error("Failed to create file creation plan. Orchestration module failure.");
    }
};

export const researchTopicWithGoogle = async (topic: string, systemInstruction: string): Promise<{ summary: string; sources: any[] }> => {
    const prompt = `Research the following topic and provide a concise summary.
Topic: "${topic}"`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.3,
            },
        });
        
        const summary = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

        if (!summary) {
            throw new Error("The research query returned no summary.");
        }

        return { summary, sources };
    } catch (error) {
        console.error("Gemini API Error (researchTopicWithGoogle):", error);
        const errorMessage = (error instanceof Error) ? error.message : "Unknown error";
        throw new Error(`Failed to research topic. Details: ${errorMessage}`);
    }
};

export const writeDocumentation = async (topic: string, researchContext: string, systemInstruction: string): Promise<string> => {
    const prompt = `You are a technical writer. Your task is to write a clear and well-structured markdown document about a specific topic, using the provided research summary and sources.

The final output should be a complete markdown document. It should include:
- A main title.
- An introduction to the topic.
- A body section explaining the key points from the research.
- A "Sources" section at the end, listing the source URLs.

**Topic to Write About:**
${topic}

**Research Context (Summary & Sources):**
---
${researchContext}
---

Begin writing the markdown document now.
`;
    return generateContextualText(prompt, systemInstruction);
};

export const generateFeatureSpec = async (featureDescription: string, systemInstruction: string): Promise<string> => {
  const prompt = `Based on the following feature description, write a high-level technical specification. 
The spec should outline the core components, data models (if any), and key API endpoints or functions.
Use markdown for formatting.

**Feature Description:**
---
${featureDescription}
---
`;
  return generateContextualText(prompt, systemInstruction);
};

export const generatePseudoCode = async (technicalSpec: string, systemInstruction:string): Promise<string> => {
    const prompt = `Based on the provided technical specification, write a clear, language-agnostic pseudo-code implementation for the core logic.
Focus on logic, control flow, and function signatures.
Wrap the final pseudo-code in a markdown code block.

**Technical Specification:**
---
${technicalSpec}
---
`;
    return generateContextualText(prompt, systemInstruction);
}

export const writeDevBlogPost = async (featureDescription: string, technicalSpec: string, pseudoCode: string, systemInstruction: string): Promise<string> => {
    const prompt = `You are a developer advocate writing a blog post for a technical audience.
Your task is to announce and explain a new feature.
Use the provided context to create a complete markdown document.

The blog post should include:
- A catchy title.
- An introduction explaining what the feature is and the problem it solves.
- A section detailing the technical architecture (based on the spec).
- A section showing a practical implementation example (based on a the pseudo-code).
- A concluding paragraph.

**Original Feature Request:**
${featureDescription}

**Technical Specification:**
---
${technicalSpec}
---

**Pseudo-code Implementation:**
---
${pseudoCode}
---

Begin writing the complete markdown blog post now.
`;
    return generateContextualText(prompt, systemInstruction);
};


export const askQuestion = async (question: string, systemInstruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error (askQuestion):", error);
    return "Error: Failed to process query. Cognitive module failure.";
  }
};


export const generateRequirements = async (systemInstruction: string): Promise<string> => {
  const prompt = `Generate a formal requirement specification for a user authentication system. The output must be a single, valid JSON object. The JSON object should have three top-level keys: "functional_requirements", "non_functional_requirements", and "error_handling". Each key's value must be an array of unambiguous, testable, and measurable requirement strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            functional_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            non_functional_requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            error_handling: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
    });
    
    return JSON.stringify(JSON.parse(response.text), null, 2);

  } catch (error) {
    console.error("Gemini API Error (generateRequirements):", error);
    return "Error: Failed to generate requirements. System integrity compromised.";
  }
};

export const generateSystemDesign = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Based on the following project context, describe the system architecture for a user authentication system. Detail component interactions, data flows, and API endpoints. Use markdown for formatting, including lists and code blocks for clarity. The tone must be technical, precise, and efficient.

Project Context:
---
${context || "No context provided. Assume standard requirements for a new system."}
---
`;
  return generateContextualText(prompt, systemInstruction);
};


export const conductCodeReview = async (systemInstruction: string): Promise<string> => {
    const prompt = `Perform a rigorous, automated code review on the provided Javascript code. Identify bugs, style violations, and potential performance issues. Be direct and unforgiving. Your output MUST be a single, valid JSON object.

Code:
\`\`\`javascript
${BUGGY_CODE_EXAMPLE}
\`\`\`
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        issues: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    severity: { type: Type.STRING, enum: ['CRITICAL', 'MAJOR', 'MINOR'] },
                                    category: { type: Type.STRING, enum: ['Bug', 'Performance', 'Style'] },
                                    description: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            },
        });

        const parsedData = JSON.parse(response.text);
        return `## STATIC ANALYSIS REPORT\n\n### TARGETED CODE:\n\`\`\`javascript\n${BUGGY_CODE_EXAMPLE}\n\`\`\`\n\n### FINDINGS:\n${JSON.stringify(parsedData, null, 2)}`;

    } catch (error) {
        console.error("Gemini API Error (conductCodeReview):", error);
        return "Error: Failed to conduct code review. Analysis module failure.";
    }
};

export const queryApiDocs = async (url: string, question: string, systemInstruction: string): Promise<string> => {
  const prompt = `You are acting as an expert API consultant. You have been tasked with analyzing API documentation and answering questions about it.

Assume you have completely read and understood the documentation found at the following URL:
${url}

Now, provide a clear, accurate, and concise answer to the user's question based *only* on the knowledge you would have gained from that documentation. If the answer is likely not in standard API documentation (e.g., "What is the company's stock price?"), state that the query is outside the scope of API documentation analysis.

User Question: "${question}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error (queryApiDocs):", error);
    return "Error: Failed to process API documentation query. Cognitive module failure.";
  }
};

export const generateResourcePlan = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Based on the provided project context, create a detailed resource procurement plan. The output must be a single, valid JSON object. The plan should quantify required resources across three categories: "hardware" (e.g., server specs, count), "software" (e.g., licenses, subscriptions), and "personnel" (e.g., roles, man-hours).

Project Context:
---
${context}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hardware: { type: Type.ARRAY, items: { type: Type.STRING } },
            software: { type: Type.ARRAY, items: { type: Type.STRING } },
            personnel: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
    });
    return JSON.stringify(JSON.parse(response.text), null, 2);
  } catch (error) {
    console.error("Gemini API Error (generateResourcePlan):", error);
    return "Error: Failed to generate resource plan.";
  }
};

export const generatePrototypeSpec = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Using the project context, write a technical specification for a functional prototype. The prototype's purpose is to validate the core architecture. The spec should define the prototype's scope, core features to implement, key performance indicators (KPIs) for validation, and the tech stack to be used. Use markdown for formatting.

Project Context:
---
${context}
---
`;
  return generateContextualText(prompt, systemInstruction);
};

export const generateModulePlan = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Based on the system design in the project context, break down the system into a list of discrete, independently testable code modules. For each module, provide a brief description of its responsibility. Use markdown for formatting.

Project Context:
---
${context}
---
`;
  return generateContextualText(prompt, systemInstruction);
};

export const generateTestPlan = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Based on the project context, create a comprehensive testing plan. The output must be a single, valid JSON object. The plan should outline strategies for "unit_tests", "integration_tests", "performance_tests", and "security_audits". Each strategy should be an array of specific test cases or areas to cover.

Project Context:
---
${context}
---
`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            unit_tests: { type: Type.ARRAY, items: { type: Type.STRING } },
            integration_tests: { type: Type.ARRAY, items: { type: Type.STRING } },
            performance_tests: { type: Type.ARRAY, items: { type: Type.STRING } },
            security_audits: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      },
    });
    return JSON.stringify(JSON.parse(response.text), null, 2);
  } catch (error) {
    console.error("Gemini API Error (generateTestPlan):", error);
    return "Error: Failed to generate test plan.";
  }
};

export const generateRolloutPlan = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Using the project context, devise a staged rollout plan. The plan should define distinct phases (e.g., "Internal Alpha", "Closed Beta", "Public Release"), specify the target user group for each phase, and list key metrics to monitor at each stage. Use markdown for formatting.

Project Context:
---
${context}
---
`;
  return generateContextualText(prompt, systemInstruction);
};

export const generateMonitoringStrategy = async (systemInstruction: string, context: string): Promise<string> => {
  const prompt = `Based on the project context, define a monitoring and alerting strategy. The strategy should identify key performance indicators (KPIs), infrastructure metrics, and application-level metrics to track. It should also suggest specific alert thresholds (e.g., "CPU > 90% for 5 mins"). Use markdown for formatting.

Project Context:
---
${context}
---
`;
  return generateContextualText(prompt, systemInstruction);
};

export const generateDocumentationFramework = async (systemInstruction: string, context:string): Promise<string> => {
  const prompt = `Based on the project context, create a documentation framework. The framework should outline the structure for the project's documentation, including sections for API references, architectural diagrams, setup guides, and contribution guidelines. Provide a template for a typical documentation page using markdown.

Project Context:
---
${context}
---
`;
  return generateContextualText(prompt, systemInstruction);
};

export const sendGeminiCliPrompt = async (prompt: string): Promise<string> => {
  if (!prompt) return "Error: Prompt cannot be empty.";
  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are a powerful AI assistant operating within a command-line interface. Provide clear, concise, and accurate responses. Use markdown for code snippets.",
            temperature: 0.5,
          },
      });
      return response.text;
  } catch (error) {
      console.error("Gemini CLI Error:", error);
      const errorMessage = (error instanceof Error) ? error.message : "Unknown error";
      return `Error: Failed to get response from Gemini. Details: ${errorMessage}`;
  }
};

export const performSemanticSearch = async (query: string, indexedFiles: { path: string, content: string }[], systemInstruction: string): Promise<string> => {
    if (indexedFiles.length === 0) {
        return "Cannot perform search. No files have been indexed in the vector store yet.";
    }

    const fileContext = indexedFiles.map(file => 
        `--- FILE: ${file.path} ---\n${file.content}`
    ).join('\n\n');

    const prompt = `You are an intelligent search engine for a project's file system. Your knowledge is strictly limited to the file contents provided below.
Answer the user's query based *only* on this information.
- Synthesize an answer from multiple files if necessary.
- You MUST cite the source file(s) for your answer using the format [Source: /path/to/file.md].
- If the information is not present in the files, state that clearly. Do not make up information.

**INDEXED FILES:**
${fileContext}

---

**USER QUERY:**
"${query}"
`;

    return generateContextualText(prompt, systemInstruction);
};