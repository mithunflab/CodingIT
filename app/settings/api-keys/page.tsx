import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import FormLayout02 from '@/components/form-1'; // Placeholder form

export default function ApiKeysPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>API Keys</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-semibold">API Keys Settings</h1>
      {/* Placeholder for API Keys specific form or content */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Manage Your API Keys</h2>
        <p className="text-muted-foreground mb-6">
          API keys allow external applications to access your account.
        </p>
        {/* Replace with actual API Key management UI */}
        <FormLayout02 />
      </div>
    </div>
  );
}
