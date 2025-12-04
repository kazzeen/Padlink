
import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p>PadLink respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users. This may include your name, email address, and profile picture.</p>
        <p className="mt-2">We also collect information automatically when you use our service, such as your IP address and device information.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
        <p>We use your information to provide and improve our service, match you with potential roommates, and communicate with you.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Sharing</h2>
        <p>We do not sell your personal information. We may share your information with service providers who help us operate our business, or as required by law.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us.</p>
      </section>
    </div>
  );
}
