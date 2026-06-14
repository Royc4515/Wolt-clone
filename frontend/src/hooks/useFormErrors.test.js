import { renderHook, act } from '@testing-library/react';
import useFormErrors from './useFormErrors';

describe('useFormErrors', () => {
  it('initializes with empty errors and empty serverError', () => {
    const { result } = renderHook(() => useFormErrors());
    expect(result.current.errors).toEqual({});
    expect(result.current.serverError).toBe('');
  });

  it('setErrors sets a single field error', () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => { result.current.setErrors({ username: 'Username is required' }); });
    expect(result.current.errors.username).toBe('Username is required');
  });

  it('setErrors with multiple fields sets all fields', () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => { result.current.setErrors({ username: 'err1', password: 'err2' }); });
    expect(result.current.errors.username).toBe('err1');
    expect(result.current.errors.password).toBe('err2');
  });

  it('clearFieldError removes the specified field and leaves others untouched', () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => { result.current.setErrors({ username: 'err', password: 'err2' }); });
    act(() => { result.current.clearFieldError('username'); });
    expect(result.current.errors.username).toBeUndefined();
    expect(result.current.errors.password).toBe('err2');
  });

  it('clearFieldError also clears serverError', () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => { result.current.setServerError('Server error'); });
    act(() => { result.current.clearFieldError('username'); });
    expect(result.current.serverError).toBe('');
  });

  it('clearFieldError on non-existent field does not throw', () => {
    const { result } = renderHook(() => useFormErrors());
    expect(() => {
      act(() => { result.current.clearFieldError('nonExistentField'); });
    }).not.toThrow();
  });

  it('setServerError sets the server error message', () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => { result.current.setServerError('Something went wrong'); });
    expect(result.current.serverError).toBe('Something went wrong');
  });
});
