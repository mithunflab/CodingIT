'use client'

import * as React from 'react'
import { FragmentSchema } from '@/lib/schema'
import { DeploymentConfig, DeploymentProvider } from '@/lib/deployment/deployment-engine'

interface DeploymentFormProps {
  fragment: FragmentSchema
  providers: DeploymentProvider[]
  onDeploy: (config: DeploymentConfig) => void
  isDeploying: boolean
}

export function DeploymentForm({ fragment, providers, onDeploy, isDeploying }: DeploymentFormProps) {
  return (
    <div>
      <p>Deployment Form</p>
    </div>
  )
}
