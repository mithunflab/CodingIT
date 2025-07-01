'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';
import { 
  MessageSquare, 
  Search, 
  Settings, 
  HelpCircle, 
  User, 
  LogOut,
  Plus,
  Calendar,
  Archive,
  Star,
  ChevronDown,
  MoreHorizontal,
  CreditCardIcon
} from 'lucide-react';
import Logo from './logo';

export interface SidebarProps {
  children?: ReactNode;
  width?: number;
  hoverZoneWidth?: number;
  transitionDuration?: number;
  autoHideDelay?: number;
  className?: string;
  onStateChange?: (isOpen: boolean) => void;
  userName?: string;
  userPlan?: string;
}

export interface SidebarState {
  isOpen: boolean;
  isHovering: boolean;
  isTouchDevice: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  children,
  width = 280,
  hoverZoneWidth = 50,
  transitionDuration = 300,
  autoHideDelay = 500,
  className,
  onStateChange,
  userName,
  userPlan,
}) => {
  const { session } = useAuth(
    () => {},
    () => {},
  );
  const [state, setState] = useState<SidebarState>({
    isOpen: false,
    isHovering: false,
    isTouchDevice: false,
  });

  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setState(prev => ({ ...prev, isTouchDevice }));
  }, []);

  useEffect(() => {
    onStateChange?.(state.isOpen);
  }, [state.isOpen, onStateChange]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(prev => ({ ...prev, isOpen: true, isHovering: true }));
  };

  const handleMouseLeave = () => {
    setState(prev => ({ ...prev, isHovering: false }));
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isOpen: false }));
    }, autoHideDelay);
  };

  const handleTouchStart = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Hover Detection Zone */}
      <div
        ref={hoverZoneRef}
        className="fixed top-0 left-0 h-full z-40 pointer-events-auto"
        style={{ width: hoverZoneWidth }}
        onMouseEnter={handleMouseEnter}
        onTouchStart={state.isTouchDevice ? handleTouchStart : undefined}
        aria-hidden="true"
      />

      {/* Backdrop */}
      {state.isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity lg:hidden"
          style={{ transitionDuration: `${transitionDuration}ms` }}
          onClick={() => setState(prev => ({ ...prev, isOpen: false }))}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 h-full z-50 transform transition-all duration-300 ease-out',
          'border-r bg-background',
          state.isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        style={{
          width,
          transitionDuration: `${transitionDuration}ms`,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Navigation sidebar"
        role="navigation"
      >
        {children || (
          <DefaultSidebarContent
            userName={userName}
            userPlan={userPlan}
            session={session}
          />
        )}
      </aside>
    </>
  );
};

const DefaultSidebarContent: React.FC<{
  userName?: string;
  userPlan?: string;
  session: Session | null;
}> = ({ userName, userPlan, session }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const recentChats = [
    ''
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Logo width={120} height={120} />
        </div>
        <button className="p-1 hover:bg-accent rounded transition-colors">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group">
          <MessageSquare className="w-4 h-4 text-secondary-foreground" />
          <span className="text-sm font-medium text-secondary-foreground">Start new chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Chats</h3>
            </div>
            
            {/* Yesterday */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {recentChats.slice(0, 1).map((chat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                  >
                    <span className="text-sm text-foreground truncate group-hover:text-accent-foreground transition-colors">
                      {chat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 30 Days */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xs text-muted-foreground">Last 30 days</h4>
              </div>
              <div className="space-y-1">
                {recentChats.slice(1, 6).map((chat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                  >
                    <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate group-hover:text-accent-foreground transition-colors">
                      {chat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {recentChats.slice(6).map((chat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                  >
                    <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate group-hover:text-accent-foreground transition-colors">
                      {chat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t">
        {/* Get free tokens, Go Pro, Settings and Help */}
        <div className="p-4 space-y-1">
          <button className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors w-full">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        Get free tokens
          </button>
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors">
        <CreditCardIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">Go Pro</span>
          </button>
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors">
        <Settings className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">Settings</span>
          </button>
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors">
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">Help Center</span>
          </button>
        </div>
      </div>

        {/* User Profile */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {session?.user.user_metadata?.name?.[0] || 'G'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session?.user.user_metadata?.name || userName || ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user.user_metadata?.plan || userPlan || 'Free Plan'}
              </p>
            </div>
            <button className="p-1 hover:bg-accent rounded transition-colors">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
  );
};

export default Sidebar;
