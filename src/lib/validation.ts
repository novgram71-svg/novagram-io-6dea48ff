/**
 * Client-side input validation utilities
 * Provides schema-based validation for all user inputs
 * Following OWASP input validation best practices
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATION PATTERNS
// ============================================

// Username: 3-30 chars, alphanumeric + underscore, no spaces
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .transform(val => val.toLowerCase().trim());

// Email: standard email format
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email must be at most 254 characters')
  .transform(val => val.toLowerCase().trim());

// Password: minimum 6 chars (can be strengthened)
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be at most 128 characters');

// Strong password with complexity requirements
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (val) => /[a-z]/.test(val),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Password must contain at least one number'
  );

// Bio: optional text, max 500 chars
export const bioSchema = z
  .string()
  .max(500, 'Bio must be at most 500 characters')
  .optional()
  .transform(val => val?.trim());

// Caption: optional text, max 2200 chars (Instagram-like limit)
export const captionSchema = z
  .string()
  .max(2200, 'Caption must be at most 2200 characters')
  .optional()
  .transform(val => val?.trim());

// Comment: required text, max 1000 chars
export const commentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(1000, 'Comment must be at most 1000 characters')
  .transform(val => val.trim());

// Message: required text, max 5000 chars
export const messageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(5000, 'Message must be at most 5000 characters')
  .transform(val => val.trim());

// Search query: max 100 chars
export const searchQuerySchema = z
  .string()
  .max(100, 'Search query must be at most 100 characters')
  .transform(val => val.trim());

// UUID validation
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid ID format'
  );

// Phone number (basic validation)
export const phoneSchema = z
  .string()
  .regex(/^[+]?[\d\s\-()]+$/, 'Invalid phone number format')
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .optional()
  .transform(val => val?.replace(/\s/g, ''));

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long');

// ============================================
// FORM SCHEMAS
// ============================================

// Login form
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Registration form
export const registrationFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Profile edit form
export const profileEditSchema = z.object({
  username: usernameSchema,
  bio: bioSchema,
  phone_number: phoneSchema,
});

// Post creation form
export const postCreationSchema = z.object({
  caption: captionSchema,
  imageUrl: urlSchema,
});

// Comment form
export const commentFormSchema = z.object({
  content: commentSchema,
  postId: uuidSchema,
});

// Message form
export const messageFormSchema = z.object({
  content: messageSchema,
  receiverId: uuidSchema,
});

// Report form
export const reportFormSchema = z.object({
  reason: z.string().min(1, 'Please select a reason').max(100),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
});

// Password change form
export const passwordChangeSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: strongPasswordSchema,
  confirmNewPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

// ============================================
// SANITIZATION UTILITIES
// ============================================

/**
 * Sanitize string to prevent XSS attacks
 * Removes potentially dangerous characters and patterns
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

/**
 * Sanitize HTML for safe display
 * Only use this if you need to display user-generated HTML
 * Prefer text content over HTML whenever possible
 */
export function sanitizeForDisplay(input: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return input.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

/**
 * Validate and sanitize a URL
 * Returns null if the URL is invalid or potentially dangerous
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Prevent credential injection
    if (parsed.username || parsed.password) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Check if a password is in the common weak passwords list
 */
const commonWeakPasswords = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon',
  '123123', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'master', 'welcome', 'shadow', 'ashley', 'football',
  'monkey', 'passw0rd', 'letmein', 'abc123', 'admin',
]);

export function isWeakPassword(password: string): boolean {
  return commonWeakPasswords.has(password.toLowerCase());
}

/**
 * Validate file upload
 * Checks file type and size
 */
export function validateFileUpload(
  file: File,
  options: {
    allowedTypes: string[];
    maxSizeBytes: number;
  }
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > options.maxSizeBytes) {
    const maxMB = Math.round(options.maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `File size must be less than ${maxMB}MB` };
  }
  
  // Check file type
  const fileType = file.type.toLowerCase();
  if (!options.allowedTypes.some(type => fileType.startsWith(type))) {
    return { valid: false, error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}` };
  }
  
  return { valid: true };
}

// Image upload validation preset
export const imageUploadValidation = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
};

// Voice message upload validation preset
export const voiceUploadValidation = {
  allowedTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg'],
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
};

// General file upload validation preset
export const fileUploadValidation = {
  allowedTypes: ['image/', 'video/', 'audio/', 'application/pdf'],
  maxSizeBytes: 25 * 1024 * 1024, // 25MB
};
