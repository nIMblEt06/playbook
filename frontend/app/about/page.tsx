'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Music2, Users, Star, Headphones, ArrowLeft, Twitter, Github, Mail } from 'lucide-react'

export default function AboutPage() {
  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Music2 className="w-12 h-12 text-primary" />
            <h1 className="text-5xl">TRACKD</h1>
          </div>
          <p className="text-xl text-foreground-muted">
            Discover music through trusted communities
          </p>
        </div>

        {/* What is Trackd */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6">WHAT IS TRACKD?</h2>
          <div className="space-y-4 text-foreground-muted leading-relaxed">
            <p>
              Trackd is a music social platform that helps you discover new music through
              the people and communities you trust. We believe the best music recommendations
              come from real people with shared tastes, not algorithms.
            </p>
            <p>
              Share your favorite tracks, follow music curators you admire, join communities
              around genres and artists you love, and build your own musical identity.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6">OUR MISSION</h2>
          <div className="card p-8">
            <p className="text-lg text-foreground-muted leading-relaxed">
              To create a space where music lovers can connect authentically, share their
              passion, and discover incredible music through genuine human connections
              rather than opaque algorithms. We're building a platform that celebrates
              musical diversity, supports independent artists, and empowers communities
              to shape the music landscape.
            </p>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-3xl mb-8">KEY FEATURES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Discover Music */}
            <div className="card p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary text-primary-foreground border-2 border-border-strong">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl mb-2">DISCOVER MUSIC</h3>
                  <p className="text-foreground-muted">
                    Find new tracks and artists through your personalized feed, curated
                    by the people you follow and the communities you join.
                  </p>
                </div>
              </div>
            </div>

            {/* Communities */}
            <div className="card p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary text-secondary-foreground border-2 border-border-strong">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl mb-2">COMMUNITIES</h3>
                  <p className="text-foreground-muted">
                    Join communities around your favorite genres, artists, or vibes.
                    Connect with like-minded music lovers and share discoveries.
                  </p>
                </div>
              </div>
            </div>

            {/* Curators */}
            <div className="card p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent text-accent-foreground border-2 border-border-strong">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl mb-2">CURATORS</h3>
                  <p className="text-foreground-muted">
                    Follow music curators with great taste. Build your reputation as
                    a curator yourself and grow your influence.
                  </p>
                </div>
              </div>
            </div>

            {/* Artists */}
            <div className="card p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary text-primary-foreground border-2 border-border-strong">
                  <Music2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl mb-2">ARTISTS</h3>
                  <p className="text-foreground-muted">
                    Support independent artists by sharing their work. Help great music
                    reach the right audiences through organic sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Social */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6">GET IN TOUCH</h2>
          <div className="card p-8">
            <p className="text-foreground-muted mb-6">
              Have questions, feedback, or want to collaborate? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:hello@trackd.app"
                className="btn-secondary flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                EMAIL US
              </a>
              <a
                href="https://twitter.com/trackdapp"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost flex items-center gap-2 border-2 border-border"
              >
                <Twitter className="w-4 h-4" />
                TWITTER
              </a>
              <a
                href="https://github.com/trackdapp"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost flex items-center gap-2 border-2 border-border"
              >
                <Github className="w-4 h-4" />
                GITHUB
              </a>
            </div>
          </div>
        </section>

        {/* Version & Back Link */}
        <div className="pt-8 border-t-2 border-border">
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <div>Version 1.0.0 • Built with passion for music</div>
            <Link
              href="/"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
