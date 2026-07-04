export default function TermsPage() {
  return (
    <section className="max-w-5xl mx-auto py-10 text-white">
      <h2 className="text-3xl font-bold mb-4">Terms of Service</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-4">
        These Terms of Service govern your access and use of CareerPath AI. By using the app, you agree to comply with these terms and the policies referenced herein.
      </p>
      <div className="space-y-4 text-sm text-white/70 leading-7">
        <div>
          <h3 className="font-semibold text-white">Use of the Platform</h3>
          <p>
            CareerPath AI is provided for personal career planning, resume management, and job discovery. You may not use the service for unlawful activities or to harm others.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Account Responsibility</h3>
          <p>
            You are responsible for keeping your login information secure. Notify us if you believe your account has been compromised.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Content Disclaimer</h3>
          <p>
            The information provided by CareerPath AI is for informational purposes only. We do not guarantee job placement or specific outcomes.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Changes to Terms</h3>
          <p>
            We may update these terms over time. Continued use of the app after changes indicates acceptance of the revised terms.
          </p>
        </div>
      </div>
    </section>
  );
}
