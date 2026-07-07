// __mocks__/prisma.js
// Auto-mock of the Prisma client used by all backend tests.
// jest-mock-extended creates a typed deep mock so every method
// (prisma.user.create, prisma.league.findMany, etc.) is a jest.fn()
// that can be configured per-test with .mockResolvedValue().
const { mockDeep, mockReset } = require('jest-mock-extended');

const prismaMock = mockDeep();

// Allow tests to call resetMock() to clear all call history
prismaMock._reset = () => mockReset(prismaMock);

module.exports = prismaMock;
