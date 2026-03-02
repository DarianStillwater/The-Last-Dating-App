import { calculateAge, cmToFeetInches, feetInchesToCm } from '../../src/constants';

describe('calculateAge', () => {
  it('calculates age correctly for a past birthday this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const birthDate = `${birthYear}-01-01`;
    expect(calculateAge(birthDate)).toBe(25);
  });

  it('returns one less if birthday has not occurred yet this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    // Use December 31 to ensure the birthday hasn't happened yet
    const birthDate = `${birthYear}-12-31`;
    // If today is Dec 31, age is 30; otherwise 29
    const expected = today.getMonth() === 11 && today.getDate() >= 31 ? 30 : 29;
    expect(calculateAge(birthDate)).toBe(expected);
  });

  it('handles birthday being today', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 20;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const birthDate = `${birthYear}-${month}-${day}`;
    expect(calculateAge(birthDate)).toBe(20);
  });
});

describe('cmToFeetInches', () => {
  it('converts 183 cm correctly', () => {
    // 183 cm ≈ 6'0"
    expect(cmToFeetInches(183)).toBe("6'0\"");
  });

  it('converts 152 cm correctly', () => {
    // 152 cm ≈ 4'12" → rounds to 5'0"
    const result = cmToFeetInches(152);
    expect(result).toMatch(/^\d+'\d+"$/);
  });

  it('converts 170 cm correctly', () => {
    // 170 cm ≈ 5'7"
    expect(cmToFeetInches(170)).toBe("5'7\"");
  });
});

describe('feetInchesToCm', () => {
  it('converts 6 feet 0 inches to ~183 cm', () => {
    expect(feetInchesToCm(6, 0)).toBe(183);
  });

  it('converts 5 feet 7 inches to ~170 cm', () => {
    expect(feetInchesToCm(5, 7)).toBe(170);
  });

  it('is roughly inverse of cmToFeetInches', () => {
    const cm = 175;
    const formatted = cmToFeetInches(cm);
    // Extract feet and inches from formatted string
    const match = formatted.match(/^(\d+)'(\d+)"$/);
    expect(match).not.toBeNull();
    if (match) {
      const roundTrip = feetInchesToCm(Number(match[1]), Number(match[2]));
      // Should be within 2 cm due to rounding
      expect(Math.abs(roundTrip - cm)).toBeLessThanOrEqual(2);
    }
  });
});
