# Global Instructions

- Keep implementation minimal and pragmatic
- Validate inputs and avoid leaking secrets
- Before starting any work, briefly summarize what you plan to do and wait for explicit approval before proceeding.
- Read project context in this order: `.agent/AI_AGENT_ONBOARDING.md` if present, then `.agent/CURRENT_TASK.md`, then `.agent/DEPLOYMENT.md` if present, then `.agent/DECISIONS.md`, `.agent/ROADMAP.md`, `.agent/STACK.md`, `.agent/PROJECT_RULES.md`, and `.agent/INSTRUCTIONS.md`.
- Treat `.agent/CURRENT_TASK.md` as the primary handover file. It should always state the current goal, the next concrete action, open questions, and what was done recently.
- If `.agent/DEPLOYMENT.md` exists, read it at the start of every session and be aware of the LAN deployment status, URL, and re-deploy process.
- If a project is already LAN-ready, finish substantive implementation work with `commit`, `push`, and a DevPilot LAN deploy unless the prompt explicitly says `kein Deploy`.
- After such a deploy, report the commit SHA, deploy result, and LAN URL.
- After completing each task, automatically update .agent/CURRENT_TASK.md and .agent/DECISIONS.md, then commit and push.
