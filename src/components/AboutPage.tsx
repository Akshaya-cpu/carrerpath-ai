export default function AboutPage() {
  return (
    <section className="max-w-5xl mx-auto py-10 text-white">
      <h2 className="text-3xl font-bold mb-4">About CareerPath AI</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-4">
        CareerPath AI helps professionals manage their resumes, apply to jobs, and find better matches using intelligent career tools.
      </p>
      <div className="space-y-4 text-sm text-white/70 leading-7">
        <div>
          <h3 className="font-semibold text-white">Our Mission</h3>
          <p>
            We empower career growth by making job search and resume optimization smarter, faster, and more personalized.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">What We Offer</h3>
          <p>
            From resume parsing and profile coaching to job tracking and interview preparation, CareerPath AI helps you stay organized and competitive.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Built For</h3>
          <p>
            Professionals, career changers, and anyone who wants a better way to surface meaningful job opportunities and present themselves confidently.
          </p>
        </div>
      </div>
    </section>
  );
}
