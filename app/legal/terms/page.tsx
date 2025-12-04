
import React from 'react';

export default function TermsOfService() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p>By accessing or using PadLink, you agree to be bound by these Terms of Service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. User Conduct</h2>
        <p>You agree not to use PadLink for any unlawful purpose or in any way that interrupts, damages, or impairs the service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Termination</h2>
        <p>We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Disclaimer</h2>
        <p>PadLink is provided &quot;as is&quot; without warranties of any kind, either express or implied.</p>
      </section>
    </div>
  );
}
