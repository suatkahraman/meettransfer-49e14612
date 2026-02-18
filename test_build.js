const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Starting build...");
  const stdout = execSync('node node_modules/vite/bin/vite.js build', { encoding: 'utf8', stdio: 'pipe' });
  fs.writeFileSync('build_debug.log', 'SUCCESS\n' + stdout);
  console.log("Build finished.");
} catch (error) {
  fs.writeFileSync('build_debug.log', 'ERROR\n' + error.message + '\nSTDOUT:\n' + error.stdout + '\nSTDERR:\n' + error.stderr);
  console.log("Build failed.");
}
