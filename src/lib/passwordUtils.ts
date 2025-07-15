// Password utility functions for hashing and verification

/**
 * Generate a random salt
 */
const generateSalt = (length: number = 16): string => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let salt = "";
  for (let i = 0; i < length; i++) {
    salt += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return salt;
};

/**
 * Hash a password using SHA-256 with random salt and multiple iterations
 * Format: $2a$10$[salt][iterations][hash]
 * This is more secure than simple SHA-256 with fixed salt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = generateSalt(16);
  const iterations = 10000; // Multiple iterations to slow down brute force attacks
  
  // Create initial hash with salt
  let hash = password + salt;
  
  // Apply multiple iterations of SHA-256
  for (let i = 0; i < iterations; i++) {
    const encoder = new TextEncoder();
    const data = encoder.encode(hash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Format: $2a$10$[salt][iterations][hash]
  return `$2a$10$${salt}${iterations.toString().padStart(5, '0')}${hash.substring(0, 32)}`;
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Parse the hash format: $2a$10$[salt][iterations][hash]
  if (!hash.startsWith('$2a$10$')) {
    return false;
  }
  
  const hashPart = hash.substring(7); // Remove $2a$10$
  const salt = hashPart.substring(0, 16);
  const iterationsStr = hashPart.substring(16, 21);
  const storedHash = hashPart.substring(21);
  
  const iterations = parseInt(iterationsStr);
  
  // Recreate the hash with the same salt and iterations
  let testHash = password + salt;
  
  for (let i = 0; i < iterations; i++) {
    const encoder = new TextEncoder();
    const data = encoder.encode(testHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    testHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  return storedHash === testHash.substring(0, 32);
};

/**
 * Generate a random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}; 