import { firstName, greetingFor, initials } from '@/utils/greeting';
import { validateEmail, validateName, validateNewPassword } from '@/utils/validation';

describe('greeting', () => {
  it.each([
    [7, 'Good morning'],
    [13, 'Good afternoon'],
    [20, 'Good evening'],
    [2, 'Good evening'],
  ])('at %i:00 says %s', (hour, expected) => {
    expect(greetingFor(new Date(2026, 0, 1, hour))).toBe(expected);
  });

  it('derives first names and initials', () => {
    expect(firstName('  Ada   Lovelace ')).toBe('Ada');
    expect(initials('Ada King Lovelace')).toBe('AL');
    expect(initials('ada')).toBe('A');
    expect(initials('')).toBe('?');
    expect(initials(null)).toBe('?');
  });
});

describe('validation', () => {
  it('validates emails', () => {
    expect(validateEmail('')).toBeDefined();
    expect(validateEmail('nope')).toBeDefined();
    expect(validateEmail(' ada@example.com ')).toBeUndefined();
  });

  it('mirrors backend password rules', () => {
    expect(validateNewPassword('short1')).toBeDefined();
    expect(validateNewPassword('onlyletters')).toBeDefined();
    expect(validateNewPassword('12345678')).toBeDefined();
    expect(validateNewPassword(' padded1a')).toBeDefined();
    expect(validateNewPassword('correct-horse-9')).toBeUndefined();
  });

  it('validates names', () => {
    expect(validateName('   ')).toBeDefined();
    expect(validateName('Ada')).toBeUndefined();
  });
});
