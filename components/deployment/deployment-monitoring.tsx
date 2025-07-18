'use client'

import * as React from 'react'
import { DeploymentResult } from '@/lib/deployment/deployment-engine'

interface DeploymentMonitoringProps {
  deployments: DeploymentResult[]
  onRefresh: () => void
}

export function DeploymentMonitoring({ deployments, onRefresh }: DeploymentMonitoringProps) {
  return (
    <div>
      <p>Deployment Monitoring</p>
    </div>
  )
}
