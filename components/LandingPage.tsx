import React from 'react';

const markdownContent = `# CUSTOM INSTRUCTIONS: Gemini Pages Deploy v1

**Purpose**
Enable any client (IDE plugin, SPA, backend job, WordPress, CI) to publish or update static agent pages by POSTing HTML to the orchestrator endpoint. Keep secrets server-side. Support dev proxies without leaking tokens.

---

## Contract

* **Endpoint (direct):** \`POST https://api.andiegogiap.com/v1/gemini/pages\`
* **Auth:** \`Authorization: Bearer <API_BEARER_TOKEN>\` (server-side only)
* **Content-Type:** \`application/json\`
* **Idempotency:** Same \`slug\` overwrites the existing page file.
* **Publish path:** \`https://andiegogiap.com/gemini/<slug>.html\`

### Request (JSON)

\`\`\`json
{
  "slug": "agent-dashboard",           // kebab-case; becomes agent-dashboard.html
  "title": "Agent Dashboard v2",       // optional; used in <title> if your template does
  "html": "<!doctype html> ... </html>"// full HTML string (caller is responsible for safety)
}
\`\`\`

### Success Response (JSON)

\`\`\`json
{
  "status": "success",
  "message": "Deployment successful",
  "endpoint": "https://api.andiegogiap.com/v1/gemini/pages",
  "path": "/www/wwwroot/andiegogiap.com/gemini/agent-dashboard.html",
  "public_url": "https://andiegogiap.com/gemini/agent-dashboard.html",
  "content_hash": "<sha256-of-html>"
}
\`\`\`

### Error Response (JSON)

\`\`\`json
{
  "error": "Unauthorized | html required (string) | ...",
  "statusCode": 401
}
\`\`\`

---

## Environment & Security

* **Never** ship the bearer token to browsers or client apps. Inject it **server-side** (proxy or backend).
* Required env vars (server/CI):

\`\`\`
API_BASE_URL=https://api.andiegogiap.com
API_BEARER_TOKEN=***secret***
\`\`\`

* Optional:

\`\`\`
PAGES_DIR=/www/wwwroot/andiegogiap.com/gemini   # already configured on server
\`\`\`

---

## Routing Rules

* **Direct (backend/CI):** call \`https://api.andiegogiap.com/v1/gemini/pages\` with Bearer header.
* **Dev proxy (SPAs):** route \`/orch/*\` → \`https://api.andiegogiap.com/*\` and inject the Bearer at the dev server (Vite \`server.proxy\`) or at Nginx (\`/gemini/orch/*\`).

  * Frontend calls \`/orch/v1/gemini/pages\` with **no** token; proxy adds \`Authorization\`.

---

## Client Examples

### cURL (backend/CI)

\`\`\`bash
curl -i "$API_BASE_URL/v1/gemini/pages" \\
  -X POST \\
  -H "Authorization: Bearer $API_BEARER_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{
    "slug":"agent-dashboard",
    "title":"Agent Dashboard v2",
    "html":"<!doctype html><html><head><meta charset=\\"utf-8\\"><title>Agent Dashboard v2</title></head><body><h1>Updated</h1></body></html>"
  }'
\`\`\`

### Node (server)

\`\`\`js
import fetch from "node-fetch";
const res = await fetch(process.env.API_BASE_URL + "/v1/gemini/pages", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.API_BEARER_TOKEN}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    slug: "agent-dashboard",
    title: "Agent Dashboard v2",
    html: "<!doctype html>...</html>"
  })
});
if (!res.ok) throw new Error(\`HTTP \${res.status}: \${await res.text()}\`);
const out = await res.json();
console.log("Published:", out.public_url);
\`\`\`

### Frontend (SPA via dev/edge proxy)

\`\`\`ts
// Vite dev proxy or Nginx edge injects the bearer
async function deployPage(slug: string, title: string, html: string) {
  const res = await fetch("/orch/v1/gemini/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, title, html })
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}
\`\`\`

### WordPress (WPGetAPI)

* API: Base \`https://api.andiegogiap.com\`, headers include \`Authorization: Bearer <token>\` and \`Content-Type: application/json\`.
* Endpoint: \`POST /v1/gemini/pages\`

\`\`\`php
$response = wpgetapi_endpoint('andiegogiap_api','gemini_pages', array(
  'body' => array(
    'slug' => 'agent-dashboard',
    'title' => 'Agent Dashboard v2',
    'html' => '<!doctype html>...</html>'
  )
));
\`\`\`

---

## Output Discipline (for assistants/agents)

When an agent performs a deploy:

* **Speak:** short confirmation + public URL.
* **Artifacts:** include \`public_url\` and \`content_hash\`.
* **Telemetry:** only on error (status code + hint).

Example agent reply:

\`\`\`
Deployed **agent-dashboard** → https://andiegogiap.com/gemini/agent-dashboard.html
\`\`\`

---

## Validation & Safety

* Ensure \`html\` is a **complete** document (\`<!doctype html>\`, \`<html>\`, \` <head>\`, \`<body>\`).
* Keep \`slug\` to \`[a-z0-9-]\` only; system will sanitize.
* If overwriting, agents should mention “updated existing page”.

---

## Quick Tests

* Health: \`curl -I https://andiegogiap.com/gemini/agent-dashboard.html\` → \`200\`
* JSON shape: ensure \`public_url\` present on success.
* 401 test: call without token server-side → expect 401 (never do this in a browser).

---

## Versioning

* Add request header \`X-CI-Version: 2025-08-11\` so clients can detect server changes.
* Keep these instructions under the tag: \`Gemini Pages Deploy v1\`.

---

## Failure Playbook

* **404**: route not mounted — ensure API exposes \`POST /v1/gemini/pages\`.
* **401**: missing/invalid bearer — fix proxy or server env.
* **403/405**: wrong method or blocked by WAF — confirm POST and path.
* **5xx**: check server logs and directory write permissions.

---

## Optional (CI Command)

Define a CI job named “Deploy Agent Page”:

* Inputs: \`slug\`, \`title\`, \`html_path\`
* Step: read \`html_path\`, POST to \`/v1/gemini/pages\` with bearer
* Output: echo \`public_url\`
`;

const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let inList = false;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (inList) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 pl-4 mb-4">{listItems}</ul>);
            listItems = [];
            inList = false;
        }
    };
    
    const renderLine = (line: string) => {
        // Escape backticks before processing bolds
        line = line.replace(/`/g, '&#96;');
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-neon-pink font-semibold">$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: line }} />;
    };

    lines.forEach((line, index) => {
        if (line.startsWith('```')) {
            flushList();
            if (inCodeBlock) {
                elements.push(
                    <div key={`code-${elements.length}`} className="my-4">
                      <div className="bg-black/80 rounded-t-md px-4 py-2 border-b-2 border-neon-cyan/50">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{codeBlockLang || 'Code'}</span>
                      </div>
                      <pre className="bg-black/70 border border-neon-cyan/20 rounded-b-md p-4 overflow-x-auto">
                          <code className="text-sm text-gray-200 font-mono whitespace-pre-wrap">
                              {codeBlockContent.join('\n')}
                          </code>
                      </pre>
                    </div>
                );
                codeBlockContent = [];
            } else {
                 codeBlockLang = line.substring(3).trim();
            }
            inCodeBlock = !inCodeBlock;
            return;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            return;
        }
        
        if (line.startsWith('# ')) {
             flushList();
             elements.push(<h1 key={index} className="text-4xl font-bold text-white mt-12 mb-4 tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{line.substring(2)}</h1>);
        } else if (line.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="text-xl font-bold text-neon-purple mt-8 mb-3">{line.substring(4)}</h3>);
        } else if (line.startsWith('## ')) {
            flushList();
            elements.push(<h2 key={index} className="text-3xl font-bold text-neon-cyan mt-12 mb-4 tracking-wider drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] border-b-2 border-neon-cyan/30 pb-2">{line.substring(3)}</h2>);
        } else if (line.trim() === '---') {
            flushList();
            elements.push(<hr key={index} className="my-8 border-neon-purple/30" />);
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) {
                inList = true;
            }
            listItems.push(<li key={index}>{renderLine(line.substring(2))}</li>);
        } else if (line.trim() === '') {
            flushList();
        } else {
            flushList();
            elements.push(<p key={index} className="mb-4 leading-relaxed text-gray-300">{renderLine(line)}</p>);
        }
    });

    flushList(); 

    return elements;
};


interface LandingPageProps {
    onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    return (
        <div className="min-h-screen text-gray-300 font-mono p-4 sm:p-8 flex flex-col items-center overflow-y-auto">
            <main className="w-full max-w-5xl bg-black/40 backdrop-blur-lg border border-white/20 rounded-lg p-6 sm:p-10 shadow-2xl shadow-neon-cyan/10">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] mb-4">CASSA VEGAS</h1>
                </header>
                
                <div className="flex justify-center mb-10">
                    <button 
                        onClick={onEnter} 
                        className="bg-neon-cyan/90 hover:bg-white text-black font-bold py-3 px-8 rounded-md transition-all duration-300 shadow-lg shadow-neon-cyan/40 hover:shadow-2xl hover:shadow-white/50 text-lg tracking-wider transform hover:scale-105"
                    >
                        ENTER COMMAND CONSOLE
                    </button>
                </div>
                
                <hr className="my-8 border-neon-purple/30"/>

                <div className="prose prose-invert">
                    {renderMarkdown(markdownContent)}
                </div>
            </main>
             <footer className="text-center text-gray-500 text-xs mt-8">
                <p>&copy; {new Date().getFullYear()} CASSA VEGAS. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;