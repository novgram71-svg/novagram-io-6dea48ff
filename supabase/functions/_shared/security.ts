/**
 * Security utilities for edge functions
 * Provides rate limiting, input validation, and security headers
 * Following OWASP best practices
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers with security best practices
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Rate limit configuration per endpoint
interface RateLimitConfig {
  maxRequests: number;  // Max requests per window
  windowMs: number;     // Window size in milliseconds
}

const defaultRateLimits: Record<string, RateLimitConfig> = {
  'ai-chat': { maxRequests: 20, windowMs: 60000 },           // 20 requests per minute
  'approve-password-reset': { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  'send-push-notification': { maxRequests: 50, windowMs: 60000 }, // 50 per minute
  'send-verification-email': { maxRequests: 3, windowMs: 300000 }, // 3 per 5 minutes
  'default': { maxRequests: 30, windowMs: 60000 },           // 30 per minute default
};

/**
 * Extract client IP from request headers
 * Handles various proxy headers securely
 */
export function getClientIP(req: Request): string {
  // Try common proxy headers (be careful with trust)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP (client IP)
    const ips = forwarded.split(',').map(ip => ip.trim());
    if (ips[0] && isValidIP(ips[0])) {
      return ips[0];
    }
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP;
  }
  
  // Fallback to a hash of user-agent + some entropy
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `ua-${simpleHash(userAgent)}`;
}

/**
 * Simple IP validation
 */
function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 simplified
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Simple hash function for fallback identification
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check rate limit for a request
 * Uses in-memory tracking for simplicity (resets on cold start)
 * For production, this should use Redis or database
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  req: Request,
  endpoint: string,
  userId?: string
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  const config = defaultRateLimits[endpoint] || defaultRateLimits.default;
  const clientIP = getClientIP(req);
  
  // Use both IP and user ID for identification (more granular control)
  const identifier = userId ? `${clientIP}:${userId}:${endpoint}` : `${clientIP}:${endpoint}`;
  const now = Date.now();
  
  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  if (existing.count >= config.maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }
  
  // Increment counter
  existing.count++;
  return { allowed: true, remaining: config.maxRequests - existing.count };
}

/**
 * Create a rate limit response (429 Too Many Requests)
 */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

// ============================================
// INPUT VALIDATION SCHEMAS
// ============================================

type ValidationRule = {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'email';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean;
};

type ValidationSchema = Record<string, ValidationRule>;

/**
 * Predefined validation schemas for each endpoint
 */
export const validationSchemas: Record<string, ValidationSchema> = {
  'ai-chat': {
    message: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 2000,
      sanitize: true,
    },
    userId: {
      type: 'uuid',
      required: true,
    },
  },
  'approve-password-reset': {
    action: {
      type: 'string',
      required: true,
      pattern: /^(initiate|verify_and_reset|approve|reject)$/,
    },
    email: {
      type: 'email',
      required: false,
    },
    requestId: {
      type: 'uuid',
      required: false,
    },
    verificationCode: {
      type: 'string',
      required: false,
      minLength: 6,
      maxLength: 6,
      pattern: /^[0-9]+$/,
    },
    newPassword: {
      type: 'string',
      required: false,
      minLength: 6,
      maxLength: 128,
    },
  },
  'send-push-notification': {
    userId: {
      type: 'uuid',
      required: true,
    },
    title: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100,
      sanitize: true,
    },
    body: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 500,
      sanitize: true,
    },
    data: {
      type: 'object',
      required: false,
    },
  },
  'send-verification-email': {
    email: {
      type: 'email',
      required: true,
    },
    code: {
      type: 'string',
      required: true,
      minLength: 4,
      maxLength: 10,
      pattern: /^[A-Z0-9]+$/,
    },
    username: {
      type: 'string',
      required: false,
      minLength: 1,
      maxLength: 50,
      sanitize: true,
    },
  },
};

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Email validation regex (basic but secure)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove inline event handlers
    .trim();
}

/**
 * Validate input against a schema
 */
export function validateInput(
  data: Record<string, unknown>,
  schema: ValidationSchema
): { valid: boolean; errors: string[]; sanitizedData: Record<string, unknown> } {
  const errors: string[] = [];
  const sanitizedData: Record<string, unknown> = {};
  
  // Check for unexpected fields (reject unknown fields)
  const allowedFields = Object.keys(schema);
  const providedFields = Object.keys(data);
  
  for (const field of providedFields) {
    if (!allowedFields.includes(field)) {
      errors.push(`Unexpected field: ${field}`);
    }
  }
  
  // Validate each field according to schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName];
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      continue;
    }
    
    // Skip validation if not provided and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
        } else {
          let sanitized = rules.sanitize ? sanitizeString(value) : value;
          
          if (rules.minLength && sanitized.length < rules.minLength) {
            errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
          }
          if (rules.maxLength && sanitized.length > rules.maxLength) {
            errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
          }
          if (rules.pattern && !rules.pattern.test(sanitized)) {
            errors.push(`${fieldName} has invalid format`);
          }
          sanitizedData[fieldName] = sanitized;
        }
        break;
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldName} must be a number`);
        } else {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${fieldName} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${fieldName} must be at most ${rules.max}`);
          }
          sanitizedData[fieldName] = value;
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        } else {
          sanitizedData[fieldName] = value;
        }
        break;
        
      case 'uuid':
        if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
          errors.push(`${fieldName} must be a valid UUID`);
        } else {
          sanitizedData[fieldName] = value.toLowerCase();
        }
        break;
        
      case 'email':
        if (typeof value !== 'string' || !EMAIL_REGEX.test(value) || value.length > 254) {
          errors.push(`${fieldName} must be a valid email address`);
        } else {
          sanitizedData[fieldName] = value.toLowerCase().trim();
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
        } else {
          sanitizedData[fieldName] = value;
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`${fieldName} must be an object`);
        } else {
          sanitizedData[fieldName] = value;
        }
        break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Create a validation error response (400 Bad Request)
 */
export function validationErrorResponse(errors: string[]): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: errors,
    }),
    {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Log security events for audit purposes
 */
export async function logSecurityEvent(
  supabaseUrl: string,
  supabaseKey: string,
  event: {
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('security_audit_log').insert({
      user_id: event.userId || null,
      action: event.action,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      details: event.details || null,
    });
  } catch (error) {
    // Log but don't fail the request
    console.error('Failed to log security event:', error);
  }
}

/**
 * Parse request body safely with size limit
 */
export async function parseRequestBody(
  req: Request,
  maxSizeBytes: number = 100 * 1024 // 100KB default
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return { success: false, error: 'Request body too large' };
    }
    
    const text = await req.text();
    if (text.length > maxSizeBytes) {
      return { success: false, error: 'Request body too large' };
    }
    
    const data = JSON.parse(text);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { success: false, error: 'Request body must be a JSON object' };
    }
    
    return { success: true, data };
  } catch {
    return { success: false, error: 'Invalid JSON in request body' };
  }
}
