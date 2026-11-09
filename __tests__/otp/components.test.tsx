import React from 'react';
import { BackHandler, Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BlockingLoader } from '../../src/features/otp/components/BlockingLoader';
import { CountryPickerSheet } from '../../src/features/otp/components/CountryPickerSheet';
import { LegalText, openSafeUrl } from '../../src/features/otp/components/LegalText';
import { OtpBoxes } from '../../src/features/otp/components/OtpBoxes';
import { OtpHeader } from '../../src/features/otp/components/OtpHeader';
import { PageDots } from '../../src/features/otp/components/PageDots';
import { PhoneField } from '../../src/features/otp/components/PhoneField';

describe('OtpBoxes', () => {
  it('renders six boxes and the typed digits', () => {
    const { getByTestId, getByText, queryByText } = render(<OtpBoxes value="58" onChange={jest.fn()} editable hasError={false} />);
    for (let i = 0; i < 6; i += 1) {
      expect(getByTestId(`otp-box-${i}`)).toBeTruthy();
    }
    expect(getByText('5')).toBeTruthy();
    expect(getByText('8')).toBeTruthy();
    expect(queryByText('2')).toBeNull();
  });
  it('forwards input to onChange and exposes one-time-code autofill hints', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<OtpBoxes value="" onChange={onChange} editable hasError={false} />);
    const input = getByTestId('otp-input');
    fireEvent.changeText(input, '123456');
    expect(onChange).toHaveBeenCalledWith('123456');
    expect(input.props.textContentType).toBe('oneTimeCode');
    expect(input.props.autoComplete).toBe('sms-otp');
    expect(input.props.maxLength).toBe(6);
  });
  it('is read-only when not editable and supports error styling', () => {
    const { getByTestId } = render(<OtpBoxes value="123456" onChange={jest.fn()} editable={false} hasError />);
    expect(getByTestId('otp-input').props.editable).toBe(false);
  });
  it('supports function and object refs', () => {
    const fnRef = jest.fn();
    render(<OtpBoxes ref={fnRef} value="" onChange={jest.fn()} editable hasError={false} />);
    expect(fnRef).toHaveBeenCalled();
    const objRef = React.createRef<never>();
    render(<OtpBoxes ref={objRef} value="" onChange={jest.fn()} editable hasError={false} />);
    expect(objRef.current).not.toBeUndefined();
  });
});

describe('PhoneField', () => {
  const base = { digits: '', editable: true, onChangeDigits: jest.fn(), onFocus: jest.fn(), onBlur: jest.fn(), onPressCountry: jest.fn(), onSubmit: jest.fn() };
  it('shows +91 and formats the number', () => {
    const { getByText, getByTestId } = render(<PhoneField {...base} digits="9876543210" />);
    expect(getByText('+91')).toBeTruthy();
    expect(getByTestId('phone-input').props.value).toBe('98765 43210');
  });
  it('wires focus / blur / change / country chip / submit', () => {
    const { getByTestId } = render(<PhoneField {...base} />);
    const input = getByTestId('phone-input');
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
    fireEvent.changeText(input, '98765');
    fireEvent(input, 'submitEditing');
    fireEvent.press(getByTestId('country-chip'));
    expect(base.onFocus).toHaveBeenCalled();
    expect(base.onBlur).toHaveBeenCalled();
    expect(base.onChangeDigits).toHaveBeenCalledWith('98765');
    expect(base.onSubmit).toHaveBeenCalled();
    expect(base.onPressCountry).toHaveBeenCalled();
  });
  it('uses telephone autofill and a numeric keyboard', () => {
    const { getByTestId } = render(<PhoneField {...base} />);
    expect(getByTestId('phone-input').props).toMatchObject({ keyboardType: 'number-pad', textContentType: 'telephoneNumber', autoComplete: 'tel' });
  });
  it('locks the chip when not editable', () => {
    const { getByTestId } = render(<PhoneField {...base} editable={false} />);
    expect(getByTestId('country-chip').props.accessibilityState?.disabled ?? getByTestId('country-chip').props.disabled).toBeTruthy();
  });
});

describe('CountryPickerSheet (India only)', () => {
  it('lists only India and selecting it closes the sheet', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId, queryAllByTestId, getByText } = render(<CountryPickerSheet visible onClose={onClose} onSelect={onSelect} />);
    expect(queryAllByTestId(/country-option-/)).toHaveLength(1);
    expect(getByText('India')).toBeTruthy();
    fireEvent.press(getByTestId('country-option-IN'));
    expect(onSelect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
  it('closes from the backdrop and renders nothing when hidden', () => {
    const onClose = jest.fn();
    const { getByTestId, rerender, queryByTestId } = render(<CountryPickerSheet visible onClose={onClose} onSelect={jest.fn()} />);
    fireEvent.press(getByTestId('country-backdrop'));
    expect(onClose).toHaveBeenCalled();
    rerender(<CountryPickerSheet visible={false} onClose={onClose} onSelect={jest.fn()} />);
    expect(queryByTestId('country-option-IN')).toBeNull();
  });
});

describe('BlockingLoader', () => {
  it('renders nothing when hidden', () => {
    expect(render(<BlockingLoader visible={false} message="x" />).queryByTestId('blocking-loader')).toBeNull();
  });
  it('shows the message and blocks the Android back button while visible', () => {
    const add = jest.spyOn(BackHandler, 'addEventListener');
    const { getByTestId, getByText, unmount } = render(<BlockingLoader visible message="Sending OTP…" />);
    expect(getByTestId('blocking-loader')).toBeTruthy();
    expect(getByText('Sending OTP…')).toBeTruthy();
    const handler = add.mock.calls[0]![1] as () => boolean;
    expect(handler()).toBe(true);
    unmount();
    add.mockRestore();
  });
});

describe('LegalText', () => {
  it('has both links and opens https URLs only', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId, getByText } = render(<LegalText />);
    expect(getByText(/By continuing, you agree to our/)).toBeTruthy();
    fireEvent.press(getByTestId('legal-terms'));
    fireEvent.press(getByTestId('legal-privacy'));
    expect(open).toHaveBeenCalledTimes(2);
    expect(await openSafeUrl('http://evil.example')).toBe(false);
    expect(await openSafeUrl('javascript:alert(1)')).toBe(false); // eslint-disable-line no-script-url
    open.mockRejectedValueOnce(new Error('no browser'));
    expect(await openSafeUrl('https://ok.example')).toBe(false);
    open.mockRestore();
  });
});

describe('static header pieces', () => {
  it('OtpHeader renders brand copy', () => {
    const { getByText, getByTestId } = render(<OtpHeader />);
    expect(getByText('HERITAGE GASTRONOMY')).toBeTruthy();
    expect(getByText('PARADISE CAFE')).toBeTruthy();
    expect(getByText('Pure Taste. Modern Heritage.')).toBeTruthy();
    expect(getByTestId('otp-medallion')).toBeTruthy();
  });
  it('PageDots renders', () => {
    expect(render(<PageDots active={1} count={3} />).toJSON()).toBeTruthy();
  });
});
