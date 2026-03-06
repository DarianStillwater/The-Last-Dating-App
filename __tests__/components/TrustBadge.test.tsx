import React from 'react';
import { render } from '@testing-library/react-native';

// Mock @expo/vector-icons to avoid native module issues in tests
jest.mock('@expo/vector-icons', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: Record<string, unknown>) => mockReact.createElement(View, { testID: `icon-${props.name}` }),
  };
});

import TrustBadge from '../../src/components/ui/TrustBadge';

describe('TrustBadge', () => {
  it('returns null for 0 vouches and 0 reviews', () => {
    const { toJSON } = render(
      <TrustBadge vouchCount={0} reviewCount={0} showLabel />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders Taking Root for 1 vouch and 1 review', () => {
    const { getByText } = render(
      <TrustBadge vouchCount={1} reviewCount={1} showLabel />
    );
    expect(getByText('Taking Root')).toBeTruthy();
  });

  it('renders Growing Strong for 3 vouches and 3 reviews', () => {
    const { getByText } = render(
      <TrustBadge vouchCount={3} reviewCount={3} showLabel />
    );
    expect(getByText('Growing Strong')).toBeTruthy();
  });

  it('renders Deep Roots for 5+ vouches and 5+ reviews', () => {
    const { getByText } = render(
      <TrustBadge vouchCount={5} reviewCount={5} showLabel />
    );
    expect(getByText('Deep Roots')).toBeTruthy();
  });

  it('renders without label when showLabel is false', () => {
    const { queryByText } = render(
      <TrustBadge vouchCount={3} reviewCount={3} />
    );
    expect(queryByText('Growing Strong')).toBeNull();
  });
});
