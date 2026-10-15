import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/posts/[id]/related — posts sharing tags with this post
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const post = await db.post.findUnique({
    where: { id },
    select: { id: true, communityId: true, tags: { select: { tagId: true } } },
  })
  if (!post) return NextResponse.json({ posts: [] })

  const tagIds = post.tags.map((t) => t.tagId)

  let related: any[] = []

  if (tagIds.length > 0) {
    // find posts sharing tags, excluding the current post
    const postTags = await db.postTag.findMany({
      where: { tagId: { in: tagIds }, postId: { not: id } },
      take: 20,
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
            community: { select: { id: true, slug: true, name: true, color: true, icon: true } },
            _count: { select: { comments: true } },
          },
        },
      },
    })
    // dedupe by post id, sort by score
    const seen = new Set<string>()
    related = postTags
      .map((pt) => pt.post)
      .filter((p) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }

  // fallback: posts from the same community if not enough related found
  if (related.length < 4) {
    const excludeIds = [id, ...related.map((p) => p.id)]
    const fallback = await db.post.findMany({
      where: { id: { notIn: excludeIds }, communityId: post.communityId },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: 4 - related.length,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarColor: true, karma: true } },
        community: { select: { id: true, slug: true, name: true, color: true, icon: true } },
        _count: { select: { comments: true } },
      },
    })
    related = [...related, ...fallback]
  }

  return NextResponse.json({ posts: related.map((p) => mapPost(p)) })
}

function mapPost(p: any) {
  return {
    id: p.id,
    type: p.type,
    title: p.title,
    body: p.body,
    image: p.image,
    link: p.link,
    score: p.score,
    upvotes: p.upvotes,
    downvotes: p.downvotes,
    views: p.views,
    answerCount: p.answerCount,
    commentCount: p._count.comments,
    createdAt: p.createdAt,
    author: p.author,
    community: p.community,
    userVote: 0,
    saved: false,
  }
}
