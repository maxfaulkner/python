// src/__tests__/unit/auth.test.js
import { getUser, setSession, clearSession, isLoggedIn } from '../../auth';

describe('auth helpers', () => {
  describe('getUser()', () => {
    test('returns null when nothing is stored', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(getUser()).toBeNull();
    });

    test('returns parsed user object when stored', () => {
      const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
      localStorage.getItem.mockReturnValue(JSON.stringify(user));
      expect(getUser()).toEqual(user);
    });

    test('returns null for malformed JSON (does not throw)', () => {
      localStorage.getItem.mockReturnValue('not-json{{{{');
      expect(getUser()).toBeNull();
    });

    test('reads from the "user" key', () => {
      localStorage.getItem.mockReturnValue(null);
      getUser();
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
    });
  });

  describe('setSession()', () => {
    test('stores token under "token" key', () => {
      setSession('my-jwt-token', { id: 'u1', name: 'Alice' });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'my-jwt-token');
    });

    test('stores stringified user under "user" key', () => {
      const user = { id: 'u1', name: 'Alice' };
      setSession('tok', user);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });
  });

  describe('clearSession()', () => {
    test('removes token from localStorage', () => {
      clearSession();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    test('removes user from localStorage', () => {
      clearSession();
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isLoggedIn()', () => {
    test('returns false when no token stored', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(isLoggedIn()).toBe(false);
    });

    test('returns true when token exists', () => {
      localStorage.getItem.mockReturnValue('some-token');
      expect(isLoggedIn()).toBe(true);
    });

    test('reads from the "token" key', () => {
      localStorage.getItem.mockReturnValue(null);
      isLoggedIn();
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
    });
  });
});
