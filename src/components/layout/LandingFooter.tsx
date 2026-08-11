import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowUpRight, Globe } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Capabilities', href: '/capabilities' },
    { label: 'API Reference', href: '/docs' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About us', href: '/about' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Getting started', href: '/signup' },
    { label: 'Status', href: '#' },
    { label: 'Privacy policy', href: '#' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-5 pt-14 pb-8">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                <Zap size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-foreground">AI Foundry</span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs">
              Build AI for your problem. Not someone else's. From proprietary data to production AI — without an ML team.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-2">
              {['GitHub', 'Twitter', 'LinkedIn'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="flex h-8 px-3 items-center justify-center rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="space-y-3">
              <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest">{group}</div>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      {link.href === '#' && (
                        <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
          <span>© 2024 AI Foundry. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
