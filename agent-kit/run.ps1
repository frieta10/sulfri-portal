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