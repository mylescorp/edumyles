import { query } from "../../_generated/server";
import { v } from "convex/values";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
  maxLength?: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: [
    "password",
    "123456",
    "qwerty",
    "admin",
    "edumyles",
  ],
  maxLength: 128,
};

export const getPasswordPolicy = query({
  args: {},
  handler: async (ctx) => {
    // Try to get policy from platform settings, fall back to defaults
    const settings = await ctx.db
      .query("platformSettings")
      .withIndex("by_section_key", (q) => 
        q.eq("section", "security")
      )
      .collect();

    const policy = { ...DEFAULT_POLICY };
    
    // Override with settings if available
    settings.forEach(setting => {
      switch (setting.key) {
        case "passwordMinLength":
          policy.minLength = parseInt(setting.value) || DEFAULT_POLICY.minLength;
          break;
        case "passwordRequireUppercase":
          policy.requireUppercase = setting.value === "true";
          break;
        case "passwordRequireLowercase":
          policy.requireLowercase = setting.value === "true";
          break;
        case "passwordRequireNumbers":
          policy.requireNumbers = setting.value === "true";
          break;
        case "passwordRequireSpecialChars":
          policy.requireSpecialChars = setting.value === "true";
          break;
        case "passwordMaxLength":
          policy.maxLength = parseInt(setting.value) || DEFAULT_POLICY.maxLength;
          break;
      }
    });

    return policy;
  },
});

export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_POLICY): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else {
    score += Math.min(password.length * 2, 20);
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character type checks
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (/[A-Z]/.test(password)) {
    score += 10;
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (/[a-z]/.test(password)) {
    score += 10;
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (/\d/.test(password)) {
    score += 10;
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // Forbidden patterns check
  const lowerPassword = password.toLowerCase();
  for (const pattern of policy.forbiddenPatterns) {
    if (lowerPassword.includes(pattern)) {
      errors.push(`Password cannot contain common patterns like "${pattern}"`);
      score -= 10;
    }
  }

  // Additional strength checks
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password cannot contain repeated characters");
    score -= 10;
  }

  // Determine strength
  let strength: "weak" | "fair" | "good" | "strong" = "weak";
  if (score >= 40) strength = "strong";
  else if (score >= 30) strength = "good";
  else if (score >= 20) strength = "fair";

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export function getPasswordStrengthIndicator(strength: string): {
  color: string;
  text: string;
  width: string;
} {
  switch (strength) {
    case "strong":
      return {
        color: "bg-green-500",
        text: "Strong",
        width: "w-full",
      };
    case "good":
      return {
        color: "bg-blue-500",
        text: "Good",
        width: "w-3/4",
      };
    case "fair":
      return {
        color: "bg-yellow-500",
        text: "Fair",
        width: "w-2/4",
      };
    default:
      return {
        color: "bg-red-500",
        text: "Weak",
        width: "w-1/4",
      };
  }
}
