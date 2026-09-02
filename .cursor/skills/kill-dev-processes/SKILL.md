---
name: kill-dev-processes
description: Kills leftover Vite or preview processes still listening on CV Builder ports. Use when the user asks to kill consoles, stop leftover node/vite servers, free a port, or when EADDRINUSE / port already in use appears.
---

# Kill leftover Vite processes

Stop stray dev servers left after a closed terminal on **Vite ports 5173–5180** and **preview ports 4173–4180**. If Docker owns a port, report it and **ask the user before killing**.

## Ports

| Ports     | Typical process                  |
| --------- | -------------------------------- |
| 5173–5180 | Vite dev (`npm run dev`)         |
| 4173–4180 | Vite preview (`npm run preview`) |

The Portfolio repo uses the same range, so a second dev server lands on 5174. Killing the range stops both projects; say so before doing it if the user has the Portfolio open.

## Steps

1. Run the script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/skills/kill-dev-processes/scripts/kill-dev-processes.ps1
```

2. Report each killed PID, name, and port.
3. If a listener is Docker (`docker-proxy`, `com.docker.backend`, path under `Docker\`), **do not kill it yet**. Tell the user which ports/PIDs it is, then ask: "Docker uses port X. Kill it?"
4. Only if they say yes, re-run with `-KillDocker`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/skills/kill-dev-processes/scripts/kill-dev-processes.ps1 -KillDocker
```

5. Skip PID 0 and 4 (System). Do not `taskkill` every `node.exe`.
6. If a non-Docker port stays busy, re-run once and show the listener.

## After

The user can start the app again (`npm run dev` on port 5173).
