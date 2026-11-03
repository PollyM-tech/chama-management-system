import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Ellipsis,
  Home,
  Plus,
  Signal,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import Image from "next/image";

function Phone({ screen, label }: { screen: number; label: string }) {
  return (
    <div className={`showcase-phone phone-${screen}`} aria-label={label}>
      <div className="phone-notch" />
      <div className="phone-status">
        <span>9:41</span>
        <span>
          <Signal size={8} />
          <Wifi size={8} />
          <span className="phone-battery" />
        </span>
      </div>
      <div className="phone-appbar">
        <ChevronLeft size={11} />
        <span>
          {
            [
              "Contribute",
              "My savings",
              "Our chama",
              "Member loans",
              "Activity",
            ][screen]
          }
        </span>
        <Ellipsis size={12} />
      </div>
      {screen === 0 ? (
        <div className="phone-content">
          <div className="phone-mpesa">
            M<span>•</span>PESA
          </div>
          <p>Contribute to your chama</p>
          <span className="phone-muted">Enter amount</span>
          <strong className="phone-amount">KES 5,000</strong>
          <div className="phone-recipient">
            <Users size={15} />
            <span>
              Umoja Savings<small>Monthly contribution</small>
            </span>
            <Check size={12} />
          </div>
          <div className="phone-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "·", 0, "⌫"].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
          <div className="phone-button">
            Continue <ArrowUpRight size={10} />
          </div>
        </div>
      ) : screen === 1 ? (
        <div className="phone-content">
          <div className="phone-green-card">
            <span>Your savings</span>
            <strong>KES 86,000</strong>
            <small>Growing, together.</small>
          </div>
          <div className="phone-action-row">
            <span>
              <Plus size={12} /> Contribute
            </span>
            <span>
              <ArrowUpRight size={12} /> Statement
            </span>
          </div>
          <h4>Recent contributions</h4>
          {[
            "Monthly contribution",
            "Savings top-up",
            "Monthly contribution",
            "Savings top-up",
          ].map((t, i) => (
            <div className="phone-list-item" key={i}>
              <span className="phone-list-icon">
                <ArrowDownLeft size={12} />
              </span>
              <span>
                {t}
                <small>{["Today", "12 May", "1 May", "22 Apr"][i]}</small>
              </span>
              <b>+{i % 2 ? "2,000" : "5,000"}</b>
            </div>
          ))}
        </div>
      ) : screen === 2 ? (
        <div className="phone-content">
          <div className="phone-group-icon">
            <Users size={25} />
          </div>
          <h3>Umoja Savings</h3>
          <p>Stronger when we save together.</p>
          <div className="phone-two-stats">
            <span>
              <strong>32</strong>Members
            </span>
            <span>
              <strong>KES 428K</strong>Group savings
            </span>
          </div>
          <h4>Member contributions</h4>
          {[
            "Mary Wanjiku",
            "James Kariuki",
            "Amina Hassan",
            "David Otieno",
          ].map((name, i) => (
            <div className="phone-list-item" key={name}>
              <span className={`demo-mini-avatar avatar-${i % 3}`}>
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <span>
                {name}
                <small>Monthly contribution</small>
              </span>
              <b className="phone-paid">
                Paid <Check size={8} />
              </b>
            </div>
          ))}
        </div>
      ) : screen === 3 ? (
        <div className="phone-content">
          <p>A little support. A big next step.</p>
          <div className="phone-green-card">
            <span>Loan balance</span>
            <strong>KES 24,000</strong>
            <small>Next repayment: 5 June</small>
          </div>
          <div className="phone-loan-progress">
            <span>
              Repaid <b>60%</b>
            </span>
            <div>
              <i />
            </div>
          </div>
          <h4>Your repayment plan</h4>
          {["May repayment", "June repayment", "July repayment"].map((t, i) => (
            <div className="phone-list-item" key={t}>
              <span className="phone-list-icon">
                <Wallet size={12} />
              </span>
              <span>
                {t}
                <small>{i === 0 ? "Completed" : "Upcoming"}</small>
              </span>
              <b>8,000</b>
            </div>
          ))}
          <div className="phone-button">
            View loan details <ArrowUpRight size={10} />
          </div>
        </div>
      ) : (
        <div className="phone-content">
          <div className="phone-green-card">
            <span>Chama balance</span>
            <strong>KES 428,500</strong>
            <small>Every contribution counts.</small>
          </div>
          <h4>Latest activity</h4>
          {[
            "Contribution received",
            "New member joined",
            "Report generated",
            "Contribution received",
            "Loan repayment",
          ].map((t, i) => (
            <div className="phone-list-item" key={i}>
              <span className="phone-list-icon">
                {i === 1 ? <Users size={12} /> : <ArrowDownLeft size={12} />}
              </span>
              <span>
                {t}
                <small>{i + 2} minutes ago</small>
              </span>
              <Check size={10} />
            </div>
          ))}
        </div>
      )}
      <div className="phone-bottom-nav">
        <Home size={13} />
        <Wallet size={13} />
        <Users size={13} />
        <span className="phone-user-dot">AM</span>
      </div>
      <div className="phone-home-indicator" />
    </div>
  );
}

export function MobileShowcase() {
  return (
    <section id="mobile" className="mobile-showcase landing-wide">
      <div className="mobile-lifestyle-photo">
        <Image
          src="/images/chama-mobile.png"
          alt="A member checking her phone in a garden"
          fill
          sizes="(max-width: 650px) 100vw, 35vw"
        />
      </div>
      <div className="showcase-grid" aria-hidden="true" />
      <div className="section-heading">
        <span className="section-kicker">POWERFUL FEATURES</span>
        <h2>Mobile Experience</h2>
      </div>
      <div className="phone-lineup">
        {[
          "M-Pesa contribution preview",
          "Personal savings preview",
          "Chama members preview",
          "Member loan preview",
          "Activity feed preview",
        ].map((label, screen) => (
          <Phone screen={screen} label={label} key={label} />
        ))}
      </div>
      <p className="showcase-disclaimer">
        Illustrative product previews. Mobile tools and M-Pesa integration are
        planned.
      </p>
    </section>
  );
}
