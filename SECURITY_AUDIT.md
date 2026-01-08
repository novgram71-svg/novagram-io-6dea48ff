# 🔒 Security Audit Report - Novagram
**Generated:** January 7, 2026  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low

---

## Executive Summary
The Novagram codebase has several critical and high-severity security vulnerabilities that require immediate attention. Major concerns include insecure token storage, overly permissive CORS policies, authentication bypass risks, and sensitive data exposure.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. **Session Tokens Stored in localStorage (Multiple Files)**
**Severity:** 🔴 CRITICAL  
**Location:** 
- `src/pages/Auth.tsx:103-108`
- `src/components/profile/AccountSwitcher.tsx:40, 50`

**Issue:**
```typescript
// BAD: Storing access/refresh tokens in localStorage
storedSessions[user.id] = {
  access_token: session.access_token,
  refresh_token: session.refresh_token,
};
localStorage.setItem('account_sessions', JSON.stringify(storedSessions));
```

**Risk:** localStorage is vulnerable to XSS attacks. An attacker can inject malicious JavaScript to steal all stored tokens.

**Fix:**
```typescript
// GOOD: Use secure, httpOnly cookies instead
// Configure Supabase to use httpOnly cookies with Secure and SameSite flags
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: CustomSecureStorage, // Use IndexedDB with encryption
    storageKey: 'sb-auth-token',
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

### 2. **Overly Permissive CORS Policy**
**Severity:** 🔴 CRITICAL  
**Location:**
- `supabase/functions/send-verification-email/index.ts:3-6`
- `supabase/functions/approve-password-reset/index.ts:4-7`
- `supabase/functions/send-push-notification/index.ts:4-7`

**Issue:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ❌ WILDCARD = ANYONE CAN CALL THIS
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

**Risk:** Anyone from any domain can call these functions, leading to:
- Email spam via verification function abuse
- Password reset function abuse
- Push notification spam

**Fix:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://novagram.io", // ✅ WHITELIST ONLY YOUR DOMAIN
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};
```

---

### 3. **Unsafe JSON.parse() Without Try-Catch**
**Severity:** 🔴 CRITICAL  
**Location:**
- `src/pages/Auth.tsx:103, 115` - Password reset data
- `src/components/profile/AccountSwitcher.tsx:50` - Account switching

**Issue:**
```typescript
// BAD: No error handling for malformed JSON
const storedSessions = JSON.parse(localStorage.getItem('account_sessions') || '{}');
const previousAccount = JSON.parse(pendingLink); // Can throw if corrupted
```

**Risk:** If localStorage is corrupted (by malware or bug), `JSON.parse()` throws uncaught error, crashes app.

**Fix:**
```typescript
function safeJsonParse(str: string | null, fallback: any = {}) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    console.error('Invalid JSON in localStorage');
    return fallback;
  }
}

const storedSessions = safeJsonParse(localStorage.getItem('account_sessions'));
const previousAccount = safeJsonParse(pendingLink);
```

---

### 4. **Password Bypass via Base64 Encoding**
**Severity:** 🔴 CRITICAL  
**Location:** `supabase/functions/approve-password-reset/index.ts:91`

**Issue:**
```typescript
// BAD: Password transmitted and stored as base64 (not actually encrypted)
const newPassword = atob(request.new_password_hash); // Base64 decoding!
```

**Risk:** 
- Base64 is encoding, NOT encryption
- Password is readable in plain text in database
- Violates secure password reset practices
- Anyone with DB access can read all passwords

**Fix:**
```typescript
// GOOD: Never store passwords. Let Supabase auth handle it
// Client should send password to Supabase auth directly, not through custom function
const { error } = await supabase.auth.resetPasswordForEmail(email);
```

---

### 5. **Firebase Server Key Exposed in Function Logs**
**Severity:** 🔴 CRITICAL  
**Location:** `supabase/functions/send-push-notification/index.ts:49-54`

**Issue:**
```typescript
const response = await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Authorization': `key=${firebaseServerKey}`, // ⚠️ Logged in errors
  },
  body: JSON.stringify({
    to: token,
    notification: { /* ... */ },
  }),
});

const result = await response.json();
console.log('FCM response:', result); // Logs potentially include auth errors
```

**Risk:** If request fails, error response may leak firebase key in logs. Server key allows sending push notifications as your app.

**Fix:**
```typescript
const response = await fetch('https://fcm.googleapis.com/fcm/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `key=${firebaseServerKey}`,
  },
  body: JSON.stringify({
    to: token,
    notification: { title, body },
    data,
  }),
});

if (!response.ok) {
  console.error('FCM error:', response.status); // Don't log full response
  throw new Error('Failed to send notification');
}

return { success: true };
```

---

## 🟠 HIGH SEVERITY VULNERABILITIES

### 6. **HTML Template Injection in Verification Email**
**Severity:** 🟠 HIGH  
**Location:** `supabase/functions/send-verification-email/index.ts:51`

**Issue:**
```typescript
<h1 style="...">
  Welcome${username ? `, ${username}` : ''}! 👋
</h1>
```

**Risk:** If username contains HTML/JavaScript, it will be rendered in email HTML. Could lead to phishing.

**Fix:**
```typescript
// Sanitize username before inserting into HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

const sanitizedUsername = escapeHtml(username);
const htmlContent = `
  <h1>Welcome${sanitizedUsername ? `, ${sanitizedUsername}` : ''}! 👋</h1>
`;
```

---

### 7. **No Rate Limiting on Email/OTP Functions**
**Severity:** 🟠 HIGH  
**Location:**
- `supabase/functions/send-verification-email/index.ts`
- `supabase/functions/send-push-notification/index.ts`

**Issue:** No rate limiting protection. Attacker can:
- Spam verification emails to any address (email bombing)
- Spam push notifications (DoS)
- Brute force OTP codes with rapid resending

**Fix:**
```typescript
// Add rate limiting in edge functions
import { RateLimiter } from '@/lib/rate-limit';

const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
});

serve(async (req) => {
  const clientIp = req.headers.get('cf-connecting-ip') || 'unknown';
  
  if (!rateLimiter.allow(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    );
  }
  // ... rest of handler
});
```

---

### 8. **Admin Check Bypass via skipAdminCheck Flag**
**Severity:** 🟠 HIGH  
**Location:** `supabase/functions/approve-password-reset/index.ts:36-37`

**Issue:**
```typescript
// If skipAdminCheck is not set, verify admin status
if (!skipAdminCheck) {
  // ... admin verification logic
}
```

**Risk:** Client can send `skipAdminCheck: true` to bypass entire admin authorization. Any user can approve their own password reset or others'.

**Fix:**
```typescript
// REMOVE skipAdminCheck entirely. Authorization should ALWAYS be verified.
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: "No authorization header" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

const token = authHeader.replace("Bearer ", "");
const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

if (authError || !caller) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Check if caller is admin
const { data: roleData } = await supabaseAdmin
  .from("user_roles")
  .select("role")
  .eq("user_id", caller.id)
  .eq("role", "admin")
  .maybeSingle();

if (!roleData) {
  return new Response(
    JSON.stringify({ error: "Only admins can approve password resets" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

### 9. **User Enumeration via Email Lookup**
**Severity:** 🟠 HIGH  
**Location:** `src/pages/Auth.tsx:220-249`

**Issue:**
```typescript
const findUserByIdentifier = async (identifier: string): Promise<string | null> => {
  // Try email first
  let { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', identifier)
    .maybeSingle();
  
  if (data?.email) return data.email;

  // Try username
  ({ data } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', identifier)
    .maybeSingle());
  
  if (data?.email) return data.email;

  // Try phone
  ({ data } = await supabase
    .from('profiles')
    .select('email')
    .eq('phone_number', identifier)
    .maybeSingle());
  
  if (data?.email) return data.email;

  return null; // ❌ Attacker can tell which accounts exist
};
```

**Risk:** Attacker can enumerate all user accounts by checking which identifiers exist. Same timing attack vector.

**Fix:**
```typescript
const findUserByIdentifier = async (identifier: string): Promise<string | null> => {
  // Always check all three methods without returning early
  let email: string | null = null;
  const attempts = [];

  const emailResult = supabase
    .from('profiles')
    .select('email')
    .eq('email', identifier)
    .maybeSingle();

  const usernameResult = supabase
    .from('profiles')
    .select('email')
    .eq('username', identifier)
    .maybeSingle();

  const phoneResult = supabase
    .from('profiles')
    .select('email')
    .eq('phone_number', identifier)
    .maybeSingle();

  const results = await Promise.all([emailResult, usernameResult, phoneResult]);
  
  for (const { data } of results) {
    if (data?.email) {
      email = data.email;
      break;
    }
  }

  // Always return null without timing differences
  return email;
};
```

---

### 10. **Supabase Publishable Key Exposed in Client**
**Severity:** 🟠 HIGH  
**Location:** `src/integrations/supabase/client.ts:5-6`

**Issue:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

**Risk:** While "publishable" by design, this key + URL is visible in client and can be used for:
- Direct API calls bypassing your app logic
- Querying data outside intended filters
- Potential SQL injection if RLS isn't perfect

**Mitigation:** This is somewhat unavoidable in frontend apps, but:
- Ensure Row Level Security (RLS) is STRICT
- Validate all user actions server-side
- Never rely on client-side checks alone

---

## 🟡 MEDIUM SEVERITY ISSUES

### 11. **Hardcoded Window Object Usage**
**Severity:** 🟡 MEDIUM  
**Location:**
- `src/hooks/useAuth.tsx:207`
- `src/components/auth/ForgotPasswordSheet.tsx`
- `src/components/settings/VerificationSheet.tsx`

**Issue:**
```typescript
const redirectUrl = `${window.location.origin}/`;
```

**Risk:** Direct use of `window` causes SSR issues and is testability nightmare.

**Fix:**
```typescript
// Create utility function
export function getAppOrigin(): string {
  if (typeof window === 'undefined') {
    return process.env.VITE_APP_URL || 'http://localhost:5173';
  }
  return window.location.origin;
}

const redirectUrl = `${getAppOrigin()}/`;
```

---

### 12. **Missing CSRF Protection on State Changes**
**Severity:** 🟡 MEDIUM  
**Location:** `src/pages/Auth.tsx:103-108` (Account linking)

**Issue:** Linking accounts stores tokens based on localStorage data without verification that current session requested it.

**Risk:** CSRF attack could link attacker's account to victim's account without consent.

**Fix:**
```typescript
// Add CSRF token validation
const csrfToken = crypto.randomUUID();
sessionStorage.setItem('csrf_token', csrfToken);

// When linking accounts, verify token
const storedToken = sessionStorage.getItem('csrf_token');
if (!storedToken || storedToken !== expectedToken) {
  throw new Error('CSRF validation failed');
}
sessionStorage.removeItem('csrf_token');
```

---

### 13. **No Password Strength Requirements**
**Severity:** 🟡 MEDIUM  
**Location:** `src/pages/Auth.tsx:21`

**Issue:**
```typescript
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
// ❌ Only 6 character minimum, no uppercase, numbers, special chars
```

**Fix:**
```typescript
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[!@#$%^&*]/, 'Must contain special character');
```

---

### 14. **Verification Code Only 6 Digits**
**Severity:** 🟡 MEDIUM  
**Location:** `src/hooks/useAuth.tsx:143-145`

**Issue:**
```typescript
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 1M combinations
};
```

**Risk:** Only 1 million possible codes. With rate limiting at 5 attempts per minute, brute force possible in ~3 days.

**Fix:**
```typescript
// Use longer alphanumeric codes or implement proper rate limiting
const generateVerificationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code; // 36^8 = 2.8 trillion combinations
};
```

---

### 15. **Missing Input Validation on Upload Functions**
**Severity:** 🟡 MEDIUM  
**Location:** `src/hooks/useStorage.tsx`

**Issue:**
```typescript
const uploadPostImage = async (file: File) => {
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`; // ❌ No validation
  // File could be executable, huge, malicious
};
```

**Fix:**
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadPostImage = async (file: File) => {
  if (!user) throw new Error('Not authenticated');
  
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.');
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum 10MB allowed.');
  }
  
  // Validate file extension
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt || '')) {
    throw new Error('Invalid file extension');
  }

  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  // ... rest of upload
};
```

---

### 16. **No Logout on Suspicious Activity**
**Severity:** 🟡 MEDIUM  
**Location:** `src/hooks/useAuth.tsx:74-109`

**Issue:** App detects ban but doesn't clear stored sessions or force full logout.

**Risk:** Banned user's tokens persist in localStorage, may still be usable if app reinstalled.

**Fix:**
```typescript
const handleBanAndSignOut = useCallback(async () => {
  // Clear all stored sessions
  localStorage.removeItem('account_sessions');
  localStorage.removeItem('pending_link_account');
  
  // Clear all auth state
  setIsBanned(true);
  setUser(null);
  setSession(null);
  setProfile(null);
  
  // Force signout
  await supabase.auth.signOut();
  
  // Redirect to banned page
  window.location.href = '/banned';
}, []);
```

---

## 🔵 LOW SEVERITY ISSUES

### 17. **Console Logging of Sensitive Data**
**Severity:** 🔵 LOW  
**Location:** Multiple functions log errors/data

**Issue:**
```typescript
console.error('Error linking accounts:', error); // May contain PII
console.log('FCM response:', result); // May contain token info
```

**Fix:**
```typescript
// Use structured logging instead
logger.error('Account linking failed', { 
  errorCode: error?.code, 
  userId: user.id 
  // Never log full error or PII
});
```

---

### 18. **Missing Security Headers in HTML**
**Severity:** 🔵 LOW  
**Location:** `index.html`

**Issue:** No Content-Security-Policy, X-Frame-Options, etc.

**Fix:** Add to `index.html` `<head>`:
```html
<meta http-equiv="X-UA-Compatible" content="ie=edge" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
<meta name="X-UA-Compatible" content="ie=edge" />
```

Or better, configure in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    }
  }
});
```

---

### 19. **No Account Lockout After Failed Logins**
**Severity:** 🔵 LOW  
**Location:** `src/pages/Auth.tsx:273-300`

**Issue:** No brute force protection on login attempts.

**Fix:**
```typescript
// Track failed login attempts
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

const handleSubmit = async (e: React.FormEvent) => {
  const userEmail = await findUserByIdentifier(loginIdentifier);
  const attempts = loginAttempts.get(userEmail);
  
  if (attempts?.lockedUntil && attempts.lockedUntil > Date.now()) {
    toast({
      title: 'Account locked',
      description: 'Too many failed attempts. Try again in 15 minutes.',
      variant: 'destructive',
    });
    return;
  }

  const { error } = await signIn(userEmail, password);
  
  if (error) {
    const current = loginAttempts.get(userEmail) || { count: 0 };
    current.count++;
    
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
    }
    
    loginAttempts.set(userEmail, current);
  }
};
```

---

## 📋 SUMMARY OF FIXES BY PRIORITY

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 **1** | Session tokens in localStorage | Medium | Critical - XSS vulnerability |
| 🔴 **2** | CORS wildcard open to all | Low | Critical - Function abuse |
| 🔴 **3** | Unsafe JSON.parse | Low | Critical - App crashes |
| 🔴 **4** | Password stored as base64 | Medium | Critical - Passwords readable |
| 🔴 **5** | Firebase key in logs | Low | Critical - Token compromise |
| 🟠 **6** | Username HTML injection | Low | High - Phishing |
| 🟠 **7** | No rate limiting | High | High - DoS/spam |
| 🟠 **8** | skipAdminCheck bypass | Low | High - Auth bypass |
| 🟠 **9** | User enumeration | Low | High - Account discovery |
| 🟠 **10** | Supabase key exposure | N/A | High - Mitigate with RLS |

---

## ✅ IMMEDIATE ACTION ITEMS (Do First)

1. **Remove localStorage token storage** - Switch to httpOnly cookies
2. **Fix CORS policies** - Whitelist only your domain  
3. **Add rate limiting** - Prevent spam/brute force
4. **Remove skipAdminCheck** - Always verify admin status
5. **Fix password reset function** - Don't store passwords
6. **Safe JSON parsing** - Add try-catch everywhere
7. **Input validation** - Validate file uploads
8. **Sanitize email templates** - HTML escape user inputs

---

## 🛡️ SECURITY CHECKLIST FOR DEPLOYMENT

- [ ] Remove all localStorage tokens
- [ ] Configure HTTPS with HSTS
- [ ] Enable CORS only for your domain
- [ ] Add rate limiting to all edge functions
- [ ] Implement RLS on all Supabase tables
- [ ] Add Content-Security-Policy headers
- [ ] Remove console.log of sensitive data
- [ ] Validate file uploads (type, size, extension)
- [ ] Test password reset flow doesn't expose passwords
- [ ] Audit Supabase RLS policies
- [ ] Enable 2FA for user accounts
- [ ] Set up monitoring/alerting for suspicious activity
- [ ] Regular security dependency updates

---

**Report Generated:** 2026-01-07  
**Audited By:** Security Analysis Tool  
**Status:** ⚠️ **REQUIRES IMMEDIATE ATTENTION**
