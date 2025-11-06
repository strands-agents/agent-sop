/**
 * Message serialization and deserialization utilities
 */
const { validateMessage } = require('./validation');

/**
 * Serialize a message to JSON string
 */
function serializeMessage(message) {
  try {
    // Validate message before serialization
    validateMessage(message);
    return JSON.stringify(message);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      throw new Error('Cannot serialize message with circular references');
    }
    throw new Error(`Message serialization failed: ${error.message}`);
  }
}

/**
 * Deserialize a JSON string to a message object
 */
function deserializeMessage(json) {
  try {
    const parsed = JSON.parse(json);
    
    // Validate the parsed message
    validateMessage(parsed);
    
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in message');
    }
    throw new Error(`Message deserialization failed: ${error.message}`);
  }
}

/**
 * Safely serialize a message, returning null if serialization fails
 */
function safeSerializeMessage(message) {
  try {
    return serializeMessage(message);
  } catch (error) {
    console.error('Message serialization failed:', error);
    return null;
  }
}

/**
 * Safely deserialize a message, returning null if deserialization fails
 */
function safeDeserializeMessage(json) {
  try {
    return deserializeMessage(json);
  } catch (error) {
    console.error('Message deserialization failed:', error);
    return null;
  }
}

/**
 * Serialize multiple messages to JSON array string
 */
function serializeMessages(messages) {
  try {
    // Validate all messages first
    messages.forEach(validateMessage);
    return JSON.stringify(messages);
  } catch (error) {
    throw new Error(`Messages serialization failed: ${error.message}`);
  }
}

/**
 * Deserialize JSON array string to messages
 */
function deserializeMessages(json) {
  try {
    const parsed = JSON.parse(json);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array for messages');
    }
    
    // Validate each message
    parsed.forEach(validateMessage);
    
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in messages array');
    }
    throw new Error(`Messages deserialization failed: ${error.message}`);
  }
}

/**
 * Create a deep copy of a message through serialization
 */
function cloneMessage(message) {
  const serialized = serializeMessage(message);
  return deserializeMessage(serialized);
}

/**
 * Check if a string is valid message JSON
 */
function isValidMessageJson(json) {
  try {
    deserializeMessage(json);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  serializeMessage,
  deserializeMessage,
  safeSerializeMessage,
  safeDeserializeMessage,
  serializeMessages,
  deserializeMessages,
  cloneMessage,
  isValidMessageJson
};
