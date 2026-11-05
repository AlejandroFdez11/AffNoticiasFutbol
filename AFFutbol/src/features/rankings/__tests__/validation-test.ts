import {
  INVITE_CODE_LENGTH,
  normalizeInviteCode,
  normalizeLeagueName,
  validateInviteCode,
  validateLeagueName,
} from '../validation';

describe('normalizeLeagueName', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeLeagueName('  Los   del   curro  ')).toBe('Los del curro');
  });

  it('keeps accents and casing', () => {
    expect(normalizeLeagueName('Afición Atlética')).toBe('Afición Atlética');
  });
});

describe('validateLeagueName', () => {
  it('accepts names between 3 and 40 characters', () => {
    expect(validateLeagueName('Los del curro')).toBeNull();
    expect(validateLeagueName('ABC')).toBeNull();
    expect(validateLeagueName('a'.repeat(40))).toBeNull();
  });

  it('rejects names that are too short or too long', () => {
    expect(validateLeagueName('  AB  ')).toBe('El nombre debe tener al menos 3 caracteres.');
    expect(validateLeagueName('a'.repeat(41))).toBe(
      'El nombre no puede superar los 40 caracteres.'
    );
  });
});

describe('normalizeInviteCode', () => {
  it('uppercases, drops separators and caps the length', () => {
    expect(normalizeInviteCode('ab-c 12x9')).toBe('ABC12X');
    expect(normalizeInviteCode('abcdefgh')).toBe('ABCDEF');
    expect(normalizeInviteCode('abc12')).toBe('ABC12');
  });
});

describe('validateInviteCode', () => {
  it('accepts a full code after normalisation', () => {
    expect(validateInviteCode('ab c123')).toBeNull();
    expect('ABC123').toHaveLength(INVITE_CODE_LENGTH);
  });

  it('rejects incomplete codes', () => {
    expect(validateInviteCode('ABC')).toBe('El código de invitación tiene 6 caracteres.');
    expect(validateInviteCode('')).toBe('El código de invitación tiene 6 caracteres.');
  });
});
