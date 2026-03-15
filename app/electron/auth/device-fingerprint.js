const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');

function getDeviceId() {
  try {
    // Get the machine ID
    const machineId = machineIdSync();

    // Create a stable hash from the machine ID
    const hash = crypto.createHash('sha256').update(machineId).digest('hex');

    return hash;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a random ID (not ideal, but better than crashing)
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = { getDeviceId };
