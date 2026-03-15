// routes/chat.js — League chat and messaging
const express = require('express');
const router = express.Router({ mergeParams: true });
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');

// All routes require auth
router.use(authMiddleware);

/**
 * GET /api/leagues/:leagueId/chat
 * Get chat messages for a league (paginated, newest last)
 */
router.get('/', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor (message id)

    // Verify membership
    const membership = await prisma.leagueUser.findUnique({
      where: { userId_leagueId: { userId: req.user.id, leagueId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this league' });

    const where = { leagueId };
    if (before) where.id = { lt: before };

    const messages = await prisma.leagueMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        reactions: {
          include: { user: { select: { id: true, name: true } } },
        },
        replyTo: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // Return oldest first for display
    res.json(messages.reverse());
  } catch (error) {
    console.error('Chat fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/leagues/:leagueId/chat
 * Send a message
 * Body: { content, replyToId? }
 */
router.post('/', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { content, replyToId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    const membership = await prisma.leagueUser.findUnique({
      where: { userId_leagueId: { userId, leagueId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this league' });

    const message = await prisma.leagueMessage.create({
      data: {
        leagueId,
        userId,
        content: content.trim(),
        replyToId: replyToId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        replyTo: {
          include: { user: { select: { id: true, name: true } } },
        },
        reactions: true,
      },
    });

    // Notify league members (exclude sender)
    const members = await prisma.leagueUser.findMany({
      where: { leagueId, userId: { not: userId } },
      select: { userId: true },
    });

    const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } });

    await prisma.notification.createMany({
      data: members.map(m => ({
        userId: m.userId,
        type: 'message',
        title: `New message in ${league.name}`,
        body: `${req.user.name}: ${content.trim().substring(0, 80)}`,
        data: { leagueId, messageId: message.id },
      })),
      skipDuplicates: true,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Chat send error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/leagues/:leagueId/chat/:msgId/react
 * Toggle an emoji reaction on a message
 * Body: { emoji }
 */
router.post('/:msgId/react', async (req, res) => {
  try {
    const { leagueId, msgId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) return res.status(400).json({ error: 'emoji required' });

    // Check membership
    const membership = await prisma.leagueUser.findUnique({
      where: { userId_leagueId: { userId, leagueId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member' });

    // Toggle reaction
    const existing = await prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId: msgId, userId, emoji } },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
      return res.json({ action: 'removed', emoji });
    }

    await prisma.messageReaction.create({
      data: { messageId: msgId, userId, emoji },
    });

    res.json({ action: 'added', emoji });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/leagues/:leagueId/chat/:msgId
 * Delete a message (own message, or commissioner can delete any)
 */
router.delete('/:msgId', async (req, res) => {
  try {
    const { leagueId, msgId } = req.params;
    const userId = req.user.id;

    const message = await prisma.leagueMessage.findUnique({ where: { id: msgId } });
    if (!message || message.leagueId !== leagueId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const membership = await prisma.leagueUser.findUnique({
      where: { userId_leagueId: { userId, leagueId } },
    });

    if (message.userId !== userId && membership?.role !== 'commissioner') {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }

    await prisma.leagueMessage.delete({ where: { id: msgId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/leagues/:leagueId/chat/:msgId/pin
 * Pin/unpin a message (commissioner only)
 */
router.post('/:msgId/pin', async (req, res) => {
  try {
    const { leagueId, msgId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.leagueUser.findUnique({
      where: { userId_leagueId: { userId, leagueId } },
    });
    if (membership?.role !== 'commissioner') {
      return res.status(403).json({ error: 'Only commissioners can pin messages' });
    }

    const message = await prisma.leagueMessage.findUnique({ where: { id: msgId } });
    const updated = await prisma.leagueMessage.update({
      where: { id: msgId },
      data: { pinned: !message.pinned },
    });

    res.json({ pinned: updated.pinned });
  } catch (error) {
    console.error('Pin error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
