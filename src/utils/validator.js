/**
 * @fileoverview Validation utilities - Tesla-style precision, Apple-style elegance
 * @module utils/validator
 */

/**
 * Validation error class with detailed context
 */
export class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Validates string input with length constraints
 * @param {string} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @param {string} options.field - Field name for error reporting
 * @returns {boolean} True if valid
 * @throws {ValidationError} If validation fails
 */
export const validateString = (value, { minLength = 1, maxLength = 1000, field = 'unknown' } = {}) => {
  if (typeof value !== 'string') {
    throw new ValidationError('Value must be a string', field, value);
  }
  
  if (value.length < minLength) {
    throw new ValidationError(`String length must be at least ${minLength}`, field, value);
  }
  
  if (value.length > maxLength) {
    throw new ValidationError(`String length must not exceed ${maxLength}`, field, value);
  }
  
  return true;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 * @throws {ValidationError} If validation fails
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email', email);
  }
  
  return true;
};

/**
 * Validates numeric value within range
 * @param {number} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {string} options.field - Field name
 * @returns {boolean} True if valid
 * @throws {ValidationError} If validation fails
 */
export const validateNumber = (value, { min = -Infinity, max = Infinity, field = 'number' } = {}) => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError('Value must be a valid number', field, value);
  }
  
  if (value < min) {
    throw new ValidationError(`Value must be at least ${min}`, field, value);
  }
  
  if (value > max) {
    throw new ValidationError(`Value must not exceed ${max}`, field, value);
  }
  
  return true;
};

/**
 * Validates object structure against schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Schema definition
 * @returns {boolean} True if valid
 * @throws {ValidationError} If validation fails
 */
export const validateObject = (obj, schema) => {
  if (typeof obj !== 'object' || obj === null) {
    throw new ValidationError('Value must be an object', 'object', obj);
  }
  
  for (const [key, validator] of Object.entries(schema)) {
    if (!(key in obj)) {
      throw new ValidationError(`Missing required field: ${key}`, key, undefined);
    }
    
    if (typeof validator === 'function') {
      validator(obj[key]);
    }
  }
  
  return true;
};

export default {
  ValidationError,
  validateString,
  validateEmail,
  validateNumber,
  validateObject
};
