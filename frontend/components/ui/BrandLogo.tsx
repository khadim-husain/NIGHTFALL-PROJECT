'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function BrandLogo({ collapsed = false, className = '' }: BrandLogoProps) {
  return (
    <Link href="/command-center" className={`flex items-center gap-3 group select-none ${className}`}>
      {/* Dynamic Ribbon 'N' Logo matching the reference image */}
      <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        >
          {/* Left upright blue ribbon bar */}
          <path
            d="M8 32V8L18 20V32H8Z"
            fill="url(#nf-gradient-left)"
          />
          {/* Center diagonal connecting facet */}
          <path
            d="M18 20L32 8V20L22 32H18V20Z"
            fill="url(#nf-gradient-center)"
          />
          {/* Right upright high-energy facet */}
          <path
            d="M22 8L32 20V32L22 20V8Z"
            fill="url(#nf-gradient-right)"
            fillOpacity="0.9"
          />
          <defs>
            <linearGradient id="nf-gradient-left" x1="8" y1="8" x2="18" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="nf-gradient-center" x1="18" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="nf-gradient-right" x1="22" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E40AF" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-[15px] font-extrabold tracking-tight text-nf-navy leading-tight">
            NIGHTFALL NEXUS
          </span>
          <span className="text-[11px] font-medium text-nf-secondary leading-tight mt-0.5">
            Smart Printing Operations
          </span>
        </div>
      )}
    </Link>
  );
}

