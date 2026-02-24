param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-FileUtf8($path, $content) {
  $dir = Split-Path -Parent $path
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $content = $content -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
}

function Ensure-Dir($path) {
  if (!(Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

function Safe-Create($path, $content) {
  if ((Test-Path $path) -and -not $Force) {
    Write-Host "Skip (exists): $path"
    return
  }
  Write-FileUtf8 $path $content
  Write-Host "Wrote: $path"
}

# --- Create folders ---
Ensure-Dir ".\agent-kit"
Ensure-Dir ".\agent-kit\templates"
Ensure-Dir ".\out\payloads"

# --- config.json ---
Safe-Create ".\agent-kit\config.json" @'
{
  "models": {
    "claude": { "role": "Spec & Review", "max_files": 6 },
    "gemini": { "role": "Architecture & Integration", "max_files": 6 },
    "kimi": { "role": "Implementation", "max_files": 8 }
  },
  "defaults": {
    "truth_pack_max_chars": 9000,
    "state_max_chars": 5000,
    "task_contract_max_chars": 6000
  },
  "always_include": ["SYSTEM.md", "STATE.md", "TASK_CONTRACT.md"]
}
'@

# --- run.ps1 ---
Safe-Create ".\agent-kit\run.ps1" @'
param(
  [Parameter(Mandatory=$true)]
  [string]$Task,

  [switch]$Commit,
  [string]$Branch = ""
)

$ErrorActionPreference = "Stop"

# Verify python
python --version | Out-Null

# Generate/update MDs + job packs
python ".\agent-kit\agent.py" --task "$Task"

Write-Host ""
Write-Host "Generated:"
Write-Host " - SYSTEM.md, STATE.md, TASK_CONTRACT.md"
Write-Host " - ROUTER_PROMPT.md, RETRIEVER_PROMPT.md"
Write-Host " - out\payloads\job_*.md"

if ($Commit) {
  if ($Branch -ne "") {
    git checkout -B $Branch
  }

  git add SYSTEM.md STATE.md TASK_CONTRACT.md ROUTER_PROMPT.md RETRIEVER_PROMPT.md SRS.md out/payloads
  git commit -m "agent-kit: update packs for task: $Task" | Out-Null
  git push | Out-Null

  Write-Host ""
  Write-Host "Committed + pushed."
}
'@

# --- agent.py ---
Safe-Create ".\agent-kit\agent.py" @'
import argparse, json, os, re
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def read(path, default=""):
    try:
        with open(os.path.join(ROOT, path), "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return default

def write(path, content):
    p = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content.rstrip() + "\n")

def clip(text, max_chars):
    return text if len(text) <= max_chars else text[:max_chars].rstrip() + "\n\n[TRUNCATED]\n"

def section(text, heading):
    pattern = rf"^##\s+{re.escape(heading)}\s*$"
    lines = text.splitlines()
    out, in_section = [], False
    for line in lines:
        if re.match(pattern, line.strip()):
            in_section = True
            continue
        if in_section and line.strip().startswith("## "):
            break
        if in_section:
            out.append(line)
    return "\n".join(out).strip()

def guess_repo_map():
    items = []
    for name in os.listdir(ROOT):
        if name.startswith(".") or name in ["agent-kit", "out", "__pycache__", "node_modules"]:
            continue
        p = os.path.join(ROOT, name)
        items.append(f"- /{name}/" if os.path.isdir(p) else f"- {name}")
    return "\n".join(sorted(items))

def build_system_md(srs, cfg):
    overview = section(srs, "Project Overview") or "Add ## Project Overview in SRS.md"
    arch = section(srs, "Architecture") or section(srs, "System Architecture") or ""
    constraints = section(srs, "Constraints") or ""
    env = section(srs, "Environment") or ""
    repo_map = guess_repo_map()

    content = f"""# SYSTEM.md
# Project Truth Pack (Auto-generated)

## 1. Project Overview
{overview}

## 2. Architecture Summary
{arch if arch else "- (Add ## Architecture in SRS.md)"}

## 3. Repository Map (Top-level)
{repo_map}

## 4. Engineering & Security Rules
{constraints if constraints else "- Follow repo conventions; no secrets in code; validate inputs; structured errors."}

## 5. Environment
{env if env else "- (Add ## Environment in SRS.md)"} 
"""
    return clip(content, cfg["defaults"]["truth_pack_max_chars"])

def build_state_md(old_state, task, cfg):
    today = datetime.now().strftime("%Y-%m-%d")
    completed = section(old_state, "Completed") or "- (none recorded yet)"
    risks = section(old_state, "Known Risks / Issues") or "- (none recorded yet)"
    next_tasks = section(old_state, "Next Tasks") or "- (define after completion)"

    content = f"""# STATE.md
# Current Project State (Auto-updated)

## Date
{today}

## Sprint Objective
Deliver the current task safely and keep system stable.

## In Progress
- {task}

## Completed
{completed}

## Known Risks / Issues
{risks}

## Next Tasks
{next_tasks}
"""
    return clip(content, cfg["defaults"]["state_max_chars"])

def build_task_contract_md(srs, task, cfg):
    constraints = section(srs, "Constraints") or "- Follow SYSTEM.md; no breaking changes unless explicitly allowed."
    tests = section(srs, "Testing") or "- Unit tests where applicable\n- Basic integration test if endpoints/db touched"

    content = f"""# TASK_CONTRACT.md
# Task Contract (Auto-generated)

## Objective
{task}

## Definition of Done
- [ ] Implementation completed
- [ ] No breaking changes introduced (unless explicitly approved in SRS)
- [ ] Tests updated/added and passing
- [ ] STATE.md updated with completion + next steps

## Constraints
{constraints}

## In Scope Files
- (retriever will keep scope tight)

## Out of Scope
- Unrelated refactors
- New major dependencies unless justified

## Inputs / Outputs
- Input: as per SRS and existing interfaces
- Output: as per SRS and existing interfaces

## Tests Required
{tests}

## Non-Goals
- Rewriting the entire system
- Changing architecture decisions without updating DECISIONS.md (if used)
"""
    return clip(content, cfg["defaults"]["task_contract_max_chars"])

def build_router_prompt(task_contract_md):
    obj = section(task_contract_md, "Objective")
    return f"""# ROUTER_PROMPT.md
You are the orchestration router.

Authoritative context:
- SYSTEM.md
- STATE.md
- TASK_CONTRACT.md

Task:
{obj}

Routing rules:
- Claude: acceptance criteria, tests, review diffs
- Gemini: architecture/integration impact, diagrams, deployment implications
- Kimi: implement code within scope

Constraints:
- Never request full repo
- Ask only for specific file paths if missing
- Output must be short and structured

Output format:
Selected Model(s):
Order:
Reason:
Required Files (max 3–8):
"""

def build_retriever_prompt(task_contract_md):
    obj = section(task_contract_md, "Objective")
    return f"""# RETRIEVER_PROMPT.md
You are the context retriever.

Always include:
- SYSTEM.md
- STATE.md
- TASK_CONTRACT.md

Rules:
- Include only 3–7 relevant files (8 max for implementation)
- If a file is large, include only relevant sections
- Never include full repo
- If missing context, request exact file paths

Task:
{obj}

Output format:
Context Files Selected:
Missing Context (exact file paths only):
"""

def job_pack(model, system_md, state_md, task_contract_md):
    return f"""# job_{model}.md
You are acting as: {model.upper()}.

Read these first (authoritative):
--- SYSTEM.md ---
{system_md}

--- STATE.md ---
{state_md}

--- TASK_CONTRACT.md ---
{task_contract_md}

Operating rules:
- Keep responses scoped
- Ask for missing context by exact file path only
- Do not request entire repo

Model responsibilities:
- Claude: acceptance criteria + test plan OR review a diff
- Gemini: architecture approach + integration risks + diagram if needed
- Kimi: implementation plan + file list + diffs
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", required=True)
    args = ap.parse_args()

    cfg = json.loads(read("agent-kit/config.json", "{}"))
    srs = read("SRS.md", "")
    if not srs.strip():
        raise SystemExit("Missing SRS.md at repo root. Create it and rerun.")

    old_state = read("STATE.md", "")

    system_md = build_system_md(srs, cfg)
    state_md = build_state_md(old_state, args.task, cfg)
    task_contract_md = build_task_contract_md(srs, args.task, cfg)

    write("SYSTEM.md", system_md)
    write("STATE.md", state_md)
    write("TASK_CONTRACT.md", task_contract_md)
    write("ROUTER_PROMPT.md", build_router_prompt(task_contract_md))
    write("RETRIEVER_PROMPT.md", build_retriever_prompt(task_contract_md))

    os.makedirs(os.path.join(ROOT, "out", "payloads"), exist_ok=True)
    write("out/payloads/job_claude.md", job_pack("claude", system_md, state_md, task_contract_md))
    write("out/payloads/job_gemini.md", job_pack("gemini", system_md, state_md, task_contract_md))
    write("out/payloads/job_kimi.md", job_pack("kimi", system_md, state_md, task_contract_md))

if __name__ == "__main__":
    main()
'@

# --- SRS.md starter (only if missing) ---
if (!(Test-Path ".\SRS.md") -or $Force) {
  Safe-Create ".\SRS.md" @'
# SRS.md

## Project Overview
(3–8 lines)

## Architecture
- Frontend:
- Backend:
- DB:
- Auth:
- Hosting:

## Constraints
- No breaking changes without approval
- Keep dependencies minimal
- Follow repo conventions

## Environment
- PORT=
- DATABASE_URL=
- OTHER_KEY=

## Testing
- Unit tests for business logic
- Integration tests for API/DB changes
'@
} else {
  Write-Host "Skip (exists): SRS.md"
}

Write-Host ""
Write-Host "Setup complete."
Write-Host "Next: Run .\agent-kit\run.ps1 -Task `"Your task here`""