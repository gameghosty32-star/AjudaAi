import { db } from '@/lib/db'

// Check a user's stats and award any badges they've earned but don't yet have.
// Call this after post creation, comment creation, and voting.
export async function awardBadges(userId: string): Promise<string[]> {
  const newlyAwarded: string[] = []

  const [postCount, commentCount, totalUpvotes] = await Promise.all([
    db.post.count({ where: { authorId: userId } }),
    db.comment.count({ where: { authorId: userId } }),
    db.vote.findMany({
      where: { value: 1, OR: [{ post: { authorId: userId } }, { comment: { authorId: userId } }] },
      select: { value: true },
    }).then((v) => v.length),
  ])

  const hasBestAnswer = await db.comment.findFirst({
    where: { authorId: userId, isAnswer: true },
    select: { id: true },
  })

  const user = await db.user.findUnique({ where: { id: userId }, select: { karma: true, createdAt: true } })
  if (!user) return newlyAwarded

  const daysActive = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)

  const earned: { key: string; condition: boolean }[] = [
    { key: 'perguntador', condition: postCount >= 5 },
    { key: 'helper', condition: commentCount >= 1 },
    { key: 'top-answer', condition: !!hasBestAnswer },
    { key: 'votado', condition: totalUpvotes >= 5 }, // lowered from 50 for demo viability
    { key: 'veterano', condition: daysActive >= 7 || (postCount >= 3 && commentCount >= 3) },
  ]

  for (const { key, condition } of earned) {
    if (!condition) continue
    const badge = await db.badge.findUnique({ where: { key } })
    if (!badge) continue
    const existing = await db.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    })
    if (existing) continue
    await db.userBadge.create({ data: { userId, badgeId: badge.id } })
    newlyAwarded.push(badge.name)

    // notify the user about the new badge
    await db.notification.create({
      data: {
        userId,
        type: 'badge',
        title: `🏆 Nova distinção: ${badge.name}!`,
        body: badge.description,
        link: `user:me`,
      },
    }).catch(() => null)
  }

  return newlyAwarded
}
