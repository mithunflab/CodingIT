"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Code Typing Animation
export function CodeTypingLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative">
        <div className="flex items-center space-x-1 text-sm font-mono">
          <span className="text-blue-500">const</span>
          <span className="text-purple-500">projects</span>
          <span className="text-gray-400">=</span>
          <span className="text-green-500">await</span>
          <span className="text-yellow-500">fetchProjects</span>
          <span className="text-gray-400">()</span>
          <div className="w-2 h-5 bg-blue-500 animate-pulse ml-1" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Loading projects...</p>
    </div>
  );
}

// Folder Building Animation
export function FolderBuildingLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <div className="relative">
        {/* Base folder */}
        <div className="w-16 h-12 bg-blue-500/20 border-2 border-blue-500/40 rounded-lg relative overflow-hidden">
          {/* Files flying in */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
          </div>
          {/* Animated dots */}
          <div className="absolute bottom-2 left-2 flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        {/* Floating particles */}
        <div className="absolute -top-2 -right-2 w-2 h-2 bg-green-500 rounded-full animate-ping" />
        <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '500ms' }} />
      </div>
      <p className="text-sm text-muted-foreground">Building project list...</p>
    </div>
  );
}

// Circuit Board Loader
export function CircuitLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <div className="relative w-20 h-20">
        {/* Circuit board background */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <defs>
              <pattern id="circuit" patternUnits="userSpaceOnUse" width="10" height="10">
                <path d="M0 5h10M5 0v10" stroke="currentColor" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="80" height="80" fill="url(#circuit)" />
          </svg>
        </div>
        
        {/* Animated nodes */}
        <div className="absolute inset-0">
          <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '800ms' }} />
        </div>
        
        {/* Connecting lines with animation */}
        <svg className="absolute inset-0 w-full h-full">
          <path
            d="M8 8 L40 40 L72 8 M8 72 L40 40 L72 72"
            stroke="url(#gradient)"
            strokeWidth="1"
            fill="none"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0" />
              <stop offset="50%" stopColor="rgb(59 130 246)" stopOpacity="1" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">Connecting to projects...</p>
    </div>
  );
}

// Project Cards Skeleton Loader
export function ProjectCardsLoader({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-lg border bg-card p-6 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Header skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          </div>
          
          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-muted rounded w-full animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
          
          {/* Footer skeleton */}
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      ))}
    </div>
  );
}

// DNA Helix Loader (for modern tech feel)
export function DNALoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-6", className)}>
      <div className="relative w-16 h-20">
        <div className="absolute inset-0 animate-spin-slow">
          {/* DNA strands */}
          <div className="absolute left-2 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full transform rotate-12" />
          <div className="absolute right-2 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full transform -rotate-12" />
          
          {/* DNA connections */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"
              style={{
                top: `${15 + i * 15}%`,
                animationDelay: `${i * 200}ms`,
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
              }}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Analyzing projects...</p>
    </div>
  );
}

// Minimal Dots Loader
export function DotsLoader({ className, size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "space-x-1",
    default: "space-x-2",
    large: "space-x-3"
  };
  
  const dotSizes = {
    small: "w-2 h-2",
    default: "w-3 h-3",
    large: "w-4 h-4"
  };

  return (
    <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-blue-500 rounded-full animate-bounce",
            dotSizes[size]
          )}
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}

// Terminal-style Loader
export function TerminalLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm w-80 max-w-full">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-400 text-xs ml-2">terminal</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">$</span>
            <span className="text-white">npm run fetch-projects</span>
          </div>
          <div className="text-gray-400">
            <div className="flex items-center space-x-2">
              <DotsLoader size="small" />
              <span>Fetching project data...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Spinning Logo (for buttons, small spaces)
export function InlineLogoSpinner({ className, size = "small" }: { className?: string; size?: "tiny" | "small" | "default" }) {
  const sizeClasses = {
    tiny: "w-4 h-4",
    small: "w-6 h-6", 
    default: "w-8 h-8"
  };

  return (
    <Image
      src="/logo-dark.png"
      alt="Loading..."
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )}
      style={{ 
        animationDuration: '1.5s',
        filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))'
      }}
    />
  );
}

export function SpinningLogoLoader({ className, size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-12 h-12",
    large: "w-16 h-16"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className="relative">
        {/* Glow background effect */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full animate-pulse blur-md",
            sizeClasses[size]
          )}
          style={{ 
            animationDuration: '2s',
            zIndex: -1
          }}
        />
        
        {/* Spinning logo */}
        <Image
          src="/logo-dark.png"
          alt="CodinIT.dev"
          className={cn(
            "animate-spin animate-logo-glow",
            sizeClasses[size]
          )}
          style={{ 
            animationDuration: '2s',
            filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
          }}
        />
        
        {/* Outer ring effect */}
        <div 
          className={cn(
            "absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping",
            sizeClasses[size]
          )}
          style={{ animationDuration: '3s' }}
        />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading projects...</p>
    </div>
  );
}

export interface LoadingAnimationProps {
  variant?: "code" | "folder" | "circuit" | "cards" | "dna" | "dots" | "terminal" | "logo";
  className?: string;
  size?: "small" | "default" | "large";
}

export function LoadingAnimation({ 
  variant = "logo", 
  className,
  size = "default" 
}: LoadingAnimationProps) {
  switch (variant) {
    case "code":
      return <CodeTypingLoader className={className} />;
    case "folder":
      return <FolderBuildingLoader className={className} />;
    case "circuit":
      return <CircuitLoader className={className} />;
    case "cards":
      return <ProjectCardsLoader className={className} />;
    case "dna":
      return <DNALoader className={className} />;
    case "dots":
      return <DotsLoader className={className} size={size} />;
    case "terminal":
      return <TerminalLoader className={className} />;
    case "logo":
      return <SpinningLogoLoader className={className} size={size} />;
    default:
      return <SpinningLogoLoader className={className} size={size} />; // Default to logo
  }
}

// Custom CSS for additional animations (add to globals.css)
export const loadingAnimationStyles = `
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(100%) skewX(-12deg);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
