Write-Output "Checking vite..." | Out-File -FilePath build_log.txt -Encoding UTF8 
if (Test-Path "node_modules/vite") {
    Get-ChildItem -Recurse node_modules/vite | Select-Object FullName | Out-File -FilePath build_log.txt -Append -Encoding UTF8 
} else {
    "node_modules/vite not found" | Out-File -FilePath build_log.txt -Append -Encoding UTF8
}

$ErrorActionPreference = "Stop"

$logFile = "build_log.txt"
"Starting build..." | Out-File -FilePath $logFile -Append -Encoding UTF8

function LogLine([string]$line) {
  $line | Out-File -FilePath $logFile -Append -Encoding UTF8
  Write-Output $line
}

function Run([string]$command) {
  LogLine ("> " + $command)
  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = "cmd.exe"
  $pinfo.Arguments = "/c " + $command
  $pinfo.RedirectStandardOutput = $true
  $pinfo.RedirectStandardError = $true
  $pinfo.UseShellExecute = $false
  $pinfo.CreateNoWindow = $true

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $pinfo
  [void]$p.Start()
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  if ($stdout) { $stdout.TrimEnd() | Out-File -FilePath $logFile -Append -Encoding UTF8; Write-Output $stdout }
  if ($stderr) { $stderr.TrimEnd() | Out-File -FilePath $logFile -Append -Encoding UTF8; Write-Output $stderr }

  if ($p.ExitCode -ne 0) {
    throw "Command failed with exit code $($p.ExitCode): $command"
  }
}

try {
  $viteBin = Join-Path "node_modules" (Join-Path ".bin" "vite.cmd")

  if (!(Test-Path "node_modules")) {
    LogLine "node_modules not found. Installing dependencies (including devDependencies)..."
    if (Test-Path "package-lock.json") {
      Run "npm.cmd ci --include=dev"
    } else {
      Run "npm.cmd install --include=dev"
    }
  } elseif (!(Test-Path $viteBin)) {
    LogLine "vite is missing (node_modules may be production-only). Reinstalling dependencies (including devDependencies)..."
    if (Test-Path "package-lock.json") {
      Run "npm.cmd ci --include=dev"
    } else {
      Run "npm.cmd install --include=dev"
    }
  } else {
    LogLine "Dependencies look OK (vite found)."
  }

  Run "npm.cmd run build"
  LogLine "Build finished successfully."
} catch {
  LogLine ("Build failed: " + $_.Exception.Message)
  throw
}
