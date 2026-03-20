import { APP_CONFIG } from '../../src/constants';

// Pure filtering logic extracted from the DB function get_compatible_profiles
// and the client-side fallback in matchStore.fetchDiscoverProfiles

interface MockProfile {
  id: string;
  first_name: string;
  birth_date: string;
  gender: string;
  looking_for: string[];
  height_cm: number;
  ethnicity: string;
  religion: string;
  offspring: string;
  smoker: string;
  alcohol: string;
  drugs: string;
  diet: string;
  income: string;
  is_active: boolean;
  is_paused: boolean;
  is_deleted: boolean;
  main_photo_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface MockDealBreakers {
  min_age?: number | null;
  max_age?: number | null;
  min_height?: number | null;
  max_height?: number | null;
  max_distance?: number | null;
  acceptable_ethnicities?: string[] | null;
  acceptable_religions?: string[] | null;
  acceptable_offspring?: string[] | null;
  acceptable_smoker?: string[] | null;
  acceptable_alcohol?: string[] | null;
  acceptable_drugs?: string[] | null;
  acceptable_diets?: string[] | null;
  acceptable_income?: string[] | null;
}

// Helper: calculate age from birth_date
const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Haversine distance in miles (matches DB function)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Filtering function that mirrors get_compatible_profiles logic
const filterCompatibleProfiles = (
  currentUser: { id: string; gender: string; looking_for: string[]; location_lat: number | null; location_lng: number | null },
  profiles: MockProfile[],
  dealBreakers: MockDealBreakers,
  swipedIds: string[],
  blockedIds: string[],
): MockProfile[] => {
  return profiles.filter((p) => {
    // Not current user
    if (p.id === currentUser.id) return false;
    // Active, not paused, not deleted
    if (!p.is_active || p.is_paused || p.is_deleted) return false;
    // Must have photo
    if (!p.main_photo_url) return false;
    // Not already swiped
    if (swipedIds.includes(p.id)) return false;
    // Not blocked
    if (blockedIds.includes(p.id)) return false;

    // Gender compatibility (bidirectional)
    if (!currentUser.looking_for.includes(p.gender)) return false;
    if (!p.looking_for.includes(currentUser.gender)) return false;

    // Deal breakers
    const age = calculateAge(p.birth_date);
    if (dealBreakers.min_age != null && age < dealBreakers.min_age) return false;
    if (dealBreakers.max_age != null && age > dealBreakers.max_age) return false;
    if (dealBreakers.min_height != null && p.height_cm < dealBreakers.min_height) return false;
    if (dealBreakers.max_height != null && p.height_cm > dealBreakers.max_height) return false;

    // Distance
    if (dealBreakers.max_distance != null && currentUser.location_lat != null && currentUser.location_lng != null && p.location_lat != null && p.location_lng != null) {
      const dist = calculateDistance(currentUser.location_lat, currentUser.location_lng, p.location_lat, p.location_lng);
      if (dist > dealBreakers.max_distance) return false;
    }

    // Attribute filters
    if (dealBreakers.acceptable_ethnicities != null && !dealBreakers.acceptable_ethnicities.includes(p.ethnicity)) return false;
    if (dealBreakers.acceptable_religions != null && !dealBreakers.acceptable_religions.includes(p.religion)) return false;
    if (dealBreakers.acceptable_offspring != null && !dealBreakers.acceptable_offspring.includes(p.offspring)) return false;
    if (dealBreakers.acceptable_smoker != null && !dealBreakers.acceptable_smoker.includes(p.smoker)) return false;
    if (dealBreakers.acceptable_alcohol != null && !dealBreakers.acceptable_alcohol.includes(p.alcohol)) return false;
    if (dealBreakers.acceptable_drugs != null && !dealBreakers.acceptable_drugs.includes(p.drugs)) return false;
    if (dealBreakers.acceptable_diets != null && !dealBreakers.acceptable_diets.includes(p.diet)) return false;
    if (dealBreakers.acceptable_income != null && !dealBreakers.acceptable_income.includes(p.income)) return false;

    return true;
  });
};

// ============================================================
// Test data factories
// ============================================================

const makeProfile = (overrides: Partial<MockProfile> = {}): MockProfile => ({
  id: 'candidate-1',
  first_name: 'Alice',
  birth_date: '1996-06-15', // ~29 years old
  gender: 'female',
  looking_for: ['male'],
  height_cm: 165,
  ethnicity: 'white',
  religion: 'none',
  offspring: 'none',
  smoker: 'never',
  alcohol: 'sometimes',
  drugs: 'never',
  diet: 'omnivore',
  income: '50k-75k',
  is_active: true,
  is_paused: false,
  is_deleted: false,
  main_photo_url: 'https://example.com/photo.jpg',
  location_lat: 37.78,
  location_lng: -122.42,
  ...overrides,
});

const currentUser = {
  id: 'user-1',
  gender: 'male',
  looking_for: ['female'],
  location_lat: 37.77,
  location_lng: -122.41,
};

const noDealBreakers: MockDealBreakers = {};

// ============================================================
// Tests
// ============================================================

describe('Match Filtering Logic', () => {
  describe('Basic eligibility', () => {
    it('excludes current user from results', () => {
      const profiles = [makeProfile({ id: 'user-1' })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('excludes inactive profiles', () => {
      const profiles = [makeProfile({ is_active: false })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('excludes paused profiles', () => {
      const profiles = [makeProfile({ is_paused: true })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('excludes deleted profiles', () => {
      const profiles = [makeProfile({ is_deleted: true })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('excludes profiles without a main photo', () => {
      const profiles = [makeProfile({ main_photo_url: null })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('includes eligible profiles', () => {
      const profiles = [makeProfile()];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(1);
    });
  });

  describe('Exclusion lists', () => {
    it('excludes already swiped profiles', () => {
      const profiles = [makeProfile({ id: 'swiped-user' })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, ['swiped-user'], [])).toHaveLength(0);
    });

    it('excludes blocked profiles', () => {
      const profiles = [makeProfile({ id: 'blocked-user' })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], ['blocked-user'])).toHaveLength(0);
    });

    it('includes profiles not in exclusion lists', () => {
      const profiles = [makeProfile({ id: 'new-user' })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, ['other'], ['other2'])).toHaveLength(1);
    });
  });

  describe('Gender compatibility', () => {
    it('includes when both users are looking for each other', () => {
      const profiles = [makeProfile({ gender: 'female', looking_for: ['male'] })];
      const user = { ...currentUser, gender: 'male', looking_for: ['female'] };
      expect(filterCompatibleProfiles(user, profiles, noDealBreakers, [], [])).toHaveLength(1);
    });

    it('excludes when current user is not looking for candidate gender', () => {
      const profiles = [makeProfile({ gender: 'female', looking_for: ['male'] })];
      const user = { ...currentUser, gender: 'male', looking_for: ['male'] }; // looking for male, not female
      expect(filterCompatibleProfiles(user, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('excludes when candidate is not looking for current user gender', () => {
      const profiles = [makeProfile({ gender: 'female', looking_for: ['female'] })]; // looking for female, not male
      const user = { ...currentUser, gender: 'male', looking_for: ['female'] };
      expect(filterCompatibleProfiles(user, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });

    it('supports "Everyone" preference (multi-gender)', () => {
      const profiles = [
        makeProfile({ id: 'f1', gender: 'female', looking_for: ['male', 'female', 'non-binary'] }),
        makeProfile({ id: 'm1', gender: 'male', looking_for: ['male', 'female', 'non-binary'] }),
        makeProfile({ id: 'nb1', gender: 'non-binary', looking_for: ['male', 'female', 'non-binary'] }),
      ];
      const user = { ...currentUser, gender: 'male', looking_for: ['male', 'female', 'non-binary'] };
      expect(filterCompatibleProfiles(user, profiles, noDealBreakers, [], [])).toHaveLength(3);
    });

    it('asymmetric: user wants female but female only wants female → excluded', () => {
      const profiles = [makeProfile({ gender: 'female', looking_for: ['female'] })];
      const user = { ...currentUser, gender: 'male', looking_for: ['female'] };
      expect(filterCompatibleProfiles(user, profiles, noDealBreakers, [], [])).toHaveLength(0);
    });
  });

  describe('Age filtering', () => {
    // birth_date '1996-06-15' → ~29 years old
    it('includes profile within age range', () => {
      const profiles = [makeProfile()];
      const db: MockDealBreakers = { min_age: 25, max_age: 35 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
    });

    it('excludes profile below min_age', () => {
      const profiles = [makeProfile({ birth_date: '2005-01-01' })]; // ~21
      const db: MockDealBreakers = { min_age: 25 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(0);
    });

    it('excludes profile above max_age', () => {
      const profiles = [makeProfile({ birth_date: '1980-01-01' })]; // ~46
      const db: MockDealBreakers = { max_age: 40 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(0);
    });

    it('includes all ages when no age filters set', () => {
      const profiles = [
        makeProfile({ id: 'young', birth_date: '2004-01-01' }),
        makeProfile({ id: 'old', birth_date: '1975-01-01' }),
      ];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(2);
    });

    it('boundary: includes profile at exact min_age', () => {
      const age = calculateAge('1996-06-15');
      const profiles = [makeProfile()];
      const db: MockDealBreakers = { min_age: age };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
    });

    it('boundary: includes profile at exact max_age', () => {
      const age = calculateAge('1996-06-15');
      const profiles = [makeProfile()];
      const db: MockDealBreakers = { max_age: age };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
    });
  });

  describe('Height filtering', () => {
    it('includes profile within height range', () => {
      const profiles = [makeProfile({ height_cm: 170 })];
      const db: MockDealBreakers = { min_height: 160, max_height: 180 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
    });

    it('excludes profile below min_height', () => {
      const profiles = [makeProfile({ height_cm: 150 })];
      const db: MockDealBreakers = { min_height: 160 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(0);
    });

    it('excludes profile above max_height', () => {
      const profiles = [makeProfile({ height_cm: 200 })];
      const db: MockDealBreakers = { max_height: 190 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(0);
    });

    it('includes all heights when no filters set', () => {
      const profiles = [
        makeProfile({ id: 'short', height_cm: 140 }),
        makeProfile({ id: 'tall', height_cm: 210 }),
      ];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(2);
    });
  });

  describe('Distance filtering', () => {
    it('includes profiles within max_distance', () => {
      // Same city — very close
      const profiles = [makeProfile({ location_lat: 37.78, location_lng: -122.42 })];
      const db: MockDealBreakers = { max_distance: 25 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
    });

    it('excludes profiles beyond max_distance', () => {
      // LA vs SF — ~350 miles
      const profiles = [makeProfile({ location_lat: 34.05, location_lng: -118.24 })];
      const db: MockDealBreakers = { max_distance: 25 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(0);
    });

    it('includes all distances when max_distance is null', () => {
      const profiles = [makeProfile({ location_lat: 34.05, location_lng: -118.24 })];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(1);
    });

    it('skips distance check when candidate has no location', () => {
      const profiles = [makeProfile({ location_lat: null, location_lng: null })];
      const db: MockDealBreakers = { max_distance: 5 };
      expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
    });

    it('skips distance check when current user has no location', () => {
      const user = { ...currentUser, location_lat: null, location_lng: null };
      const profiles = [makeProfile()];
      const db: MockDealBreakers = { max_distance: 5 };
      expect(filterCompatibleProfiles(user, profiles, db, [], [])).toHaveLength(1);
    });
  });

  describe('Attribute filtering', () => {
    const attributeTests: Array<{
      field: keyof MockDealBreakers;
      profileField: keyof MockProfile;
      accept: string;
      reject: string;
    }> = [
      { field: 'acceptable_ethnicities', profileField: 'ethnicity', accept: 'white', reject: 'asian' },
      { field: 'acceptable_religions', profileField: 'religion', accept: 'none', reject: 'christian' },
      { field: 'acceptable_offspring', profileField: 'offspring', accept: 'none', reject: 'has_children' },
      { field: 'acceptable_smoker', profileField: 'smoker', accept: 'never', reject: 'daily' },
      { field: 'acceptable_alcohol', profileField: 'alcohol', accept: 'sometimes', reject: 'daily' },
      { field: 'acceptable_drugs', profileField: 'drugs', accept: 'never', reject: 'often' },
      { field: 'acceptable_diets', profileField: 'diet', accept: 'omnivore', reject: 'vegan' },
      { field: 'acceptable_income', profileField: 'income', accept: '50k-75k', reject: '200k+' },
    ];

    attributeTests.forEach(({ field, profileField, accept, reject }) => {
      it(`${field}: includes when candidate value is in acceptable list`, () => {
        const profiles = [makeProfile()];
        const db: MockDealBreakers = { [field]: [accept] };
        expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(1);
      });

      it(`${field}: excludes when candidate value is NOT in acceptable list`, () => {
        const profiles = [makeProfile({ [profileField]: reject } as any)];
        const db: MockDealBreakers = { [field]: [accept] };
        expect(filterCompatibleProfiles(currentUser, profiles, db, [], [])).toHaveLength(0);
      });

      it(`${field}: includes all when filter is null`, () => {
        const profiles = [makeProfile({ [profileField]: reject } as any)];
        expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(1);
      });
    });
  });

  describe('Combined filters', () => {
    it('applies all filters together — only matching profiles pass', () => {
      const profiles = [
        makeProfile({ id: 'match', height_cm: 170, ethnicity: 'white' }),
        makeProfile({ id: 'too-short', height_cm: 140, ethnicity: 'white' }),
        makeProfile({ id: 'wrong-ethnicity', height_cm: 170, ethnicity: 'asian' }),
        makeProfile({ id: 'inactive', height_cm: 170, ethnicity: 'white', is_active: false }),
        makeProfile({ id: 'no-photo', height_cm: 170, ethnicity: 'white', main_photo_url: null }),
      ];
      const db: MockDealBreakers = {
        min_height: 160,
        acceptable_ethnicities: ['white'],
      };
      const result = filterCompatibleProfiles(currentUser, profiles, db, [], []);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('match');
    });

    it('all filters null → only basic eligibility matters', () => {
      const profiles = [
        makeProfile({ id: 'a' }),
        makeProfile({ id: 'b' }),
        makeProfile({ id: 'c' }),
      ];
      expect(filterCompatibleProfiles(currentUser, profiles, noDealBreakers, [], [])).toHaveLength(3);
    });
  });
});

describe('calculateDistance', () => {
  it('returns 0 for same point', () => {
    expect(calculateDistance(37.77, -122.41, 37.77, -122.41)).toBe(0);
  });

  it('SF to LA is approximately 347 miles', () => {
    const dist = calculateDistance(37.77, -122.42, 34.05, -118.24);
    expect(dist).toBeGreaterThan(340);
    expect(dist).toBeLessThan(360);
  });

  it('short distance within a city is under 5 miles', () => {
    const dist = calculateDistance(37.77, -122.41, 37.78, -122.42);
    expect(dist).toBeLessThan(5);
  });
});
