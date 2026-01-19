'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { FileText, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-5xl">TERMS OF SERVICE</h1>
          </div>
          <p className="text-foreground-muted">
            Last Updated: January 16, 2026
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">1. INTRODUCTION</h2>
          <div className="space-y-4 text-foreground-muted leading-relaxed">
            <p>
              Welcome to Trackd (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our platform,
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them
              carefully before using our services.
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use the platform.
              We reserve the right to modify these Terms at any time, and will notify users
              of significant changes.
            </p>
          </div>
        </section>

        {/* Account Terms */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">2. ACCOUNT TERMS</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl mb-3 text-foreground">2.1 Account Creation</h3>
              <div className="text-foreground-muted leading-relaxed space-y-2">
                <p>
                  You must be at least 13 years old to create an account. When creating an
                  account, you must provide accurate and complete information.
                </p>
                <p>
                  You are responsible for maintaining the security of your account and password.
                  Trackd will not be liable for any loss or damage from your failure to maintain
                  account security.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">2.2 Account Responsibilities</h3>
              <div className="text-foreground-muted leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You may not use another user&apos;s account without permission</li>
                  <li>You may not create multiple accounts to manipulate the platform</li>
                  <li>You are responsible for all activity under your account</li>
                  <li>You must notify us immediately of any unauthorized account access</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">2.3 Account Termination</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  We reserve the right to suspend or terminate accounts that violate these Terms
                  or engage in activities harmful to the platform or other users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Rules */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">3. CONTENT RULES</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl mb-3 text-foreground">3.1 User Content</h3>
              <div className="text-foreground-muted leading-relaxed space-y-2">
                <p>
                  You retain ownership of content you post on Trackd. By posting content, you
                  grant us a worldwide, non-exclusive, royalty-free license to use, reproduce,
                  and distribute your content in connection with the platform.
                </p>
                <p>
                  You are solely responsible for the content you post and must ensure you have
                  all necessary rights and permissions.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.2 Prohibited Content</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p className="mb-2">You may not post content that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains hate speech, harassment, or threats</li>
                  <li>Promotes violence or illegal activities</li>
                  <li>Contains spam or misleading information</li>
                  <li>Attempts to manipulate or game the platform</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.3 Music Content</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  Trackd integrates with third-party music services (Spotify, YouTube, SoundCloud).
                  You must comply with the terms of service of these platforms when sharing music
                  content. We do not host music files directly.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.4 Content Moderation</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  We reserve the right to remove content that violates these Terms or is otherwise
                  objectionable. We may, but are not obligated to, monitor or review content posted
                  by users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">4. PRIVACY & DATA</h2>
          <div className="text-foreground-muted leading-relaxed space-y-4">
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect,
              use, and protect your personal information. By using Trackd, you also agree
              to our Privacy Policy.
            </p>
            <p>
              <Link href="/privacy" className="text-primary hover:underline">
                View our Privacy Policy →
              </Link>
            </p>
          </div>
        </section>

        {/* Disclaimers */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">5. DISCLAIMERS & LIMITATIONS</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl mb-3 text-foreground">5.1 Service Availability</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  Trackd is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
                  that the service will be uninterrupted, secure, or error-free. We may modify,
                  suspend, or discontinue the service at any time.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">5.2 Third-Party Services</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  Trackd integrates with third-party music services. We are not responsible for
                  the availability, content, or policies of these external services.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">5.3 Limitation of Liability</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  [Legal text to be added] - Trackd and its affiliates will not be liable for
                  any indirect, incidental, special, consequential, or punitive damages arising
                  from your use of the service.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">6. INTELLECTUAL PROPERTY</h2>
          <div className="text-foreground-muted leading-relaxed space-y-4">
            <p>
              The Trackd platform, including its design, features, and original content, is
              owned by Trackd and protected by intellectual property laws. You may not copy,
              modify, or reverse engineer any part of the platform without permission.
            </p>
            <p>
              The Trackd name and logo are trademarks. You may not use them without our
              prior written consent.
            </p>
          </div>
        </section>

        {/* Changes to Terms */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">7. CHANGES TO TERMS</h2>
          <div className="text-foreground-muted leading-relaxed">
            <p>
              We may update these Terms from time to time. We will notify users of significant
              changes via email or platform notification. Your continued use of Trackd after
              changes take effect constitutes acceptance of the updated Terms.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">8. CONTACT</h2>
          <div className="card p-6">
            <p className="text-foreground-muted mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="text-foreground-muted">
              <p>Email: niketshwetabh@gmail.com</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t-2 border-border">
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <div>© 2026 Trackd. All rights reserved.</div>
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
