import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/ui/Button';

describe('Button', () => {
  it('renders the title text', () => {
    const { getByText } = render(
      <Button title="Press Me" onPress={() => {}} />
    );
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Tap" onPress={onPress} />
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator instead of title when loading', () => {
    const { queryByText } = render(
      <Button title="Submit" onPress={() => {}} loading />
    );
    expect(queryByText('Submit')).toBeNull();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { root } = render(
      <Button title="Loading" onPress={onPress} loading />
    );
    // The TouchableOpacity should be disabled
    const touchable = root;
    fireEvent.press(touchable);
    expect(onPress).not.toHaveBeenCalled();
  });
});
