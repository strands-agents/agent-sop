/**
 * Message serialization and deserialization utilities
 */
import { Message } from '../types/messages';
import { validateMessage } from '../types/validation';

/**
 * Serialize a message to JSON string
 * @param message - Message to serialize
 * @returns JSON string representation
 * @throws {Error} If serialization fails
 */
export function serializeMessage(message: Message): string {
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
 * @param json - JSON string to deserialize
 * @returns Parsed and validated message
 * @throws {Error} If deserialization or validation fails
 */
export function deserializeMessage(json: string): Message {
  try {
    const parsed = JSON.parse(json);
    
    // Validate the parsed message
    validateMessage(parsed);
    
    return parsed as Message;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in message');
    }
    throw new Error(`Message deserialization failed: ${error.message}`);
  }
}

/**
 * Safely serialize a message, returning null if serialization fails
 * @param message - Message to serialize
 * @returns JSON string or null if serialization fails
 */
export function safeSerializeMessage(message: Message): string | null {
  try {
    return serializeMessage(message);
  } catch (error) {
    console.error('Message serialization failed:', error);
    return null;
  }
}

/**
 * Safely deserialize a message, returning null if deserialization fails
 * @param json - JSON string to deserialize
 * @returns Parsed message or null if deserialization fails
 */
export function safeDeserializeMessage(json: string): Message | null {
  try {
    return deserializeMessage(json);
  } catch (error) {
    console.error('Message deserialization failed:', error);
    return null;
  }
}

/**
 * Serialize multiple messages to JSON array string
 * @param messages - Array of messages to serialize
 * @returns JSON array string
 * @throws {Error} If any message fails serialization
 */
export function serializeMessages(messages: Message[]): string {
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
 * @param json - JSON array string to deserialize
 * @returns Array of parsed and validated messages
 * @throws {Error} If deserialization or validation fails
 */
export function deserializeMessages(json: string): Message[] {
  try {
    const parsed = JSON.parse(json);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array for messages');
    }
    
    // Validate each message
    parsed.forEach(validateMessage);
    
    return parsed as Message[];
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format in messages array');
    }
    throw new Error(`Messages deserialization failed: ${error.message}`);
  }
}

/**
 * Create a deep copy of a message through serialization
 * @param message - Message to clone
 * @returns Deep copy of the message
 * @throws {Error} If cloning fails
 */
export function cloneMessage(message: Message): Message {
  const serialized = serializeMessage(message);
  return deserializeMessage(serialized);
}

/**
 * Check if a string is valid message JSON
 * @param json - JSON string to check
 * @returns True if string represents a valid message
 */
export function isValidMessageJson(json: string): boolean {
  try {
    deserializeMessage(json);
    return true;
  } catch {
    return false;
  }
}
