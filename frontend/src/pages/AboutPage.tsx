import { ArrowRight, Building2, CircleCheck, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const principles = [
  {
    icon: Building2,
    title: "One shared record",
    description: "Keep flats, residents, visitors and society operations connected in one reliable workspace.",
  },
  {
    icon: ShieldCheck,
    title: "The right access for every role",
    description: "Give secretaries, residents, security and maintenance teams the tools and information they need.",
  },
  {
    icon: UsersRound,
    title: "A more connected community",
    description: "Make everyday coordination clearer, so residents and staff can focus on the people in their community.",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <Navbar />
      <main>
        <section className="about-hero">
          <div className="about-hero-orb about-hero-orb-one" />
          <div className="about-hero-orb about-hero-orb-two" />
          <div className="about-hero-content">
            <span className="about-eyebrow"><CircleCheck size={15} /> Made for everyday community life</span>
            <h1>Better managed societies, <em>closer communities.</em></h1>
            <p>SafeSync brings the people and day-to-day work of a residential society into one clear, secure place.</p>
            <div className="about-hero-actions">
              <Link to="/signup" className="about-primary-link">Get started <ArrowRight size={17} /></Link>
              <Link to="/#features" className="about-secondary-link">Explore features</Link>
            </div>
          </div>
          <div className="about-hero-caption"><span /> A simpler way to stay in sync</div>
        </section>

        <section className="about-intro">
          <div className="about-intro-label">Why SafeSync</div>
          <div>
            <h2>Society management should feel organized, not overwhelming.</h2>
            <p>When updates, visitor records and maintenance requests are scattered, small tasks become difficult to follow. SafeSync gives every role a shared, up-to-date view of what is happening across the society.</p>
          </div>
        </section>

        <section className="about-principles" aria-labelledby="about-principles-heading">
          <div className="about-section-heading">
            <p>Built around your community</p>
            <h2 id="about-principles-heading">A better experience for everyone.</h2>
          </div>
          <div className="about-principle-grid">
            {principles.map(({ icon: Icon, title, description }, index) => (
              <article className="about-principle-card" key={title}>
                <span className="about-principle-number">0{index + 1}</span>
                <span className="about-principle-icon"><Icon size={22} strokeWidth={1.8} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-cta">
          <div><p>Ready to get started?</p><h2>Bring your society into sync.</h2></div>
          <Link to="/signup">Create your account <ArrowRight size={17} /></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
