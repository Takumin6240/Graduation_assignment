const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getLogFileName = () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${timestamp}_server.log`;
};

const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}\n`;

  const logFile = path.join(logsDir, getLogFileName());
  fs.appendFileSync(logFile, logMessage);

  console.log(logMessage.trim());
};

module.exports = { log };
