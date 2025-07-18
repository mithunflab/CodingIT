'use client'

import * as React from 'react'
import { DeploymentResult } from '@/lib/deployment/deployment-engine'

interface DeploymentHistoryProps {
  deployments: DeploymentResult[]
  onRedeploy: (deployment: DeploymentResult) => void
  onRollback: (deployment: DeploymentResult) => void
}

export function DeploymentHistory({ deployments, onRedeploy, onRollback }: DeploymentHistoryProps) {
  return (
    <div>
      <p>Deployment History</p>
    </div>
  )
}
