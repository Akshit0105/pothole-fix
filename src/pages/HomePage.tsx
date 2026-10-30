import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PotholeImage } from '../components/common/PotholeImage';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-primary text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Municipal Road Safety Intelligence · Chandigarh &amp; Punjab Pilot</span>
        </div>

        <h1 className="font-display-hero text-4xl sm:text-6xl font-extrabold text-on-surface leading-tight tracking-tight">
          Smarter Roads. <br className="hidden sm:block" />
          <span className="text-primary-container">Safer Journeys.</span>
        </h1>

        <p className="font-body-lg text-base sm:text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
          AI-powered road hazard detection, citizen reporting, and municipal triage dispatch platform designed to eliminate road hazards across Indian arterial corridors.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/citizen/report">
            <Button size="lg" icon={<span className="material-symbols-outlined text-[20px]">add_a_photo</span>}>
              Report a Pothole
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg" icon={<span className="material-symbols-outlined text-[20px]">account_balance</span>}>
              Authority Triage Portal
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="ghost" size="lg" icon={<span className="material-symbols-outlined text-[20px]">flowsheet</span>}>
              How It Works
            </Button>
          </a>
        </div>

        {/* Hero Photographic Evidence Banner with Authentic High-Res Photos */}
        <div className="pt-6 max-w-4xl mx-auto text-left">
          <Card padding="md" className="overflow-hidden shadow-lg border border-outline-variant/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-surface-container-high gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                  Photographic Triage Evidence Standard
                </span>
                <h2 className="text-lg font-bold text-on-surface">
                  Sector 17 Plaza Corridor, Chandigarh (Report #PF-101)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded bg-surface-container-low text-primary-container font-semibold border border-outline-variant/30">
                  GPS: 30.7398° N, 76.7827° E
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  LEVEL-1 CERTIFIED
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Damaged Pre-Repair State */}
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden aspect-video border border-outline-variant/30">
                  <PotholeImage
                    src="/photos/pothole-sector17.jpg"
                    alt="Pre-repair asphalt pothole in Sector 17"
                    className="w-full h-full object-cover"
                    fallbackType="critical"
                    showBadge
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-error text-white text-[11px] font-bold">
                    Pre-Repair
                  </div>
                </div>
                <p className="text-xs text-secondary">
                  Fractured asphalt crater with loose aggregate debris. Class-A arterial hazard classification verified by MC Chandigarh.
                </p>
              </div>

              {/* Restored State */}
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden aspect-video border border-outline-variant/30">
                  <PotholeImage
                    src="/photos/pothole-restored1.jpg"
                    alt="Post-repair smooth asphalt patch in Sector 17"
                    className="w-full h-full object-cover"
                    fallbackType="restored"
                    showBadge
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold">
                    Flush Restored
                  </div>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  Freshly compacted hot-mix bitumen patch by Punjab PWD Unit 04. Saw-cut borders sealed with Level-1 municipal sign-off.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. Dedicated Role Portals (Placed directly after Hero) */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">lock_open</span>
            <span>Role-Based Access Hub</span>
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface">Dedicated Role Portals</h2>
          <p className="text-secondary text-sm">
            Select your operational workspace to report road defects, triage municipal queues, or manage field repairs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Card 1: Citizen */}
          <Card padding="lg" className="border border-outline-variant/40 flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-b from-surface to-surface-container-lowest">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-container text-secondary">
                  Public Citizen
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">Citizen Reporter</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                  Snap road defect photos with instant GPS geolocation, track report lifecycle in real time, and view photographic resolution evidence.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low text-xs text-secondary font-mono border border-outline-variant/20">
                Demo: akshit@potholefix.in
              </div>
            </div>
            <div className="pt-5 space-y-2">
              <Link to="/citizen/dashboard" className="block">
                <Button variant="primary" className="w-full" icon={<span className="material-symbols-outlined text-sm">login</span>}>
                  Enter Citizen Portal
                </Button>
              </Link>
              <Link to="/citizen/report" className="block text-center">
                <span className="text-xs text-primary font-semibold hover:underline">
                  + Submit New Report Directly
                </span>
              </Link>
            </div>
          </Card>

          {/* Card 2: Municipal Authority */}
          <Card padding="lg" className="border border-outline-variant/40 flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-b from-surface to-primary/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-2xl">account_balance</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-fixed/40 text-primary">
                  Municipal Corp
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">Municipal Authority</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                  Review incoming defect tickets, verify and override categorical severities, dispatch work orders to PWD units, and sign off on completed repairs.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low text-xs text-secondary font-mono border border-outline-variant/20">
                Demo: alice@potholefix.gov.in
              </div>
            </div>
            <div className="pt-5 space-y-2">
              <Link to="/authority/dashboard" className="block">
                <Button variant="secondary" className="w-full" icon={<span className="material-symbols-outlined text-sm">shield</span>}>
                  Enter Authority Triage Hub
                </Button>
              </Link>
              <Link to="/authority/reports" className="block text-center">
                <span className="text-xs text-primary font-semibold hover:underline">
                  View Incoming Triage Queue →
                </span>
              </Link>
            </div>
          </Card>

          {/* Card 3: Repair Crew */}
          <Card padding="lg" className="border border-outline-variant/40 flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-b from-surface to-emerald-500/5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-2xl">construction</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
                  PWD Road Squad
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">Field Repair Crew</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                  Mobile-first field workspace for PWD repair squads to navigate to site coordinates, log repair start times, and submit post-compaction photos.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low text-xs text-secondary font-mono border border-outline-variant/20">
                Demo: gurpreet@pwd.punjab.gov.in
              </div>
            </div>
            <div className="pt-5 space-y-2">
              <Link to="/team/dashboard" className="block">
                <Button variant="outline" className="w-full" icon={<span className="material-symbols-outlined text-sm">engineering</span>}>
                  Enter Crew Workspace
                </Button>
              </Link>
              <Link to="/team/tasks" className="block text-center">
                <span className="text-xs text-primary font-semibold hover:underline">
                  View Active Work Orders →
                </span>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. How PotholeFix Works — 7-Step Connected Process Diagram */}
      <section id="how-it-works" className="max-w-6xl mx-auto scroll-mt-24 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-primary">Workflow Architecture</span>
          <h2 className="text-3xl font-extrabold text-on-surface">
            How PotholeFix Works
          </h2>
          <p className="text-secondary text-base">
            A seamless 7-step civic resolution cycle from street capture to public verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 relative">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              1
            </span>
            <span className="material-symbols-outlined text-primary text-xl mb-1">camera_alt</span>
            <h4 className="text-xs font-bold text-on-surface">Capture</h4>
            <p className="text-[11px] text-secondary mt-1">Photo + GIS location</p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              2
            </span>
            <span className="material-symbols-outlined text-primary text-xl mb-1">psychology</span>
            <h4 className="text-xs font-bold text-on-surface">AI Triage</h4>
            <p className="text-[11px] text-secondary mt-1">Severity &amp; boundary</p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              3
            </span>
            <span className="material-symbols-outlined text-primary text-xl mb-1">fact_check</span>
            <h4 className="text-xs font-bold text-on-surface">Verify</h4>
            <p className="text-[11px] text-secondary mt-1">Authority validation</p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              4
            </span>
            <span className="material-symbols-outlined text-primary text-xl mb-1">assignment_ind</span>
            <h4 className="text-xs font-bold text-on-surface">Dispatch</h4>
            <p className="text-[11px] text-secondary mt-1">Work order to crew</p>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              5
            </span>
            <span className="material-symbols-outlined text-primary text-xl mb-1">construction</span>
            <h4 className="text-xs font-bold text-on-surface">Repair</h4>
            <p className="text-[11px] text-secondary mt-1">Saw-cut &amp; hot-mix</p>
          </div>

          {/* Step 6 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">
              6
            </span>
            <span className="material-symbols-outlined text-primary text-xl mb-1">add_photo_alternate</span>
            <h4 className="text-xs font-bold text-on-surface">Proof</h4>
            <p className="text-[11px] text-secondary mt-1">Restored photo sent</p>
          </div>

          {/* Step 7 */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center shadow-xs">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-2">
              7
            </span>
            <span className="material-symbols-outlined text-emerald-700 text-xl mb-1">verified</span>
            <h4 className="text-xs font-bold text-emerald-900">Sign-Off</h4>
            <p className="text-[11px] text-emerald-700 mt-1">Citizen notified</p>
          </div>
        </div>
      </section>

      {/* 4. About Us Section */}
      <section id="about" className="max-w-5xl mx-auto scroll-mt-24 space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-primary">About PotholeFix</span>
          <h2 className="text-3xl font-extrabold text-on-surface">
            Modern Civic Tech for India's Roadways
          </h2>
          <p className="text-secondary text-base">
            Every monsoon season, Indian roadways suffer severe surface degradation, leading to heavy vehicular wear, traffic congestion, and commuter accidents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Card padding="lg" className="space-y-3 border border-outline-variant/30">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">traffic</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">The Infrastructure Challenge</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Traditional pothole reporting relies on manual phone calls or sporadic municipal complaints that often lack accurate GPS coordinates and severity classification.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3 border border-outline-variant/30">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">The AI &amp; GIS Bridge</h3>
            <p className="text-sm text-secondary leading-relaxed">
              PotholeFix bridges citizens directly with public works engineers through computer vision defect recognition, automated GIS mapping, and prioritized dispatch queues.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3 border border-outline-variant/30">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">task_alt</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Accountable Verification</h3>
            <p className="text-sm text-secondary leading-relaxed">
              No ticket can be closed without post-repair photographic proof. Municipal directors verify the finish before automatic citizen resolution notices are dispatched.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Our Mission & Vision Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div id="mission" className="scroll-mt-24">
          <Card padding="lg" className="h-full bg-gradient-to-br from-surface to-primary/5 border border-outline-variant/40 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-base">flag</span>
              <span>Our Mission</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface">
              Rapid, Transparent Road Repair Cycles
            </h3>
            <p className="text-secondary text-sm leading-relaxed">
              To drastically reduce the response window between hazard identification and asphalt compaction. By providing municipal engineering departments with instant visual severity scoring and digital work orders, we empower city road squads to resolve critical arterial potholes within 24 to 48 hours.
            </p>
          </Card>
        </div>

        <div id="vision" className="scroll-mt-24">
          <Card padding="lg" className="h-full bg-gradient-to-br from-surface to-emerald-500/5 border border-outline-variant/40 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>Our Vision</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface">
              Pothole-Free, Resilient Transit Corridors
            </h3>
            <p className="text-secondary text-sm leading-relaxed">
              To create an open, accountable civic infrastructure standard where every urban local body in India operates with real-time road condition intelligence, eliminating preventable commuter accidents and fostering civic pride through transparent municipal governance.
            </p>
          </Card>
        </div>
      </section>

      {/* 6. What We Provide — 8 Feature Cards */}
      <section id="features" className="max-w-6xl mx-auto scroll-mt-24 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-primary">Core Capabilities</span>
          <h2 className="text-3xl font-extrabold text-on-surface">
            What PotholeFix Provides
          </h2>
          <p className="text-secondary text-base">
            An end-to-end civic ecosystem engineered for citizens, municipal dispatchers, and field repair crews.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feature 1 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">add_a_photo</span>
            <h4 className="text-base font-bold text-on-surface">1. Citizen Reporting</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Frictionless camera upload with browser-assisted GPS geolocation and manual drag fallback.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">view_in_ar</span>
            <h4 className="text-base font-bold text-on-surface">2. YOLO AI Vision</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Interface for deep learning object detection with bounding box coordinates and defect categorization.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">priority_high</span>
            <h4 className="text-base font-bold text-on-surface">3. 4-Tier Severity</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Critical, High, Medium, and Low risk scoring ensuring high-speed transit hazards get prioritized first.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">map</span>
            <h4 className="text-base font-bold text-on-surface">4. Interactive GIS Map</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Interactive Leaflet mapping showing all reported hazards across Chandigarh and Delhi corridors.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">fact_check</span>
            <h4 className="text-base font-bold text-on-surface">5. Authority Triage</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Comprehensive municipal desk with severity overrides, status history logging, and rejection audit reasons.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">assignment_turned_in</span>
            <h4 className="text-base font-bold text-on-surface">6. Crew Work Orders</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Mobile-optimized dispatch queues for PWD squads with deadlines, saw-cut specs, and status updates.
            </p>
          </Card>

          {/* Feature 7 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">verified</span>
            <h4 className="text-base font-bold text-on-surface">7. Before/After Audit</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Strict photographic comparison verifying that post-repair asphalt meets municipal Level-1 compaction standards.
            </p>
          </Card>

          {/* Feature 8 */}
          <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-2xl text-primary">timeline</span>
            <h4 className="text-base font-bold text-on-surface">8. Event Timeline</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Full 10-state transparent audit timeline tracking every action with actor name, timestamp, and notes.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
