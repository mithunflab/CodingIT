'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import templatesData from '@/lib/templates.json';
import { convertToEnhancedTemplates, type EnhancedTemplate, type TemplatesDataObject } from '@/lib/templates';

// Use EnhancedTemplate for consistency
// interface Template {
//   name: string;
//   lib: string[];
//   file: string | null;
//   instructions: string;
//   port: number | null;
// }

// The state will now be an array of EnhancedTemplate
// interface Templates {
//   [key: string]: Template;
// }

interface StackItem {
  id: string; // Corresponds to a key in templates.json
  name: string; // Display name for the logo
  logoLight: string; // Path to light mode logo
  logoDark: string; // Path to dark mode logo (can be same as light if no dark variant)
}

const TemplateSelector: React.FC = () => {
  // Initialize state with the transformed array of templates
  const [enhancedTemplates, setEnhancedTemplates] = useState<EnhancedTemplate[]>(() =>
    convertToEnhancedTemplates(templatesData as TemplatesDataObject)
  );

  const handleTemplateSelect = (templateId: string) => {
    // Find the template by its id in the array
    const selectedTemplate = enhancedTemplates.find(t => t.id === templateId);
    if (selectedTemplate) {
      console.log(`Selected template: ${selectedTemplate.name}`, selectedTemplate);
      // Here you would typically trigger the build process
      // For example: buildTemplate(selectedTemplate);
    } else {
      console.warn(`Template with id "${templateId}" not found.`);
    }
  };

  const stackItems: StackItem[] = [
    {
      id: 'nextjs-developer',
      name: 'Next.js',
      logoLight: '/thirdparty/logos/nextjs-icon-light.svg',
      logoDark: '/thirdparty/logos/nextjs-icon-dark.svg',
    },
    {
      id: 'vue-developer',
      name: 'Vue.js',
      logoLight: '/thirdparty/logos/vuejs-icon.svg',
      logoDark: '/thirdparty/logos/vuejs-icon.svg',
    },
    {
      id: 'streamlit-developer',
      name: 'Streamlit',
      logoLight: '/thirdparty/logos/streamlit-icon.svg',
      logoDark: '/thirdparty/logos/streamlit-icon.svg',
    },
    {
      id: 'gradio-developer',
      name: 'Gradio',
      logoLight: '/thirdparty/logos/gradio-icon.svg',
      logoDark: '/thirdparty/logos/gradio-icon.svg',
    },
    {
      id: 'code-interpreter-v1',
      name: 'Python Analyst',
      logoLight: '/thirdparty/logos/python-icon.svg',
      logoDark: '/thirdparty/logos/python-icon.svg',
    },
  ];

  const placeholderLogo = '/logo.png'; // Make sure this exists

  return (
    <div className="bg-gray-900 text-white p-8 rounded-lg w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-gray-400 mb-4">or import from</p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            {/* Placeholder for Figma Icon */}
            <span className="mr-2">🎨</span> Figma
          </Button>
          <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
            {/* Placeholder for GitHub Icon */}
            <span className="mr-2">🐙</span> GitHub
          </Button>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-gray-200">Build a mobile app with Expo</Button>
          <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-gray-200">Start a blog with Astro</Button>
          <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-gray-200">Create a docs site with Vitepress</Button>
          <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-gray-200">Scaffold UI with shadcn</Button>
          <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-gray-200">Draft a presentation with Slidev</Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-400 mb-6">or start a blank app with your favorite stack</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-6">
          {stackItems.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleTemplateSelect(item.id)}
              className="bg-gray-800 p-3 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <CardContent className="p-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 relative mb-2">
                  {/* Basic image handling, assuming SVGs or PNGs */}
                  {/* You might need more sophisticated light/dark mode handling for Next.js Image if using theme context */}
                  <Image
                    src={item.logoDark}
                    alt={`${item.name} logo`}
                    layout="fill"
                    objectFit="contain"
                    onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderLogo;
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 truncate w-full text-center">{item.name}</p>
              </CardContent>
            </Card>
          ))}
          {/* Add more placeholder logos if needed to fill the grid like in the image */}
          {Array.from({ length: 14 - stackItems.length }).map((_, index) => (
             <Card
              key={`placeholder-${index}`}
              className="bg-gray-800 p-3 flex flex-col items-center justify-center aspect-square opacity-50"
            >
              <CardContent className="p-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 relative mb-2">
                  <Image
                    src={placeholderLogo}
                    alt="Placeholder logo"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
                <p className="text-xs text-gray-400">Stack</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
