'use client'

import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PostCard } from '@/components/posts/post-card'
import { usePost, useComments, useCreateComment } from '@/lib/hooks/use-posts'
import { useAuthStore } from '@/lib/store/auth-store'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { Comment } from '@/lib/types'

function CommentItem({ comment }: { comment: Comment }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const { user } = useAuthStore()
  const createCommentMutation = useCreateComment()

  const handleReply = () => {
    if (!replyContent.trim()) return
    createCommentMutation.mutate(
      {
        postId: comment.postId,
        content: replyContent.trim(),
        parentCommentId: comment.id,
      },
      {
        onSuccess: () => {
          setReplyContent('')
          setShowReplyForm(false)
        },
      }
    )
  }

  return (
    <div className="border-l-2 border-border pl-4 ml-6">
      <div className="flex gap-3 mb-3">
        <Link href={`/u/${comment.author.username}`}>
          {comment.author.avatarUrl ? (
            <Image
              src={comment.author.avatarUrl}
              alt={comment.author.displayName}
              width={32}
              height={32}
              className="w-8 h-8 border-2 border-border"
            />
          ) : (
            <div className="w-8 h-8 bg-muted border-2 border-border" />
          )}
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/u/${comment.author.username}`}
              className="font-medium text-sm hover:underline"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground-muted mb-2 whitespace-pre-wrap">
            {comment.content}
          </p>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reply
          </button>
        </div>
      </div>

      {showReplyForm && user && (
        <div className="flex gap-2 mb-4">
          <Image
            src={user.avatarUrl || ''}
            alt={user.displayName}
            width={24}
            height={24}
            className="w-6 h-6 border border-border"
          />
          <div className="flex-1">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-background-elevated border-2 border-input-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none min-h-[60px]"
              maxLength={1000}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowReplyForm(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyContent.trim() || createCommentMutation.isPending}
                className="btn-primary text-xs disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const { user } = useAuthStore()
  const [commentContent, setCommentContent] = useState('')

  const { data: post, isLoading: postLoading } = usePost(postId)
  const { data: comments, isLoading: commentsLoading } = useComments(postId)
  const createCommentMutation = useCreateComment()

  const handleComment = () => {
    if (!commentContent.trim()) return
    createCommentMutation.mutate(
      {
        postId,
        content: commentContent.trim(),
      },
      {
        onSuccess: () => {
          setCommentContent('')
        },
      }
    )
  }

  if (postLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="px-6 py-12 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">Post Not Found</h2>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </AppLayout>
    )
  }

  const topLevelComments = comments?.filter((c) => !c.parentCommentId) || []

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="px-6 py-4 border-b-2 border-border">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Post */}
        <PostCard post={post} />

        {/* Comment Form */}
        {user && (
          <div className="px-6 py-4 border-b-2 border-border">
            <div className="flex gap-3">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="w-10 h-10 border-2 border-border"
                />
              ) : (
                <div className="w-10 h-10 bg-muted border-2 border-border" />
              )}
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-background-elevated border-2 border-input-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none min-h-[80px]"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {commentContent.length} / 1000
                  </span>
                  <button
                    onClick={handleComment}
                    disabled={!commentContent.trim() || createCommentMutation.isPending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {createCommentMutation.isPending ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-display font-bold uppercase mb-4">
            Comments ({post.commentCount})
          </h3>

          {commentsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!commentsLoading && topLevelComments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          )}

          <div className="space-y-6">
            {topLevelComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
