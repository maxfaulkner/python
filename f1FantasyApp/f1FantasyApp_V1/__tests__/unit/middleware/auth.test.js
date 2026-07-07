// __tests__/unit/middleware/auth.test.js
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

function makeReqRes(headers = {}) {
  const req = { headers };
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('authMiddleware', () => {
  test('returns 401 when no Authorization header is present', () => {
    const { req, res, next } = makeReqRes();
    authMiddleware(req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/no token/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is malformed / invalid', () => {
    const { req, res, next } = makeReqRes({ authorization: 'Bearer invalid.token.here' });
    authMiddleware(req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toMatch(/invalid token/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is signed with wrong secret', () => {
    const badToken = jwt.sign({ id: 'u1', email: 'a@b.com' }, 'wrong-secret');
    const { req, res, next } = makeReqRes({ authorization: `Bearer ${badToken}` });
    authMiddleware(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is expired', () => {
    const expiredToken = jwt.sign(
      { id: 'u1', email: 'a@b.com' },
      SECRET,
      { expiresIn: -1 } // already expired
    );
    const { req, res, next } = makeReqRes({ authorization: `Bearer ${expiredToken}` });
    authMiddleware(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and sets req.user for a valid token', () => {
    const payload = { id: 'user123', email: 'test@example.com' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    const { req, res, next } = makeReqRes({ authorization: `Bearer ${token}` });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe('user123');
    expect(req.user.email).toBe('test@example.com');
  });

  test('returns 401 when Bearer prefix is missing', () => {
    const token = jwt.sign({ id: 'u1' }, SECRET);
    // Pass token without "Bearer " prefix — split(' ')[1] will be undefined
    const { req, res, next } = makeReqRes({ authorization: token });
    authMiddleware(req, res, next);
    // The middleware does header.split(' ')[1] — with no space, split gives [token]
    // and [1] is undefined, so it hits the !token branch
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
