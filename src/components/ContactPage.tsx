export default function ContactPage() {
  return (
    <section className="max-w-5xl mx-auto py-10 text-white">
      <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-4">
        Need help with your account or want to share feedback? We’re here to help.
      </p>
      <div className="space-y-4 text-sm text-white/70 leading-7">
        <div>
          <h3 className="font-semibold text-white">Get in Touch</h3>
          <p>
            Email us at <a href="mailto:support@careerpath.ai" className="text-indigo-300 underline">support@careerpath.ai</a> and we’ll respond within 1-2 business days.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Feedback</h3>
          <p>
            Have ideas for new features or want to report a bug? Send us a message and let us know how we can improve your experience.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Support Hours</h3>
          <p>
            Monday to Friday, 9:00 AM to 6:00 PM (local time). We appreciate your patience and will do our best to help quickly.
          </p>
        </div>
      </div>
    </section>
  );
}
