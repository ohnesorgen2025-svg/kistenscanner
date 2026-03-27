# DevPilot Agent Onboarding

## Read Order
When you start a session, read these files in this order:
1. `.agent/AI_AGENT_ONBOARDING.md` if present
2. `.agent/CURRENT_TASK.md`
3. `.agent/DEPLOYMENT.md` if present
4. `.agent/DECISIONS.md`
5. `.agent/ROADMAP.md`
6. `.agent/STACK.md`
7. `.agent/PROJECT_RULES.md`
8. `.agent/INSTRUCTIONS.md`

## Purpose
- `CURRENT_TASK.md` is the operational handover file
- `DEPLOYMENT.md` is the current LAN deployment state
- `DECISIONS.md` explains why the project looks the way it does
- `ROADMAP.md` shows broader direction
- `STACK.md` and `PROJECT_RULES.md` define technical and product constraints
- `INSTRUCTIONS.md` defines project-specific execution rules

## Working Rule
- Continue from the current task instead of inventing a new workflow
- Prefer small, pragmatic, reusable changes
- Keep handovers short and concrete
- If a project is already LAN-ready, finish substantive implementation work with commit, push, and a DevPilot deploy unless the prompt explicitly says no deploy
