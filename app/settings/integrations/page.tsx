"use client"

import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function IntegrationsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Capabilities */}
        <div className="bg-[#2A2A2A] rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Capabilities</h2>
          <p className="text-sm text-gray-300 mb-6">Control which capabilities CodinIT uses in your conversations.</p>

          <div className="flex items-center justify-between py-4 border-b border-[#3A3A3A]">
            <div>
              <h3 className="font-medium">Artifacts</h3>
              <p className="text-sm text-gray-300">
                Ask CodinIT to generate content like code snippets, text documents, or website designs, and CodinIT will
                create an Artifact that appears in a dedicated window alongside your conversation.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-[#2A2A2A] rounded-lg p-6">
          <h2 className="text-xl font-medium mb-2">Integrations</h2>
          <p className="text-sm text-gray-300 mb-6">
            Allow CodinIT to reference other apps and services for more context.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-[#3A3A3A]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-white">
                    <path
                      fill="currentColor"
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                    ></path>
                  </svg>
                </div>
                <span>GitHub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">Connected</span>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-more-vertical"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-[#3A3A3A]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,13.77C10.95,13.29 11.11,12.68 11.59,12.4L12.45,11.9C12.93,11.63 13.54,11.79 13.82,12.27L15.74,14.69C17.12,13.59 18,11.9 18,10A6,6 0 0,0 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.08L12.95,12.77L12.09,13.27Z"
                      fill="#4285F4"
                    />
                  </svg>
                </div>
                <span>Google Drive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">Connected</span>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-more-vertical"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-[#3A3A3A]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <span>Gmail</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">Connected</span>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-more-vertical"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16m0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12m1-6.5h4V13h-6V7h2z"
                      fill="#4285F4"
                    />
                  </svg>
                </div>
                <span>Google Calendar</span>
              </div>
              <Button variant="outline" className="border-[#3A3A3A] text-white hover:bg-[#3A3A3A]">
                Connect
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
