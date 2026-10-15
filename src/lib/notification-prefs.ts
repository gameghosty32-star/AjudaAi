import { db } from '@/lib/db'

type PrefKey = 'notifyOnReply' | 'notifyOnVote' | 'notifyOnFollow' | 'notifyOnAnswer'

const DEFAULTS: Record<PrefKey, boolean> = {
  notifyOnReply: true,
  notifyOnVote: true,
  notifyOnFollow: true,
  notifyOnAnswer: true,
}

// Returns true if the user wants to receive the given notification type.
// Reads from User.preferences (JSON string). Defaults to true if not set.
export async function wantsNotification(userId: string, key: PrefKey): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  })
  if (!u?.preferences) return DEFAULTS[key]
  try {
    const prefs = JSON.parse(u.preferences)
    const val = prefs[key]
    return val === undefined ? DEFAULTS[key] : !!val
  } catch {
    return DEFAULTS[key]
  }
}

// Convenience: create a notification only if the user wants it.
export async function maybeCreateNotification(params: {
  userId: string
  pref: PrefKey
  type: string
  title: string
  body: string
  link?: string | null
}): Promise<void> {
  const ok = await wantsNotification(params.userId, params.pref)
  if (!ok) return
  try {
    await db.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link || null,
      },
    })
  } catch {}
}
