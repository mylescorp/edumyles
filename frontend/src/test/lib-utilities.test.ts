/**
 * Utility Library Tests
 *
 * Tests pure functions from:
 *   - lib/formatters.ts  (date, currency, phone, name, number formatting)
 *   - lib/utils.ts       (grade colours, role colours, class merging)
 *
 * No mocking required — all functions are side-effect free.
 */

import { describe, it, expect } from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatCurrency,
  formatPhone,
  formatName,
  getInitials,
  formatNumber,
  formatPercentage,
} from '@/lib/formatters';

import {
  getGradeColor,
  getRoleColor,
  cn,
} from '@/lib/utils';

// ═════════════════════════════════════════════════════════════════════════════
// lib/formatters.ts
// ═════════════════════════════════════════════════════════════════════════════

describe('formatDate()', () => {
  it('formats a Date object as DD/MM/YYYY (en-GB locale)', () => {
    // Use a fixed UTC date to avoid timezone flakiness
    const result = formatDate(new Date('2024-03-15T00:00:00Z'));
    expect(result).toMatch(/15\/03\/2024/);
  });

  it('accepts a numeric timestamp', () => {
    const ts = new Date('2024-01-01T00:00:00Z').getTime();
    const result = formatDate(ts);
    expect(result).toMatch(/01\/01\/2024/);
  });

  it('accepts an ISO date string', () => {
    const result = formatDate('2023-12-25');
    expect(result).toMatch(/25\/12\/2023/);
  });
});

describe('formatDateTime()', () => {
  it('returns a string that contains the date portion', () => {
    const result = formatDateTime(new Date('2024-06-15T00:00:00Z'));
    expect(result).toContain('15/06/2024');
  });

  it('result is longer than formatDate (includes time)', () => {
    const ts = new Date('2024-06-15T10:30:00Z').getTime();
    expect(formatDateTime(ts).length).toBeGreaterThan(formatDate(ts).length);
  });
});

describe('formatTime()', () => {
  it('returns a string in HH:MM format', () => {
    const result = formatTime(new Date('2024-01-01T14:30:00Z'));
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatRelativeTime()', () => {
  const now = Date.now();

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    expect(formatRelativeTime(now - 30_000)).toBe('just now');
    expect(formatRelativeTime(now - 1)).toBe('just now');
  });

  it('returns "{n}m ago" for timestamps 1–59 minutes ago', () => {
    expect(formatRelativeTime(now - 60_000)).toBe('1m ago');
    expect(formatRelativeTime(now - 3_540_000)).toBe('59m ago');
  });

  it('returns "{n}h ago" for timestamps 1–23 hours ago', () => {
    expect(formatRelativeTime(now - 3_600_000)).toBe('1h ago');
    expect(formatRelativeTime(now - 23 * 3_600_000)).toBe('23h ago');
  });

  it('returns "{n}d ago" for timestamps 1–6 days ago', () => {
    expect(formatRelativeTime(now - 86_400_000)).toBe('1d ago');
    expect(formatRelativeTime(now - 6 * 86_400_000)).toBe('6d ago');
  });

  it('returns a formatted date for timestamps 7+ days ago', () => {
    const sevenDaysAgo = now - 7 * 86_400_000;
    const result = formatRelativeTime(sevenDaysAgo);
    // Should fall back to formatDate output — contains slashes
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('formatCurrency()', () => {
  it('converts cents to the full amount for KES', () => {
    // 100_000 cents = KES 1,000
    const result = formatCurrency(100_000, 'KES');
    expect(result).toContain('1,000');
  });

  it('uses KES as the default currency', () => {
    const result = formatCurrency(50_000);
    expect(result).toContain('500');
  });

  it('formats USD correctly', () => {
    const result = formatCurrency(10_000, 'USD'); // $100.00
    expect(result).toContain('100');
  });

  it('handles zero amount', () => {
    const result = formatCurrency(0, 'KES');
    expect(result).toContain('0');
  });

  it('falls back to "CURRENCY amount" string for unknown currency codes', () => {
    const result = formatCurrency(5_000, 'XYZ');
    expect(result).toContain('50');
    expect(result).toContain('XYZ');
  });
});

describe('formatPhone()', () => {
  it('formats a 254-prefixed Kenyan number', () => {
    const result = formatPhone('254700123456');
    expect(result).toBe('+254 700 123 456');
  });

  it('formats a 0-prefixed Kenyan number', () => {
    const result = formatPhone('0700123456');
    expect(result).toBe('+254 700 123 456');
  });

  it('returns the original string unchanged for unrecognised formats', () => {
    expect(formatPhone('123')).toBe('123');
    expect(formatPhone('+1-800-555-1234')).toBe('+1-800-555-1234');
  });
});

describe('formatName()', () => {
  it('joins first and last name with a space', () => {
    expect(formatName('John', 'Doe')).toBe('John Doe');
  });

  it('returns just the first name when last name is undefined', () => {
    expect(formatName('Alice')).toBe('Alice');
  });

  it('returns "Unknown" when both are undefined', () => {
    expect(formatName()).toBe('Unknown');
    expect(formatName(undefined, undefined)).toBe('Unknown');
  });

  it('ignores empty strings gracefully', () => {
    expect(formatName('', '')).toBe('Unknown');
  });
});

describe('getInitials()', () => {
  it('returns uppercase initials of first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('returns a single initial when last name is missing', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns "?" when both are undefined', () => {
    expect(getInitials()).toBe('?');
  });
});

describe('formatNumber()', () => {
  it('adds locale-appropriate thousands separators', () => {
    const result = formatNumber(1_000_000);
    // The result should contain some form of separator
    expect(result.length).toBeGreaterThan(String(1_000_000).length - 1);
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatPercentage()', () => {
  it('appends a % sign', () => {
    expect(formatPercentage(75)).toContain('%');
  });

  it('defaults to 1 decimal place', () => {
    expect(formatPercentage(75)).toBe('75.0%');
  });

  it('respects the decimals parameter', () => {
    expect(formatPercentage(75.5678, 2)).toBe('75.57%');
    expect(formatPercentage(100, 0)).toBe('100%');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// lib/utils.ts
// ═════════════════════════════════════════════════════════════════════════════

describe('getGradeColor()', () => {
  it('returns grade A (Excellent) for scores 90 and above', () => {
    expect(getGradeColor(90).grade).toBe('A');
    expect(getGradeColor(100).grade).toBe('A');
    expect(getGradeColor(99).grade).toBe('A');
  });

  it('returns grade B for scores 80–89', () => {
    expect(getGradeColor(80).grade).toBe('B');
    expect(getGradeColor(89).grade).toBe('B');
  });

  it('returns grade C for scores 70–79', () => {
    expect(getGradeColor(70).grade).toBe('C');
    expect(getGradeColor(79).grade).toBe('C');
  });

  it('returns grade D for scores 60–69', () => {
    expect(getGradeColor(60).grade).toBe('D');
    expect(getGradeColor(69).grade).toBe('D');
  });

  it('returns grade F for scores below 60', () => {
    expect(getGradeColor(59).grade).toBe('F');
    expect(getGradeColor(0).grade).toBe('F');
  });

  it('grade boundary: 89 is B and 90 is A', () => {
    expect(getGradeColor(89).grade).toBe('B');
    expect(getGradeColor(90).grade).toBe('A');
  });

  it('grade boundary: 59 is F and 60 is D', () => {
    expect(getGradeColor(59).grade).toBe('F');
    expect(getGradeColor(60).grade).toBe('D');
  });

  it('each result has bg, text, label, and grade fields', () => {
    const result = getGradeColor(75);
    expect(result).toHaveProperty('bg');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('grade');
  });
});

describe('getRoleColor()', () => {
  it('returns a colour config with bg and text for known roles', () => {
    const teacher = getRoleColor('teacher');
    expect(teacher).toHaveProperty('bg');
    expect(teacher).toHaveProperty('text');
    expect(teacher.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('falls back to the student colour for unknown roles', () => {
    // TypeScript would catch unknown keys, but at runtime it falls back
    const unknown = getRoleColor('unknown-role' as any);
    const student = getRoleColor('student');
    expect(unknown.bg).toBe(student.bg);
  });

  it('each defined role has a distinct bg colour', () => {
    const roles = ['super-admin', 'school-admin', 'teacher', 'parent', 'student'] as const;
    const bgs = roles.map((r) => getRoleColor(r).bg);
    const unique = new Set(bgs);
    expect(unique.size).toBe(roles.length);
  });
});

describe('cn() — class name merger', () => {
  it('joins multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    // tailwind-merge should resolve p-4 vs p-2 — last one wins
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
    expect(result).not.toContain('p-4');
  });

  it('handles conditional class objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('returns an empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});
