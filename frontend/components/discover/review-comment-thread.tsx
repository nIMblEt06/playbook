'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, MessageCircle, ThumbsUp, Trash2, X, User } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import {
  useReviewComments,
  useCreateReviewComment,
  useDeleteReviewComment,
  useUpvoteReviewComment,
} from '@/lib/hooks/use-reviews'
import type { ReviewComment } from '@/lib/api/services/reviews'
import { formatDistanceToNow } from '@/lib/utils/format'

interface ReviewCommentItemProps {
  comment: ReviewComment
  reviewId: string
  depth?: number
  maxDepth?: number
}

function ReviewCommentItem({
  comment,
  reviewId,
  depth = 0,
  maxDepth = 3,
}: ReviewCommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [hasUpvoted, setHasUpvoted] = useState(comment.hasUpvoted)
  const [upvoteCount, setUpvoteCount] = useState(comment.upvoteCount)

  const { user } = useAuthStore()
  const createCommentMutation = useCreateReviewComment()
  const deleteCommentMutation = useDeleteReviewComment()
  const upvoteCommentMutation = useUpvoteReviewComment()

  const handleReply = () => {
    if (!replyContent.trim()) return
    createCommentMutation.mutate(
      {
        reviewId,
        content: replyContent.trim(),
        parentId: comment.id,
      },
      {
        onSuccess: () => {
          setReplyContent('')
          setShowReplyForm(false)
        },
      }
    )
  }

  const handleUpvote = () => {
    const newUpvoted = !hasUpvoted
    setHasUpvoted(newUpvoted)
    setUpvoteCount((prev) => (newUpvoted ? prev + 1 : prev - 1))
    upvoteCommentMutation.mutate({ id: comment.id, remove: !newUpvoted })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(comment.id)
    }
  }

  const isAuthor = user?.id === comment.author.id

  return (
    <div className={depth > 0 ? 'border-l-2 border-border pl-4 ml-4' : ''}>
      <div className="py-3">
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${comment.author.username}`}
            className="flex-shrink-0"
          >
            {comment.author.avatarUrl ? (
              <Image
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${comment.author.username}`}
                className="font-medium text-sm hover:underline"
              >
                {comment.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt))}
              </span>
            </div>

            {/* Comment Content */}
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            {/* Comment Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  hasUpvoted
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ThumbsUp
                  className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`}
                />
                <span>{upvoteCount}</span>
              </button>

              {user && depth < maxDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reply
                </button>
              )}

              {isAuthor && (
                <button
                  onClick={handleDelete}
                  disabled={deleteCommentMutation.isPending}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <div className="mt-3 ml-11">
            <div className="flex gap-2">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full input text-sm resize-none min-h-[60px]"
                  maxLength={2000}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyContent('')
                    }}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={
                      !replyContent.trim() || createCommentMutation.isPending
                    }
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    {createCommentMutation.isPending ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <ReviewCommentItem
              key={reply.id}
              comment={reply}
              reviewId={reviewId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ReviewCommentThreadProps {
  reviewId: string
  onClose?: () => void
}

export function ReviewCommentThread({
  reviewId,
  onClose,
}: ReviewCommentThreadProps) {
  const [commentContent, setCommentContent] = useState('')
  const { user, isAuthenticated } = useAuthStore()

  const { data: commentsData, isLoading } = useReviewComments(reviewId, {
    sort: 'recent',
  })
  const createCommentMutation = useCreateReviewComment()

  const handleSubmitComment = () => {
    if (!commentContent.trim()) return
    createCommentMutation.mutate(
      {
        reviewId,
        content: commentContent.trim(),
      },
      {
        onSuccess: () => {
          setCommentContent('')
        },
      }
    )
  }

  return (
    <div className="mt-2 bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {commentsData?.total ?? 0} Comments
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-label="Close comments"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Comment Form */}
      <div className="p-4 border-b border-border">
        {isAuthenticated && user ? (
          <div className="flex gap-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
                className="w-full input text-sm resize-none min-h-[80px]"
                maxLength={2000}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={
                    !commentContent.trim() || createCommentMutation.isPending
                  }
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {createCommentMutation.isPending ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Log in to join the discussion
            </p>
            <Link href="/auth/login" className="btn-primary text-sm">
              Log In
            </Link>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : commentsData?.items && commentsData.items.length > 0 ? (
          <div className="px-4 divide-y divide-border">
            {commentsData.items.map((comment) => (
              <ReviewCommentItem
                key={comment.id}
                comment={comment}
                reviewId={reviewId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  )
}
