// src/__tests__/unit/api.test.js
import { api } from '../../api';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(body, { status = 200, ok = true } = {}) {
  return Promise.resolve({
    status,
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('api helpers', () => {
  describe('request basics', () => {
    test('includes Content-Type: application/json header', async () => {
      mockFetch.mockResolvedValue(mockResponse({ status: 'ok' }));
      await api.getLeagues();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    test('includes Authorization header when token is stored', async () => {
      localStorage.getItem.mockImplementation((key) =>
        key === 'token' ? 'my-bearer-token' : null
      );
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getLeagues();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer my-bearer-token');
    });

    test('omits Authorization header when no token stored', async () => {
      localStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getLeagues();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Authorization']).toBeUndefined();
    });

    test('throws an error when response is not ok', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'Not found' }, { status: 404, ok: false }));
      await expect(api.getLeague('fake-id')).rejects.toThrow('Not found');
    });

    test('redirects to /login on 401 response', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'Unauthorized' }, { status: 401, ok: false }));
      // Should not throw because 401 handling exits early
      await api.getLeagues().catch(() => {});
      expect(window.location.href).toBe('/login');
    });
  });

  describe('api.login()', () => {
    test('POSTs to /auth/login with credentials', async () => {
      mockFetch.mockResolvedValue(mockResponse({ token: 'jwt', user: {} }));
      await api.login('user@example.com', 'password123');
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/login');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.email).toBe('user@example.com');
      expect(body.password).toBe('password123');
    });
  });

  describe('api.register()', () => {
    test('POSTs to /auth/register with user data', async () => {
      mockFetch.mockResolvedValue(mockResponse({ user: { id: 'u1' } }, { status: 201 }));
      await api.register('user@example.com', 'Alice', 'pass123');
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/register');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.email).toBe('user@example.com');
      expect(body.name).toBe('Alice');
    });
  });

  describe('api.getLeagues()', () => {
    test('GETs /api/leagues', async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      await api.getLeagues();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/leagues');
      expect(options.method).toBe('GET');
    });
  });

  describe('api.submitTeam()', () => {
    test('POSTs to /api/leagues/:id/team/:week with correct body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'team1' }));
      await api.submitTeam('lg1', 1, ['d1', 'd2', 'd3', 'd4', 'd5'], 'ctor1', 'd1', null);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/leagues/lg1/team/1');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.drivers).toHaveLength(5);
      expect(body.constructorId).toBe('ctor1');
      expect(body.captainId).toBe('d1');
    });
  });

  describe('api.getLeaderboard()', () => {
    test('GETs /api/leagues/:id/leaderboard', async () => {
      mockFetch.mockResolvedValue(mockResponse({ standings: [] }));
      await api.getLeaderboard('lg1');
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/leagues/lg1/leaderboard');
    });
  });

  describe('api.sendMessage()', () => {
    test('POSTs chat message with content', async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: 'msg1' }));
      await api.sendMessage('lg1', 'Hello everyone!');
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/leagues/lg1/chat');
      const body = JSON.parse(options.body);
      expect(body.content).toBe('Hello everyone!');
    });
  });
});
