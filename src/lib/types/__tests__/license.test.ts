import { LicenseHelper, LicenseLevel } from '../license';

describe('LicenseHelper', () => {
  describe('normalize', () => {
    it('should normalize iRacing license_group numbers', () => {
      expect(LicenseHelper.normalize(1)).toBe(LicenseLevel.ROOKIE);
      expect(LicenseHelper.normalize(2)).toBe(LicenseLevel.D);
      expect(LicenseHelper.normalize(3)).toBe(LicenseLevel.C);
      expect(LicenseHelper.normalize(4)).toBe(LicenseLevel.B);
      expect(LicenseHelper.normalize(5)).toBe(LicenseLevel.A);
      expect(LicenseHelper.normalize(6)).toBe(LicenseLevel.PRO);
    });

    it('should normalize string inputs', () => {
      expect(LicenseHelper.normalize('rookie')).toBe(LicenseLevel.ROOKIE);
      expect(LicenseHelper.normalize('ROOKIE')).toBe(LicenseLevel.ROOKIE);
      expect(LicenseHelper.normalize('d')).toBe(LicenseLevel.D);
      expect(LicenseHelper.normalize('D')).toBe(LicenseLevel.D);
      expect(LicenseHelper.normalize('class d')).toBe(LicenseLevel.D);
      expect(LicenseHelper.normalize('pro')).toBe(LicenseLevel.PRO);
      expect(LicenseHelper.normalize('professional')).toBe(LicenseLevel.PRO);
    });

    it('should handle edge cases', () => {
      expect(LicenseHelper.normalize(null)).toBe(LicenseLevel.ROOKIE);
      expect(LicenseHelper.normalize(undefined)).toBe(LicenseLevel.ROOKIE);
      expect(LicenseHelper.normalize('')).toBe(LicenseLevel.ROOKIE);
      expect(LicenseHelper.normalize('invalid')).toBe(LicenseLevel.ROOKIE);
    });
  });

  describe('fromIRacingGroup', () => {
    it('should convert iRacing license groups correctly', () => {
      expect(LicenseHelper.fromIRacingGroup(3)).toBe(LicenseLevel.C);
      expect(LicenseHelper.fromIRacingGroup(99)).toBe(LicenseLevel.ROOKIE); // Invalid
    });
  });

  describe('toIRacingGroup', () => {
    it('should convert to iRacing license groups', () => {
      expect(LicenseHelper.toIRacingGroup(LicenseLevel.C)).toBe(3);
      expect(LicenseHelper.toIRacingGroup(LicenseLevel.PRO)).toBe(6);
    });
  });

  describe('meetsRequirement', () => {
    it('should check license requirements correctly', () => {
      expect(LicenseHelper.meetsRequirement(LicenseLevel.C, LicenseLevel.D)).toBe(true);
      expect(LicenseHelper.meetsRequirement(LicenseLevel.D, LicenseLevel.C)).toBe(false);
      expect(LicenseHelper.meetsRequirement(LicenseLevel.B, LicenseLevel.B)).toBe(true);
    });
  });

  describe('compare', () => {
    it('should compare license levels correctly', () => {
      expect(LicenseHelper.compare(LicenseLevel.D, LicenseLevel.C)).toBe(-1);
      expect(LicenseHelper.compare(LicenseLevel.C, LicenseLevel.D)).toBe(1);
      expect(LicenseHelper.compare(LicenseLevel.B, LicenseLevel.B)).toBe(0);
    });
  });

  describe('getNumericValue', () => {
    it('should return correct hierarchy values', () => {
      expect(LicenseHelper.getNumericValue(LicenseLevel.ROOKIE)).toBe(0);
      expect(LicenseHelper.getNumericValue(LicenseLevel.D)).toBe(1);
      expect(LicenseHelper.getNumericValue(LicenseLevel.C)).toBe(2);
      expect(LicenseHelper.getNumericValue(LicenseLevel.B)).toBe(3);
      expect(LicenseHelper.getNumericValue(LicenseLevel.A)).toBe(4);
      expect(LicenseHelper.getNumericValue(LicenseLevel.PRO)).toBe(5);
    });
  });
});