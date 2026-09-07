import { useState } from "react";
import { flatDetails, securityDetails, maintenanceDetails } from "../data";

function FloatingIslands() {
  return (
    <svg
      className="hero-islands"
      viewBox="0 0 1400 620"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* left island */}
      <g opacity="0.9">
        <ellipse cx="150" cy="470" rx="140" ry="26" fill="#e9c9a8" />
        <path
          d="M60 470c10-70 60-110 90-140"
          stroke="#4c305a"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="150" cy="330" rx="46" ry="16" fill="#7fae6a" />
        <ellipse cx="110" cy="345" rx="34" ry="12" fill="#8ec178" />
      </g>
      {/* right island */}
      <g opacity="0.85">
        <ellipse cx="1260" cy="440" rx="150" ry="28" fill="#e9c9a8" />
        <path
          d="M1300 440c-8-64-52-100-78-128"
          stroke="#4c305a"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="1300" cy="308" rx="42" ry="15" fill="#7fae6a" />
        <ellipse cx="1335" cy="322" rx="30" ry="11" fill="#8ec178" />
      </g>
      {/* clouds */}
      <g opacity="0.6">
        <ellipse cx="260" cy="90" rx="70" ry="22" fill="#ffffff" />
        <ellipse cx="1120" cy="130" rx="90" ry="26" fill="#ffffff" />
      </g>
    </svg>
  );
}

export default function Hero() {
  const [mockActive, setMockActive] = useState<string>("Flats");
  return (
    <>
      <section className="hero">
        <FloatingIslands />

        <div className="hero-content">
          <h1 className="hero-heading">
            Run your society, <em>actually</em> in sync
          </h1>
          <p className="hero-sub">
            Flats, blocks, residents, and security staff — SafeSync keeps every
            role in your society working from the same up-to-date record.
          </p>
        </div>

        <div className="mock-wrap h-auto">
          <div className="mock-card">
            <div className="mock-toolbar">
              <span />
              <span />
              <span />
            </div>
            <div className="mock-body">
              <div className="mock-sidebar cursor-pointer">
                <div
                  className={`mock-sidebar-item ${
                    mockActive === "Flats" ? "active" : ""
                  }`}
                  onClick={() => setMockActive("Flats")}
                >
                  Flats
                </div>
                <div
                  className={`mock-sidebar-item ${mockActive === "Residents" ? "active" : ""}`}
                  onClick={() => setMockActive("Residents")}
                >
                  Residents
                </div>
                <div
                  className={`mock-sidebar-item ${mockActive === "Security" ? "active" : ""}`}
                  onClick={() => setMockActive("Security")}
                >
                  Security
                </div>
                <div
                  className={`mock-sidebar-item ${mockActive === "Maintenance" ? "active" : ""}`}
                  onClick={() => setMockActive("Maintenance")}
                >
                  Maintenance
                </div>
              </div>
              <div className="mock-main min-h-62.5">
                {mockActive === "Flats" && (
                  <>
                    <div className="mock-main-title active">
                      Block B · Occupancy
                    </div>
                    {flatDetails.map((flat, index) => {
                      return (
                        <div className="mock-row" key={index}>
                          <span>{flat.flatNumber}</span>
                          <span>{flat.owner || "—"}</span>
                          <span
                            className={`mock-badge ${flat.status.toLowerCase()}`}
                          >
                            {flat.status}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}

                {mockActive === "Security" && (
                  <>
                    <div className="mock-main-title active">
                      Block B · Security
                    </div>

                    {securityDetails.map((security, index) => {
                      return (
                        <div className="mock-row" key={index}>
                          <span>{security.name}</span>
                          <span>{security.shift}</span>
                          <span
                            className={`mock-badge ${
                              security.status === "On Duty"
                                ? "occupied"
                                : "vacant"
                            }`}
                          >
                            {security.status}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}

                {mockActive === "Maintenance" && (
                  <>
                    <div className="mock-main-title active">
                      Block B · Maintenance
                    </div>

                    {maintenanceDetails.map((maintenance, index) => {
                      return (
                        <div className="mock-row" key={index}>
                          <span>{maintenance.issue}</span>
                          <span>{maintenance.location}</span>
                          <span
                            className={`mock-badge ${
                              maintenance.status === "Resolved"
                                ? "occupied"
                                : "vacant"
                            }`}
                          >
                            {maintenance.status}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features-head">
          <h2>
            Built around how a society <em>actually</em> runs
          </h2>
          <p>
            Every account is scoped to a role, every flat has a status, and
            every session stays secure without anyone having to think about it.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card wash-lilac">
            <h3>Built for every role</h3>
            <p>
              Secretaries, residents, security staff, and maintenance teams each
              sign in to a view scoped to what they need.
            </p>
          </div>
          <div className="feature-card wash-blossom">
            <h3>Every flat, mapped</h3>
            <p>
              Blocks and flats are tracked with live occupancy status, so the
              society office always knows who's actually living where.
            </p>
          </div>
          <div className="feature-card wash-blossom">
            <h3>Sessions that stay secure</h3>
            <p>
              JWT authentication with rotating refresh tokens keeps every login
              safe, without adding friction for the people using it.
            </p>
          </div>
          <div className="feature-card wash-lilac">
            <h3>One record per resident</h3>
            <p>
              Registration, login, and profile data live in a single verified
              account tied to a flat — no duplicate spreadsheets.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
