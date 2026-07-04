export default function PrivacyPage() {
  return (
    <section className="max-w-5xl mx-auto py-10 text-white">
      <h2 className="text-3xl font-bold mb-4">Privacy Policy</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-4">
        At CareerPath AI, we respect your privacy and are committed to protecting your personal data. This privacy policy explains what information we collect, how we use it, and how we keep it secure.
      </p>
      <div className="space-y-4 text-sm text-white/70 leading-7">
        <div>
          <h3 className="font-semibold text-white">Information We Collect</h3>
          <p>
            We may collect profile data, login details, resume content, saved job preferences, and usage analytics to personalize your experience. All data is stored locally and securely on our servers or in your browser storage based on your interaction.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">How We Use Your Data</h3>
          <p>
            Your information helps us deliver relevant job matches, improve AI-powered recommendations, and maintain your session and profile state. We do not sell your personal data to third parties.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Data Security</h3>
          <p>
            We use industry-standard security practices to protect your information. For production deployments, make sure your environment uses HTTPS, secure credentials, and strong authentication.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Your Rights</h3>
          <p>
            You can review, update, or delete your profile information anytime. If you have questions about your data, please contact us using the Contact page.
          </p>
        </div>
      </div>
    </section>
  );
}
