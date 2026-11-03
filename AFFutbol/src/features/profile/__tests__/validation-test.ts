import { hasProfileFormErrors, normalizeUsername, validateProfileForm } from '../validation';

describe('profile validation', () => {
  it('normalizes usernames', () => {
    expect(normalizeUsername('  @Ale_Fan ')).toBe('ale_fan');
  });

  it('accepts a valid username', () => {
    expect(hasProfileFormErrors(validateProfileForm('Ale', 'ale_fan'))).toBe(false);
  });

  it('rejects short or invalid usernames', () => {
    expect(validateProfileForm('', 'ab').username).toContain('3 y 20');
    expect(validateProfileForm('', 'ale fan').username).toContain('3 y 20');
  });

  it('rejects long display names', () => {
    expect(validateProfileForm('a'.repeat(41), '').displayName).toContain('40');
  });
});
