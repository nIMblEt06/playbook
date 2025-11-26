# Play Book - Product Requirements Document

**Version:** 1.0
**Date:** November 25, 2024
**Status:** Draft

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Vision & Goals](#3-vision--goals)
4. [User Personas](#4-user-personas)
5. [User Journeys](#5-user-journeys)
6. [Core Features](#6-core-features)
7. [Information Architecture](#7-information-architecture)
8. [Data Models](#8-data-models)
9. [Technical Architecture](#9-technical-architecture)
10. [MVP Scope](#10-mvp-scope)
11. [Future Roadmap](#11-future-roadmap)
12. [Success Metrics](#12-success-metrics)
13. [Risks & Mitigations](#13-risks--mitigations)

---

## 1. Product Overview

### 1.1 What is Play Book?

Play Book is a music-focused social platform designed for music enthusiasts to discover, discuss, and share music through trusted communities rather than algorithmic recommendations. It bridges the gap between chaotic group chats and impersonal streaming platforms by creating organized micro-communities around artists, genres, and vibes.

### 1.2 Tagline

*"Discover music through people you trust."*

### 1.3 Core Value Proposition

- **For Music Discoverers:** Find new music through curated recommendations from people with similar taste, not algorithms
- **For Emerging Artists:** Get meaningful feedback from genuinely interested listeners, not just heart reacts
- **For Community Curators:** Build reputation by sharing quality finds and fostering music discussions

---

## 2. Problem Statement

### 2.1 The Pain Points

**Signal-to-Noise Problem**
Music discussion groups (WhatsApp, Discord, Reddit) suffer from information overload. Users report 999+ unread messages, making it impossible to find posts from people whose taste they trust.

**Algorithm Fatigue**
Streaming platform recommendations feel impersonal and often miss the mark. Users crave human curation from people who "get" their taste.

**Artist Feedback Gap**
Emerging artists struggle to get meaningful feedback. Social media offers empty engagement (likes, hearts) but no substantive discussion about their work.

**Scattered Conversations**
Album discussions happen across multiple platforms with no threading or organization. Good insights get lost in the scroll.

**Taste Discovery Problem**
It's hard to find people with similar music taste online. Streaming "listening activity" features don't translate to actual connection.

### 2.2 Why Existing Solutions Fall Short

| Platform | Strength | Limitation |
|----------|----------|------------|
| WhatsApp/Discord | Real community | No organization, overwhelming |
| Reddit | Threaded discussions | Anonymous, hard to build taste reputation |
| Letterboxd | Beautiful logging | Music doesn't need logging the same way |
| Twitter/X | Wide reach | Not music-focused, no community structure |
| Spotify | Has the music | Recommendations are algorithmic, not social |

---

## 3. Vision & Goals

### 3.1 Vision Statement

Create the definitive platform where music lovers discover new sounds through trusted human connections, artists find their first true fans, and meaningful music discussions flourish.

### 3.2 Product Goals

**G1: Enable Discovery Through Trust**
Users should discover music through people they've learned to trust, not black-box algorithms.

**G2: Organize Music Discussions**
Provide structured, threaded spaces for album/artist discussions that persist and are searchable.

**G3: Surface Emerging Artists**
Help new artists reach listeners who are genuinely interested in discovering new music.

**G4: Build Taste Reputation**
Create a system where users build reputation based on the quality of their musical contributions.

**G5: Foster Micro-Communities**
Enable genre-specific, vibe-specific, and artist-specific communities to form organically.

### 3.3 Design Principles

1. **People over algorithms** - Human curation is the primary discovery mechanism
2. **Discussion over metrics** - Prioritize meaningful engagement over vanity metrics
3. **Communities over crowds** - Small, tight communities beat massive anonymous ones
4. **Links over embeds** - Keep it lightweight, link out to streaming platforms
5. **Quality over quantity** - Rate limiting and reputation systems encourage thoughtful posting

---

## 4. User Personas

### 4.1 The Music Discoverer (Primary)

**Name:** Alex
**Age:** 28
**Behavior:** Spends 2+ hours daily listening to music. Active in WhatsApp music groups but frustrated by clutter. Follows music blogs and playlists but wants more personal recommendations.

**Goals:**
- Find new music that matches their specific taste
- Connect with people who "get" their music preferences
- Have thoughtful discussions about albums and artists

**Pain Points:**
- Streaming recommendations miss the mark
- Music groups are overwhelming with 999+ messages
- Can't easily find posts from trusted recommenders

**Quote:** *"I trust my friend Sarah's recs more than any Spotify playlist."*

---

### 4.2 The Emerging Artist

**Name:** Marcus
**Age:** 24
**Behavior:** Releases music on Spotify/SoundCloud. Has a small following but struggles to get meaningful feedback. Posts on social media but gets shallow engagement.

**Goals:**
- Reach listeners genuinely interested in their genre
- Get substantive feedback on their music
- Build an early fanbase of engaged listeners

**Pain Points:**
- Social media engagement is shallow (likes, not listens)
- Hard to find communities interested in discovering new artists
- No way to know if recommendations reach the right people

**Quote:** *"I don't need 10k followers. I need 100 people who actually listen and care."*

---

### 4.3 The Community Curator

**Name:** Priya
**Age:** 32
**Behavior:** Runs a music blog or is known in their circle for great recommendations. Enjoys the social capital of being "the person with good taste."

**Goals:**
- Build reputation as a tastemaker
- Create and maintain a community around a genre/vibe
- Curate playlists and share discoveries

**Pain Points:**
- Effort goes unrecognized in chaotic group chats
- Hard to build a following around music taste specifically
- No good platform for music-focused curation

**Quote:** *"I've introduced so many people to great music. I wish there was somewhere to track that."*

---

### 4.4 The Lurker

**Name:** Jordan
**Age:** 35
**Behavior:** Loves music but doesn't post much. Reads music discussions, follows recommendations, but rarely contributes.

**Goals:**
- Discover music without having to participate
- Follow trusted curators passively
- Occasionally engage when something really resonates

**Pain Points:**
- Overwhelming platforms make it hard to lurk effectively
- No way to filter for just the good stuff
- Pressure to engage when they just want to consume

**Quote:** *"I just want to see what the people with good taste are listening to."*

---

## 5. User Journeys

### 5.1 Music Discoverer Journey

```
ONBOARDING
├── Sign up with email or OAuth
├── Pick 5+ artists you love (builds taste profile)
├── Get suggested communities based on picks
├── Auto-follow top curators in those communities
└── Land on personalized home feed

DAILY USAGE
├── Open app → See posts from followed users
├── See a track share from trusted user
├── Tap link → Opens in Spotify/Apple Music
├── Return to Play Book → Join discussion thread
├── Upvote comment, add your take
└── Follow the original poster

DISCOVERY LOOP
├── Browse a/<ARTIST> community
├── Find new curator through quality post
├── Check their profile → See their playlists
├── Follow them → Their posts now in your feed
└── Repeat
```

### 5.2 Emerging Artist Journey

```
ONBOARDING
├── Sign up and indicate "I'm an artist"
├── Link to streaming profiles (Spotify, etc.)
├── Artist community a/<ARTIST> auto-creates on first follower
└── Artist badge appears on profile

POSTING NEW MUSIC
├── Create post with track link
├── Add relevant tags (#NewAndUpcoming, #HipHop, #Indie)
├── Post reaches: followers + tagged communities
├── #NewAndUpcoming rate limited (1/week)
└── Post appears in discovery feeds

ENGAGEMENT LOOP
├── Receive comments with actual feedback
├── Reply and engage with listeners
├── Build relationships with early supporters
├── See which communities respond best
└── Refine approach based on feedback
```

### 5.3 Community Curator Journey

```
ONBOARDING
├── Sign up, complete taste profile
├── Browse existing communities
├── Either join existing or create new community
└── Community auto-creates at u/<COMMUNITY>

CURATION FLOW
├── Find interesting track/album
├── Create post with thoughts + link
├── Tag relevant communities
├── Post gets upvotes → reputation increases
└── High reputation unlocks mod tools

COMMUNITY BUILDING
├── Moderate discussions (if high rep)
├── Pin important posts
├── Set community guidelines
├── Attract quality members through good curation
└── Community grows organically
```

### 5.4 Lurker Journey

```
ONBOARDING
├── Sign up, minimal taste profile
├── Follow suggested curators
├── Join 2-3 communities
└── Consume-first experience

PASSIVE USAGE
├── Open app weekly
├── Scroll feed for new recommendations
├── Save interesting posts to playlist
├── Tap links → Listen on streaming platform
└── Occasionally upvote, rarely comment

ACTIVATION MOMENTS
├── Album they love gets discussed
├── Emerge to share their take
├── Get upvotes → Small dopamine hit
├── Return to lurking
└── Slightly more engaged over time
```

---

## 6. Core Features

### 6.1 Posts

**Post Types:**
- **Track Share:** Single song link + commentary
- **Album Discussion:** Album link + longer form thoughts
- **Playlist Share:** Playlist link + context
- **Text Post:** Discussion starter, question, or opinion

**Post Components:**
- Author (linked to profile)
- Content (text, max 2000 characters)
- Link (to streaming platform)
- Tags (communities, #NewAndUpcoming, genres)
- Timestamp
- Upvotes count
- Comments count

**Post Actions:**
- Upvote (reputation impact)
- Comment (threaded)
- Share (copy link)
- Save (to personal collection)

---

### 6.2 Communities

**Namespace Structure:**
- `a/<ARTIST>` - Artist communities (auto-created)
- `u/<COMMUNITY>` - User-created communities

**Artist Communities (a/):**
- Auto-created when artist gets first follower
- Artist has special badge/posting privileges
- Discussion threads about artist's work
- Album-specific sub-threads

**User Communities (u/):**
- Created by any user
- Genre-based (u/indierock, u/90shiphop)
- Vibe-based (u/latenightsounds, u/workoutbeats)
- Format-based (u/vinylcollectors, u/producerlife)

**Community Features:**
- Description and rules
- Moderators (high-rep users + creator)
- Pinned posts
- Member count
- Activity feed

---

### 6.3 Profiles

**Profile Components:**
- Username (unique)
- Display name
- Bio (max 280 chars)
- Profile picture
- Linked streaming profiles (Spotify, Apple Music, etc.)
- Playlists (curated collections)
- Post history
- Follower/Following counts
- Community memberships
- Reputation scores (per community)

**Artist Badge:**
- Verified artists get special badge
- Appears on profile and all posts
- Links to official streaming profiles

---

### 6.4 Playlists

**Playlist Features:**
- Name and description
- Cover image (auto-generated or custom)
- Ordered list of track links
- Public/Private toggle
- Collaborative option (future)
- Shareable link

**Playlist Display:**
- Appears on user profile
- Can be featured (pinned)
- Shows play count equivalent (link clicks)

---

### 6.5 Feed

**Feed Algorithm:**

```
Priority 1: Posts from people you follow (chronological)
    ↓
Priority 2: Posts from people your follows follow (ranked by engagement)
    ↓
Priority 3: Posts from communities you've joined (ranked by engagement)
    ↓
Priority 4: Trending in your taste profile (cold start / exploration)
```

**Feed Controls:**
- Filter by: All / Following Only / Communities
- Sort by: Latest / Top (day/week/all)
- Mute specific users or communities

---

### 6.6 Search & Discovery

**Search Targets:**
- Users (by username, display name)
- Communities (by name, description)
- Artists (by name)
- Posts (by content, tags)

**Discovery Features:**
- Suggested communities (based on taste profile)
- Suggested users to follow (based on overlap)
- Trending discussions
- #NewAndUpcoming feed (emerging artists)

---

### 6.7 Notifications

**Notification Types:**
- Someone followed you
- Someone upvoted your post
- Someone commented on your post
- Someone replied to your comment
- New post in community you moderate
- Artist you follow posted new music

**Notification Settings:**
- Per-type toggles
- Quiet hours
- Email digest option (weekly)

---

### 6.8 Reputation System

**How Reputation Works:**
- Reputation is community-specific
- Earned through: upvotes on posts, upvotes on comments
- Displayed as numeric score + tier badge

**Reputation Tiers:**
| Tier | Score | Unlocks |
|------|-------|---------|
| Newcomer | 0-99 | Basic posting |
| Regular | 100-499 | Custom flair |
| Trusted | 500-999 | Mod nomination eligible |
| Curator | 1000+ | Mod tools, pin posts |

**Reputation Benefits:**
- Higher visibility in feeds
- Mod eligibility
- Trust signals on posts
- Community-specific badges

---

## 7. Information Architecture

### 7.1 Navigation Structure

```
HOME (Feed)
├── All Feed
├── Following Feed
└── Communities Feed

SEARCH
├── Users
├── Communities
├── Artists
└── Posts

COMMUNITIES
├── Browse All
├── Your Communities
├── Create Community
└── a/<ARTIST> pages

PROFILE
├── Your Posts
├── Your Playlists
├── Saved Posts
├── Settings
└── Edit Profile

NOTIFICATIONS
└── Activity Feed
```

### 7.2 URL Structure

```
/                           → Home feed
/search?q=<query>          → Search results
/u/<username>              → User profile
/u/<username>/playlists    → User's playlists
/a/<artist>                → Artist community
/c/<community>             → User community (alternative to u/)
/post/<id>                 → Single post view
/settings                  → User settings
/notifications             → Notifications
```

---

## 8. Data Models

### 8.1 User

```typescript
interface User {
  id: string;
  username: string;           // unique, lowercase
  displayName: string;
  email: string;
  passwordHash: string;
  bio: string | null;
  avatarUrl: string | null;
  isArtist: boolean;
  artistName: string | null;  // if isArtist
  streamingLinks: {
    spotify?: string;
    appleMusic?: string;
    soundcloud?: string;
    bandcamp?: string;
    youtube?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.2 Post

```typescript
interface Post {
  id: string;
  authorId: string;           // User.id
  content: string;            // max 2000 chars
  linkUrl: string | null;     // streaming link
  linkType: 'track' | 'album' | 'playlist' | null;
  tags: string[];             // community tags, genre tags
  upvoteCount: number;
  commentCount: number;
  isNewAndUpcoming: boolean;  // #NewAndUpcoming tag
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.3 Community

```typescript
interface Community {
  id: string;
  slug: string;               // unique identifier
  type: 'artist' | 'user';    // a/ vs u/
  name: string;
  description: string | null;
  rules: string | null;
  coverImageUrl: string | null;
  creatorId: string;          // User.id
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.4 Comment

```typescript
interface Comment {
  id: string;
  postId: string;             // Post.id
  authorId: string;           // User.id
  parentCommentId: string | null;  // for threading
  content: string;            // max 1000 chars
  upvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.5 Reputation

```typescript
interface Reputation {
  id: string;
  userId: string;             // User.id
  communityId: string;        // Community.id
  score: number;
  tier: 'newcomer' | 'regular' | 'trusted' | 'curator';
  updatedAt: Date;
}
```

### 8.6 Follow

```typescript
interface Follow {
  id: string;
  followerId: string;         // User.id
  followingId: string;        // User.id
  createdAt: Date;
}
```

### 8.7 CommunityMembership

```typescript
interface CommunityMembership {
  id: string;
  userId: string;             // User.id
  communityId: string;        // Community.id
  role: 'member' | 'moderator' | 'creator';
  joinedAt: Date;
}
```

### 8.8 Playlist

```typescript
interface Playlist {
  id: string;
  ownerId: string;            // User.id
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  trackCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistTrack {
  id: string;
  playlistId: string;         // Playlist.id
  linkUrl: string;
  title: string;              // extracted or user-provided
  artist: string;             // extracted or user-provided
  position: number;           // ordering
  addedAt: Date;
}
```

### 8.9 Upvote

```typescript
interface Upvote {
  id: string;
  userId: string;             // User.id
  targetType: 'post' | 'comment';
  targetId: string;           // Post.id or Comment.id
  createdAt: Date;
}
```

### 8.10 Notification

```typescript
interface Notification {
  id: string;
  userId: string;             // recipient User.id
  type: 'follow' | 'upvote_post' | 'upvote_comment' | 'comment' | 'reply' | 'mention';
  actorId: string;            // User.id who triggered
  targetType: string;
  targetId: string;
  isRead: boolean;
  createdAt: Date;
}
```

---

## 9. Technical Architecture

### 9.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├─────────────────────────────────────────────────────────────┤
│  Web App (React/Next.js)  │  Mobile App (React Native)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│                   (Authentication, Rate Limiting)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                          │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ User Service │ Post Service │ Feed Service │ Notification  │
│              │              │              │ Service       │
└──────────────┴──────────────┴──────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────┬───────────────────┬──────────────────┤
│ PostgreSQL          │ Redis             │ Elasticsearch    │
│ (Primary DB)        │ (Cache, Sessions) │ (Search)         │
└─────────────────────┴───────────────────┴──────────────────┘
```

### 9.2 Technology Stack (Recommended)

**Frontend:**
- Next.js 14+ (React framework)
- TypeScript
- Tailwind CSS
- React Query (data fetching)
- Zustand (state management)

**Backend:**
- Node.js with Fastify
- TypeScript
- Prisma (ORM)
- PostgreSQL (primary database)
- Redis (caching, sessions, rate limiting)

**Infrastructure:**
- Vercel (frontend hosting)
- Railway or Render (backend hosting)
- Supabase or Neon (managed PostgreSQL)
- Upstash (managed Redis)
- Cloudflare (CDN, DDoS protection)

**Third-Party Services:**
- Auth0 or Clerk (authentication)
- Resend (transactional email)
- Sentry (error tracking)
- PostHog (analytics)

### 9.3 API Design

**REST Endpoints (Core):**

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

# Users
GET    /api/users/:username
PATCH  /api/users/:username
GET    /api/users/:username/posts
GET    /api/users/:username/playlists
GET    /api/users/:username/followers
GET    /api/users/:username/following

# Posts
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/upvote
DELETE /api/posts/:id/upvote
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments

# Communities
GET    /api/communities
POST   /api/communities
GET    /api/communities/:slug
PATCH  /api/communities/:slug
GET    /api/communities/:slug/posts
POST   /api/communities/:slug/join
DELETE /api/communities/:slug/leave

# Feed
GET    /api/feed              # personalized feed
GET    /api/feed/following    # following only
GET    /api/feed/communities  # communities only

# Search
GET    /api/search?q=<query>&type=<users|communities|posts>

# Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
POST   /api/notifications/read-all
```

### 9.4 Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| General API | 100 requests | 1 minute |
| Post creation | 10 posts | 1 hour |
| #NewAndUpcoming posts | 1 post | 7 days |
| Comment creation | 30 comments | 1 hour |
| Follow actions | 50 follows | 1 hour |
| Search | 30 requests | 1 minute |

---

## 10. MVP Scope

### 10.1 MVP Features (Phase 1)

**Must Have:**
- [ ] User registration and authentication
- [ ] User profiles with bio and streaming links
- [ ] Follow/unfollow users
- [ ] Create posts (track, album, playlist, text)
- [ ] Upvote posts
- [ ] Comment on posts (threaded)
- [ ] Artist communities (a/) - auto-created
- [ ] User communities (u/) - manual creation
- [ ] Join/leave communities
- [ ] Basic feed (following + communities)
- [ ] Basic search (users, communities)
- [ ] Playlists on profiles
- [ ] Basic notifications (follows, upvotes, comments)

**Nice to Have (if time permits):**
- [ ] Reputation system (basic scoring)
- [ ] #NewAndUpcoming tag with rate limiting
- [ ] Email notifications digest
- [ ] Community moderation tools

### 10.2 MVP Exclusions (Deferred)

- Direct messages
- Embedded music players
- Collaborative playlists
- Advanced analytics
- Mobile app (web-first)
- Verified artist program
- Monetization features
- API for third parties

### 10.3 MVP Timeline Estimate

**Phase 1: Foundation (Weeks 1-4)**
- Database schema and migrations
- Authentication system
- User profiles CRUD
- Follow system

**Phase 2: Core Features (Weeks 5-8)**
- Posts CRUD
- Comments system
- Upvote system
- Basic feed algorithm

**Phase 3: Communities (Weeks 9-12)**
- Community creation and management
- Community feeds
- Artist community auto-creation
- Community membership

**Phase 4: Polish (Weeks 13-16)**
- Search functionality
- Notifications
- Playlists
- Reputation basics
- Bug fixes and optimization

---

## 11. Future Roadmap

### 11.1 Phase 2: Growth Features

- **Mobile App:** React Native app for iOS and Android
- **Rich Embeds:** Preview cards for streaming links
- **Advanced Search:** Full-text search, filters, saved searches
- **Reputation v2:** Badges, achievements, leaderboards
- **Collaborative Playlists:** Multiple contributors
- **DMs:** Private messaging between users

### 11.2 Phase 3: Monetization & Scale

- **Premium Subscriptions:** Ad-free, extra features
- **Artist Tools:** Analytics, fan insights, promotional posts
- **Verified Program:** Official artist verification
- **API Access:** For third-party integrations
- **Events:** Virtual listening parties, live discussions

### 11.3 Phase 4: Platform Expansion

- **Podcast Support:** Extend to podcast discussions
- **Live Audio:** Clubhouse-style music discussions
- **NFT Integration:** For digital collectibles (if market demands)
- **Record Label Tools:** A&R discovery features
- **Sync Licensing:** Connect artists with opportunities

---

## 12. Success Metrics

### 12.1 North Star Metric

**Weekly Active Discoverers (WAD):** Users who discover and engage with music from a user they follow (not from explore/trending) at least once per week.

### 12.2 Primary Metrics

| Metric | Definition | Target (6 months) |
|--------|------------|-------------------|
| MAU | Monthly Active Users | 10,000 |
| WAU | Weekly Active Users | 5,000 |
| DAU/MAU | Stickiness ratio | 25% |
| Posts per WAU | Avg posts per weekly active user | 2 |
| Follow connections | Avg follows per user | 15 |

### 12.3 Engagement Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Feed scroll depth | % of feed scrolled | 60% |
| Link click rate | % of posts with link clicks | 20% |
| Comment rate | Comments per post | 3 |
| Upvote rate | Upvotes per post | 10 |
| Return rate | % users returning within 7 days | 40% |

### 12.4 Community Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Communities created | Total user communities | 500 |
| Avg community size | Members per community | 50 |
| Community engagement | Posts per community per week | 10 |

### 12.5 Artist Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Artist signups | Users marked as artist | 500 |
| Artist communities | a/ communities created | 200 |
| Artist engagement rate | Comments on artist posts | 5x normal |

---

## 13. Risks & Mitigations

### 13.1 Product Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Cold start problem | High | High | Seed with curators, invite-only beta |
| Low engagement | High | Medium | Gamification, notifications, email digests |
| Spam/abuse | Medium | High | Rate limiting, reputation gates, mod tools |
| Feature creep | Medium | Medium | Strict MVP scope, user feedback driven |

### 13.2 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Scalability issues | High | Low | Start with proven stack, plan for scale |
| Data loss | Critical | Low | Regular backups, multi-region DB |
| Security breach | Critical | Low | Auth0/Clerk, security audits, HTTPS |
| API rate limits (streaming) | Medium | Medium | Cache metadata, graceful degradation |

### 13.3 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Competition | High | Medium | Focus on niche, community moat |
| Legal (music rights) | High | Low | Link-only (no hosting), clear ToS |
| Monetization failure | Medium | Medium | Multiple revenue streams planned |
| Team burnout | High | Medium | Realistic timelines, phased approach |

---

## Appendix A: Competitive Analysis

### Direct Competitors

**Letterboxd (Film)**
- Strength: Beautiful UI, logging culture
- Weakness: Logging doesn't translate to music
- Lesson: Focus on community, not just cataloging

**RateYourMusic / Sonemic**
- Strength: Comprehensive database, serious users
- Weakness: Dated UI, intimidating for casuals
- Lesson: Balance depth with accessibility

**Last.fm**
- Strength: Scrobbling, listening history
- Weakness: Declining community, passive tracking
- Lesson: Active engagement > passive tracking

### Adjacent Competitors

**Discord (Music Servers)**
- Strength: Real-time, voice chat
- Weakness: Chaotic, ephemeral, no threading
- Lesson: Structure and persistence matter

**Reddit (Music Subreddits)**
- Strength: Threading, large communities
- Weakness: Anonymous, karma gaming
- Lesson: Identity and reputation matter

---

## Appendix B: User Research Insights

### Key Findings from WhatsApp Music Group Observation

1. **Information Overload:** 999+ unread messages common
2. **Trust Networks:** Users mentally track whose recs to trust
3. **Desire for Threading:** Album discussions get fragmented
4. **Emerging Artist Struggle:** Quality posts get buried
5. **Reputation Matters:** "Association of Rock" is real social capital

### User Quotes

> "I scroll past 90% of messages looking for posts from like 5 people."

> "I want feedback on my music, not just likes. Tell me what you think."

> "There should be a place where being known for good taste actually means something."

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| WAD | Weekly Active Discoverers - users who discover music through follows |
| Reputation | Community-specific score based on post/comment upvotes |
| Curator | High-reputation user with mod privileges |
| a/ community | Artist-focused community (e.g., a/radiohead) |
| u/ community | User-created community (e.g., u/indierock) |
| #NewAndUpcoming | Rate-limited tag for emerging artist posts |

---

*Document maintained by: Product Team*
*Last updated: November 25, 2024*
*Next review: December 25, 2024*
