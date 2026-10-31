import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PotholeImage } from '../components/common/PotholeImage';
import { InteractiveImpactGlobe } from '../components/home/InteractiveImpactGlobe';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      // Unauthenticated -> sign-in page with Citizen Reporter preselected and redirect preserved
      navigate('/login?role=CITIZEN&redirect=/citizen/report');
    } else {
      // Authenticated -> navigate directly (if another role, ProtectedRoute presents role authorization)
      navigate('/citizen/report');
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-16 px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto">
      {/* 1. HERO SECTION */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col justify-between space-y-6 text-left"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-primary text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Municipal Road Safety Intelligence · Chandigarh &amp; Punjab Pilot</span>
              </div>

              <h1 className="font-display-hero text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface leading-tight tracking-tight">
                Smarter Roads. <br />
                <span className="text-primary-container bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                  Safer Journeys.
                </span>
              </h1>

              <p className="font-body-lg text-base sm:text-lg text-secondary max-w-xl leading-relaxed">
                AI-assisted road hazard detection, direct citizen reporting, and real-time municipal dispatch desk engineered to eliminate road craters across Indian arterial corridors.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleReportClick}
                  icon={<span className="material-symbols-outlined text-[20px]">add_a_photo</span>}
                  className="shadow-md"
                >
                  Report a Pothole
                </Button>

                <Link to="/login">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={<span className="material-symbols-outlined text-[20px]">login</span>}
                  >
                    Sign In to Portal
                  </Button>
                </Link>

                <a href="#how-it-works">
                  <Button
                    variant="ghost"
                    size="lg"
                    icon={<span className="material-symbols-outlined text-[20px]">flowsheet</span>}
                  >
                    How It Works
                  </Button>
                </a>
              </div>
            </div>

            {/* Live Pilot Highlights Strip */}
            <div className="pt-6 border-t border-outline-variant/30 grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-primary font-bold text-xl sm:text-2xl block">3 Corridors</span>
                <span className="text-secondary text-[11px] font-medium">Active Pilot Zones</span>
              </div>
              <div>
                <span className="text-emerald-700 font-bold text-xl sm:text-2xl block">Level-1 Pass</span>
                <span className="text-secondary text-[11px] font-medium">Compaction Audit</span>
              </div>
            </div>
          </motion.div>

          {/* Right Showcase Column: Expanded Level-1 Photographic Standard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            <Card
              padding="lg"
              className="overflow-hidden shadow-2xl border border-outline-variant/40 bg-surface-container-lowest/95 backdrop-blur-md space-y-4"
            >
              {/* Header Badge & Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-surface-container-high">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[13px]">verified_user</span>
                    <span>Level-1 Photographic Standard</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
                    Sector 17 Commercial Corridor, Chandigarh (#PF-101)
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>CERTIFIED PASS</span>
                  </span>
                </div>
              </div>

              {/* Side-by-Side Large Photographic Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Pre-Repair Photograph */}
                <div className="space-y-1.5 group">
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/11] border border-error/30 shadow-sm bg-surface-container">
                    <PotholeImage
                      src="/photos/pothole-sector17.jpg"
                      alt="Pre-repair asphalt pothole in Sector 17"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="critical"
                      showBadge
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-error/95 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>PRE-REPAIR DEFECT</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono flex items-center justify-between">
                      <span>Cavity Depth: ~85mm</span>
                      <span className="text-error-fixed font-bold">CRITICAL</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-secondary font-medium">Asphalt Fatigue Cavitation</span>
                    <span className="text-error font-semibold">Triage Verified</span>
                  </div>
                </div>

                {/* Post-Repair Restored State */}
                <div className="space-y-1.5 group">
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/11] border border-emerald-400 shadow-sm bg-surface-container">
                    <PotholeImage
                      src="/photos/pothole-restored1.jpg"
                      alt="Post-repair smooth asphalt patch in Sector 17"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallbackType="restored"
                      showBadge
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">task_alt</span>
                      <span>POST-REPAIR RESTORATION</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono flex items-center justify-between">
                      <span>Saw-Cut Bitumen Patch</span>
                      <span className="text-emerald-400 font-bold">100% FLUSH</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-secondary font-medium">Saw-Cut Flush Compaction</span>
                    <span className="text-emerald-700 font-semibold">Level-1 Approved</span>
                  </div>
                </div>
              </div>

              {/* Detailed Technical Audit Telemetry Bar */}
              <div className="pt-3 border-t border-outline-variant/20 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-secondary block text-[10px]">Exact Coordinates</span>
                  <span className="font-mono font-semibold text-on-surface">30.7398° N, 76.7827° E</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-secondary block text-[10px]">Assigned Squad</span>
                  <span className="font-semibold text-primary truncate block">Punjab PWD Unit 04</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 col-span-2 sm:col-span-1">
                  <span className="text-secondary block text-[10px]">Inspecting Commissioner</span>
                  <span className="font-semibold text-emerald-800 truncate block">Alice Sharma (MC)</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW POTHOLEFIX WORKS — 7-Step Connected Process */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="scroll-mt-24 space-y-8"
      >
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-primary">Workflow Architecture</span>
          <h2 className="text-3xl font-extrabold text-on-surface">
            How PotholeFix Works
          </h2>
          <p className="text-secondary text-sm sm:text-base">
            A seamless 7-step civic resolution cycle from street capture to municipal verification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { step: 1, icon: 'camera_alt', title: 'Capture', desc: 'Photo + GIS coordinates', color: 'bg-primary' },
            { step: 2, icon: 'psychology', title: 'AI Triage', desc: 'Severity estimation', color: 'bg-primary' },
            { step: 3, icon: 'fact_check', title: 'Verify', desc: 'Authority inspection', color: 'bg-primary' },
            { step: 4, icon: 'assignment_ind', title: 'Dispatch', desc: 'Work order to crew', color: 'bg-primary' },
            { step: 5, icon: 'construction', title: 'Repair', desc: 'Saw-cut & hot-mix', color: 'bg-primary' },
            { step: 6, icon: 'add_photo_alternate', title: 'Proof', desc: 'Restored photo uploaded', color: 'bg-primary' },
            { step: 7, icon: 'verified', title: 'Sign-Off', desc: 'Certified & citizen notice', color: 'bg-emerald-600' },
          ].map((s) => (
            <motion.div
              key={s.step}
              whileHover={{ y: -3 }}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between shadow-xs ${
                s.step === 7
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-outline-variant/30 bg-surface-container-lowest'
              }`}
            >
              <div className="space-y-2 w-full flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-secondary">
                  Step 0{s.step}
                </span>
                <div className={`w-11 h-11 rounded-2xl ${s.color} text-white flex items-center justify-center font-bold shadow-xs`}>
                  <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface">{s.title}</h4>
                <p className="text-[11px] text-secondary leading-snug">{s.desc}</p>
              </div>
              {s.step < 7 && (
                <div className="hidden lg:block text-outline-variant text-xs mt-2">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 3. INTERACTIVE 3D IMPACT GLOBE */}
      <section id="impact" className="scroll-mt-24">
        <InteractiveImpactGlobe />
      </section>

      {/* 4. ABOUT US & MISSION/VISION */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="scroll-mt-24 space-y-8"
      >
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-primary">Civic Tech For India</span>
          <h2 className="text-3xl font-extrabold text-on-surface">
            Modernizing Road Infrastructure Management
          </h2>
          <p className="text-secondary text-sm sm:text-base">
            PotholeFix bridges citizens directly with municipal works engineers through computer vision defect recognition, automated GIS mapping, and transparent audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="space-y-3 border border-outline-variant/30 bg-surface-container-lowest">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">traffic</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">The Arterial Challenge</h3>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Monsoon deluges cause sudden surface cavitation on transit routes. Without rapid GIS triangulation and photographic proof, repairs get delayed or unverified.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3 border border-outline-variant/30 bg-surface-container-lowest">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">The AI &amp; GIS Solution</h3>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Citizens submit geotagged photos. Our platform parses boundary risk, prioritizes critical craters, and dispatches actionable work orders to city squads.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3 border border-outline-variant/30 bg-surface-container-lowest">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">task_alt</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Verifiable Level-1 Closure</h3>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Every resolved work order requires photographic proof of saw-cut asphalt compaction. Municipal authorities inspect the finish before closing the ticket.
            </p>
          </Card>
        </div>

        {/* Mission & Vision Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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
                To compress the response window between citizen hazard flagging and field crew hot-mix asphalt compaction to under 48 hours on critical urban arteries.
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
                Zero-Accident, Resilient Roadways
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                To provide every Indian Urban Local Body with reliable spatial intelligence and digital auditability, transforming road maintenance into an accountable public service.
              </p>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 5. WHAT WE PROVIDE — 8 Feature Cards */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="scroll-mt-24 space-y-8"
      >
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-primary">Comprehensive Platform</span>
          <h2 className="text-3xl font-extrabold text-on-surface">
            What PotholeFix Provides
          </h2>
          <p className="text-secondary text-sm sm:text-base">
            Engineered from the ground up for citizen reporters, municipal directors, and asphalt repair crews.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: 'add_a_photo',
              num: '1',
              title: 'Citizen Reporting',
              desc: 'Frictionless camera upload with browser-assisted GPS geolocation and map pin placement.',
            },
            {
              icon: 'view_in_ar',
              num: '2',
              title: 'YOLO AI Vision Interface',
              desc: 'Integration endpoint for trained Ultralytics YOLO models with bounding box defect segmentation.',
            },
            {
              icon: 'priority_high',
              num: '3',
              title: '4-Tier Severity Scoring',
              desc: 'Critical, High, Medium, and Low risk scoring ensuring high-speed transit hazards get dispatched first.',
            },
            {
              icon: 'map',
              num: '4',
              title: 'GIS Map Triangulation',
              desc: 'Interactive Leaflet mapping showing all reported hazards across Chandigarh and regional corridors.',
            },
            {
              icon: 'fact_check',
              num: '5',
              title: 'Municipal Triage Desk',
              desc: 'Authority workstation with severity overrides, status history logging, and rejection audit reasons.',
            },
            {
              icon: 'assignment_turned_in',
              num: '6',
              title: 'Crew Work Orders',
              desc: 'Mobile-first dispatch queues for PWD squads with deadlines, saw-cut specs, and status updates.',
            },
            {
              icon: 'verified',
              num: '7',
              title: 'Before/After Audit Proof',
              desc: 'Side-by-side photographic comparison ensuring post-repair asphalt meets Level-1 compaction standards.',
            },
            {
              icon: 'timeline',
              num: '8',
              title: '10-State Event Timeline',
              desc: 'Full transparent audit trail tracking every transition with verified actor names and timestamps.',
            },
          ].map((f) => (
            <motion.div
              key={f.num}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <Card padding="md" className="space-y-2.5 border border-outline-variant/30 hover:border-primary/50 transition-all h-full bg-surface-container-lowest">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface">
                  {f.num}. {f.title}
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {f.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 6. CORPORATE / CSR SPONSORSHIP PORTAL BANNER */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-white relative overflow-hidden shadow-xl border border-teal-500/30"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>Corporate Social Responsibility (CSR) Portal</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-slate-950 text-[9px] font-black">NEW</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sponsor Arterial Corridors &amp; Highway Repairs with 100% Audit Compliance
            </h2>
            <p className="text-teal-100/80 text-sm sm:text-base leading-relaxed max-w-2xl">
              Enable your enterprise to sponsor critical road hazard restorations across Chandigarh, Punjab, and Haryana. Submit CSR road restoration proposals for municipal authority review, squad assignment, and Level-1 photographic compaction audit records. CSR eligibility and applicable tax treatment require independent verification.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/company/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg hover:shadow-teal-500/25 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                <span>Enter Company / CSR Portal</span>
                <span className="material-symbols-outlined text-[18px]">east</span>
              </Link>
              <Link
                to="/company/potholes"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Browse Eligible Corridors</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-teal-400 font-extrabold text-2xl sm:text-3xl block">100%</span>
              <span className="text-teal-100/70 text-xs font-medium mt-1 block">Authority Verified Corridors</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-teal-400 font-extrabold text-2xl sm:text-3xl block">Proposal</span>
              <span className="text-teal-100/70 text-xs font-medium mt-1 block">Authority Review Workflow</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-teal-400 font-extrabold text-2xl sm:text-3xl block">Level-1</span>
              <span className="text-teal-100/70 text-xs font-medium mt-1 block">Compaction Photo Audit</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-teal-400 font-extrabold text-2xl sm:text-3xl block">Live GPS</span>
              <span className="text-teal-100/70 text-xs font-medium mt-1 block">Repair Progress Tracking</span>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
