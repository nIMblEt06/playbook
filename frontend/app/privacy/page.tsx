'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-5xl">PRIVACY POLICY</h1>
          </div>
          <p className="text-foreground-muted">
            Last Updated: January 16, 2026
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">INTRODUCTION</h2>
          <div className="space-y-4 text-foreground-muted leading-relaxed">
            <p>
              At Trackd, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, store, and protect your personal information when you use our
              platform.
            </p>
            <p>
              By using Trackd, you agree to the collection and use of information in accordance
              with this policy. If you do not agree with our practices, please do not use the
              platform.
            </p>
          </div>
        </section>

        {/* Data Collection */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">1. INFORMATION WE COLLECT</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl mb-3 text-foreground">1.1 Information You Provide</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p className="mb-2">When you create an account and use Trackd, we collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information (username, email address, password)</li>
                  <li>Profile information (display name, bio, profile picture)</li>
                  <li>Content you post (music shares, comments, messages)</li>
                  <li>Community and playlist data you create</li>
                  <li>Your interactions (likes, follows, shares)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">1.2 Automatically Collected Information</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p className="mb-2">We automatically collect certain information when you use the platform:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Device information (device type, operating system, browser type)</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>IP address and general location information</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">1.3 Third-Party Data</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  When you connect third-party music services (Spotify, YouTube, SoundCloud),
                  we may receive information from these services in accordance with their
                  privacy policies and your authorization. This may include your listening
                  history, playlists, and preferences on those platforms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How We Use Data */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">2. HOW WE USE YOUR INFORMATION</h2>
          <div className="space-y-6">
            <div className="text-foreground-muted leading-relaxed">
              <p className="mb-4">We use the information we collect to:</p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg mb-2 text-foreground">Provide and Improve Services</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Operate and maintain the platform</li>
                    <li>Personalize your experience and feed</li>
                    <li>Develop new features and improvements</li>
                    <li>Analyze usage patterns and trends</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Communication</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Send you notifications about activity on the platform</li>
                    <li>Respond to your inquiries and support requests</li>
                    <li>Send important updates about our services</li>
                    <li>Provide promotional communications (with your consent)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Safety and Security</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Protect against fraud and abuse</li>
                    <li>Enforce our Terms of Service</li>
                    <li>Investigate and prevent violations</li>
                    <li>Ensure platform security and integrity</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Legal Compliance</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Comply with legal obligations</li>
                    <li>Respond to legal requests</li>
                    <li>Protect our rights and property</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">3. HOW WE SHARE YOUR INFORMATION</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl mb-3 text-foreground">3.1 Public Information</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  Some information you provide is public by default, including your username,
                  display name, profile picture, bio, and posts you share. This information
                  can be seen by all Trackd users and may be indexed by search engines.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.2 With Your Consent</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  We may share your information with third parties when you give us explicit
                  permission, such as when connecting external music services.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.3 Service Providers</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  We work with service providers who help us operate the platform (hosting,
                  analytics, customer support). These providers have access to your information
                  only to perform services on our behalf and are obligated to protect it.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.4 Legal Requirements</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  We may disclose your information if required by law, court order, or legal
                  process, or if we believe disclosure is necessary to protect rights, safety,
                  or property.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-foreground">3.5 Business Transfers</h3>
              <div className="text-foreground-muted leading-relaxed">
                <p>
                  [Legal text to be added] - If Trackd is involved in a merger, acquisition,
                  or sale of assets, your information may be transferred as part of that
                  transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">4. COOKIES & TRACKING</h2>
          <div className="space-y-6">
            <div className="text-foreground-muted leading-relaxed space-y-4">
              <p>
                We use cookies and similar tracking technologies to collect and store
                information when you use Trackd. Cookies are small text files stored on
                your device that help us recognize you and remember your preferences.
              </p>
              <div>
                <h3 className="text-lg mb-2 text-foreground">Types of Cookies We Use</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Essential Cookies:</strong> Required for the platform to function
                    (authentication, security)
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand how users interact
                    with the platform
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> Remember your settings and preferences
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> Track effectiveness of promotional
                    campaigns (with consent)
                  </li>
                </ul>
              </div>
              <p>
                You can control cookies through your browser settings, but disabling cookies
                may affect platform functionality.
              </p>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">5. DATA SECURITY</h2>
          <div className="text-foreground-muted leading-relaxed space-y-4">
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction.
            </p>
            <p>
              However, no method of transmission over the internet or electronic storage is
              100% secure. While we strive to protect your information, we cannot guarantee
              absolute security.
            </p>
            <div className="card p-6 bg-muted">
              <p className="text-sm">
                <strong className="text-foreground">Security Measures Include:</strong> Encrypted
                data transmission (HTTPS), secure password storage (hashing), regular security
                audits, access controls, and monitoring for suspicious activity.
              </p>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">6. DATA RETENTION</h2>
          <div className="text-foreground-muted leading-relaxed space-y-4">
            <p>
              We retain your personal information for as long as necessary to provide our
              services and fulfill the purposes outlined in this Privacy Policy. When you
              delete your account, we will delete or anonymize your personal information,
              except where we are required to retain it for legal or legitimate business
              purposes.
            </p>
            <p>
              Some information may remain in backups or archives for a limited time after
              deletion.
            </p>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">7. YOUR RIGHTS & CHOICES</h2>
          <div className="space-y-6">
            <div className="text-foreground-muted leading-relaxed">
              <p className="mb-4">You have the following rights regarding your personal information:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg mb-2 text-foreground">Access & Portability</h3>
                  <p>
                    You can access and download your personal information through your account
                    settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Correction</h3>
                  <p>
                    You can update or correct your information through your profile settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Deletion</h3>
                  <p>
                    You can request deletion of your account and personal information. Some
                    information may be retained as required by law or for legitimate purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Communication Preferences</h3>
                  <p>
                    You can control what notifications and emails you receive through your
                    settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg mb-2 text-foreground">Data Processing Objection</h3>
                  <p>
                    You can object to certain types of data processing. This may limit your
                    ability to use some features.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <p className="text-foreground-muted">
                To exercise your rights, please contact us at{' '}
                <a href="mailto:niketshwetabh@gmail.com" className="text-primary hover:underline">
                  niketshwetabh@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">8. CHILDREN&apos;S PRIVACY</h2>
          <div className="text-foreground-muted leading-relaxed space-y-4">
            <p>
              Trackd is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13. If we become aware that
              we have collected information from a child under 13, we will take steps to
              delete that information.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with
              personal information, please contact us.
            </p>
          </div>
        </section>

        {/* International Users */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">9. INTERNATIONAL DATA TRANSFERS</h2>
          <div className="text-foreground-muted leading-relaxed space-y-4">
            <p>
              Trackd is operated from [Location to be added]. If you are accessing the platform
              from outside this region, your information may be transferred to, stored, and
              processed in locations where our servers or service providers are located.
            </p>
            <p>
              By using Trackd, you consent to the transfer of your information to countries
              that may have different data protection laws than your country of residence.
            </p>
            <p className="text-sm">
              [Legal text to be added] - For users in the European Economic Area, we ensure
              adequate safeguards are in place for international transfers.
            </p>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">10. CHANGES TO THIS POLICY</h2>
          <div className="text-foreground-muted leading-relaxed">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes by email or through a prominent notice on the platform.
              Your continued use of Trackd after changes take effect constitutes acceptance
              of the updated policy.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl mb-6">11. CONTACT US</h2>
          <div className="card p-6">
            <p className="text-foreground-muted mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <div className="text-foreground-muted space-y-2">
              <p>
                <strong className="text-foreground">Email:</strong>{' '}
                <a href="mailto:niketshwetabh@gmail.com" className="text-primary hover:underline">
                  niketshwetabh@gmail.com
                </a>
              </p>
              <p>
                <strong className="text-foreground">Data Protection Officer:</strong>{' '}
                <a href="mailto:niketshwetabh@gmail.com" className="text-primary hover:underline">
                  niketshwetabh@gmail.com
                </a>
              </p>
              <p>
                <strong className="text-foreground">Address:</strong> [Address to be added]
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t-2 border-border">
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <div>© 2026 Trackd. Your privacy matters.</div>
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
