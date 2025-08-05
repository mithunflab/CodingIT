import { FragmentSchema } from './schema'
import { Sandbox } from '@e2b/code-interpreter'
import { TemplateId } from './templates'
import { fragmentNodeMapper } from './fragment-node-mapper'

export interface WorkflowSchema {
  id: string
  name: string
  description?: string
  fragments: FragmentNode[]
  connections: Connection[]
  variables: GlobalVariable[]
  triggers: TriggerConfig[]
  version: number
  created_at: Date
  updated_at: Date
}

export interface FragmentNode {
  id: string
  fragmentId: string
  position: { x: number; y: number }
  inputs: PortMapping[]
  outputs: PortMapping[]
  config: FragmentConfig
  dependencies: string[]
  timeout?: number
}

export interface Connection {
  id: string
  source: {
    nodeId: string
    portId: string
  }
  target: {
    nodeId: string
    portId: string
  }
  dataType: 'string' | 'number' | 'object' | 'array' | 'file'
}

export interface PortMapping {
  id: string
  name: string
  type: 'input' | 'output'
  dataType: 'string' | 'number' | 'object' | 'array' | 'file'
  required: boolean
  defaultValue?: any
}

export interface GlobalVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'object' | 'array'
  value: any
  description?: string
}

export interface TriggerConfig {
  id: string
  type: 'manual' | 'scheduled' | 'webhook' | 'event'
  config: {
    schedule?: string // cron expression
    webhookUrl?: string
    eventType?: string
  }
}

export interface FragmentConfig {
  template: string
  environment: Record<string, string>
  resources: {
    memory?: string
    cpu?: string
    timeout?: number
  }
  retryPolicy: {
    maxRetries: number
    backoffStrategy: 'linear' | 'exponential'
    initialDelay: number
  }
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  inputData: Record<string, any>
  outputData?: Record<string, any>
  executionLog: ExecutionLogEntry[]
  error?: string
}

export interface ExecutionLogEntry {
  timestamp: Date
  nodeId: string
  type: 'start' | 'complete' | 'error' | 'retry'
  message: string
  data?: any
}

export class WorkflowEngine {
  private executions = new Map<string, WorkflowExecution>()

  async executeWorkflow(
    workflow: WorkflowSchema,
    inputData: Record<string, any> = {},
    _triggerType: 'manual' | 'scheduled' | 'webhook' | 'event' = 'manual'
  ): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'pending',
      startedAt: new Date(),
      inputData,
      executionLog: []
    }

    this.executions.set(executionId, execution)

    try {
      execution.status = 'running'
      this.addLog(execution, 'workflow', 'start', `Starting workflow execution: ${workflow.name}`)

      // Validate workflow structure
      this.validateWorkflow(workflow)

      // Build execution graph
      const executionGraph = this.buildExecutionGraph(workflow)

      // Execute nodes in topological order
      const outputData = await this.executeNodes(execution, workflow, executionGraph, inputData)

      execution.status = 'completed'
      execution.completedAt = new Date()
      execution.outputData = outputData
      this.addLog(execution, 'workflow', 'complete', 'Workflow execution completed successfully')

    } catch (error) {
      execution.status = 'failed'
      execution.completedAt = new Date()
      execution.error = error instanceof Error ? error.message : String(error)
      this.addLog(execution, 'workflow', 'error', `Workflow execution failed: ${execution.error}`)
    }

    return execution
  }

  private validateWorkflow(workflow: WorkflowSchema): void {
    // Check for circular dependencies
    const graph = new Map<string, string[]>()
    
    workflow.fragments.forEach(node => {
      graph.set(node.id, node.dependencies || [])
    })

    workflow.connections.forEach(conn => {
      const deps = graph.get(conn.target.nodeId) || []
      deps.push(conn.source.nodeId)
      graph.set(conn.target.nodeId, deps)
    })

    if (this.hasCycles(graph)) {
      throw new Error('Workflow contains circular dependencies')
    }

    // Validate required inputs
    workflow.fragments.forEach(node => {
      node.inputs.forEach(input => {
        if (input.required) {
          const hasConnection = workflow.connections.some(conn => 
            conn.target.nodeId === node.id && conn.target.portId === input.id
          )
          
          if (!hasConnection && input.defaultValue === undefined) {
            throw new Error(`Required input '${input.name}' for node '${node.id}' is not connected`)
          }
        }
      })
    })
  }

  private hasCycles(graph: Map<string, string[]>): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycleDFS = (node: string): boolean => {
      if (recursionStack.has(node)) return true
      if (visited.has(node)) return false

      visited.add(node)
      recursionStack.add(node)

      const neighbors = graph.get(node) || []
      for (const neighbor of neighbors) {
        if (hasCycleDFS(neighbor)) return true
      }

      recursionStack.delete(node)
      return false
    }

    for (const node of Array.from(graph.keys())) {
      if (hasCycleDFS(node)) return true
    }

    return false
  }

  private buildExecutionGraph(workflow: WorkflowSchema): Map<string, FragmentNode[]> {
    const graph = new Map<string, FragmentNode[]>()
    const nodeMap = new Map<string, FragmentNode>()

    // Build node map
    workflow.fragments.forEach(node => {
      nodeMap.set(node.id, node)
      graph.set(node.id, [])
    })

    // Build dependency graph
    workflow.connections.forEach(conn => {
      const targetNode = nodeMap.get(conn.target.nodeId)
      const sourceNode = nodeMap.get(conn.source.nodeId)
      
      if (targetNode && sourceNode) {
        const dependencies = graph.get(conn.target.nodeId) || []
        dependencies.push(sourceNode)
        graph.set(conn.target.nodeId, dependencies)
      }
    })

    return graph
  }

  private async executeNodes(
    execution: WorkflowExecution,
    workflow: WorkflowSchema,
    graph: Map<string, FragmentNode[]>,
    inputData: Record<string, any>
  ): Promise<Record<string, any>> {
    const executedNodes = new Set<string>()
    const nodeResults = new Map<string, any>()
    const outputData: Record<string, any> = {}

    // Set global variables and input data
    workflow.variables.forEach(variable => {
      nodeResults.set(`global.${variable.name}`, variable.value)
    })

    Object.entries(inputData).forEach(([key, value]) => {
      nodeResults.set(`input.${key}`, value)
    })

    // Find nodes with no dependencies (entry points)
    const entryNodes = workflow.fragments.filter(node => {
      const dependencies = graph.get(node.id) || []
      return dependencies.length === 0
    })

    // Execute nodes in topological order using queue
    const queue = [...entryNodes]
    
    while (queue.length > 0) {
      const node = queue.shift()!
      
      if (executedNodes.has(node.id)) continue

      // Check if all dependencies are satisfied
      const dependencies = graph.get(node.id) || []
      const allDependenciesMet = dependencies.every(dep => executedNodes.has(dep.id))
      
      if (!allDependenciesMet) {
        // Put node back in queue and continue
        queue.push(node)
        continue
      }

      try {
        this.addLog(execution, node.id, 'start', `Starting execution of node: ${node.id}`)

        // Prepare node inputs
        const nodeInputs = this.prepareNodeInputs(node, workflow.connections, nodeResults)

        // Execute the fragment
        const result = await this.executeFragment(node, nodeInputs)

        // Store results
        nodeResults.set(node.id, result)
        executedNodes.add(node.id)

        // Store outputs in results map
        node.outputs.forEach(output => {
          const outputKey = `${node.id}.${output.id}`
          nodeResults.set(outputKey, result[output.name] || result)
        })

        this.addLog(execution, node.id, 'complete', `Node execution completed: ${node.id}`)

        // Add dependent nodes to queue
        workflow.fragments.forEach(potentialNext => {
          const deps = graph.get(potentialNext.id) || []
          if (deps.some(dep => dep.id === node.id) && !executedNodes.has(potentialNext.id)) {
            queue.push(potentialNext)
          }
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        this.addLog(execution, node.id, 'error', `Node execution failed: ${errorMsg}`)

        // Handle retry logic
        if (node.config.retryPolicy.maxRetries > 0) {
          this.addLog(execution, node.id, 'retry', `Retrying node execution: ${node.id}`)
          // Implement retry with backoff
          await this.delay(node.config.retryPolicy.initialDelay)
          queue.unshift(node) // Retry this node
        } else {
          throw error
        }
      }
    }

    // Collect final outputs
    workflow.fragments.forEach(node => {
      node.outputs.forEach(output => {
        if (output.name.startsWith('final_')) {
          const key = output.name.replace('final_', '')
          outputData[key] = nodeResults.get(`${node.id}.${output.id}`)
        }
      })
    })

    return outputData
  }

  private prepareNodeInputs(
    node: FragmentNode,
    connections: Connection[],
    nodeResults: Map<string, any>
  ): Record<string, any> {
    const inputs: Record<string, any> = {}

    node.inputs.forEach(input => {
      // Check for connections
      const connection = connections.find(conn => 
        conn.target.nodeId === node.id && conn.target.portId === input.id
      )

      if (connection) {
        const sourceKey = `${connection.source.nodeId}.${connection.source.portId}`
        inputs[input.name] = nodeResults.get(sourceKey)
      } else if (input.defaultValue !== undefined) {
        inputs[input.name] = input.defaultValue
      }
    })

    return inputs
  }

  private async executeFragment(node: FragmentNode, inputs: Record<string, any>): Promise<any> {
    const sandboxTimeout = node.config.resources.timeout || 300000 // 5 minutes default
    
    if (!process.env.E2B_API_KEY) {
      throw new Error('E2B_API_KEY environment variable not found')
    }
    
    try {
      // Convert node to fragment using the mapper
      const fragment = fragmentNodeMapper.nodeToFragment(node)
      
      // Override code with processed inputs if needed  
      if (!fragment.code || fragment.code.trim() === '') {
        throw new Error(`No code configured for workflow node ${node.id}`)
      }

      // Create sandbox with the specified template
      const sbx = await Sandbox.create(fragment.template, {
        metadata: {
          template: fragment.template,
          nodeId: node.id,
          workflowExecution: 'true'
        },
        timeoutMs: sandboxTimeout
      })

      try {
        // Install additional dependencies if needed
        if (node.config.environment.INSTALL_COMMAND) {
          await sbx.commands.run(node.config.environment.INSTALL_COMMAND)
        }

        // Write code to filesystem
        await sbx.files.write(fragment.file_path, fragment.code)

        let result: any

        // Execute based on template type
        if (fragment.template === 'code-interpreter-v1') {
          // For code interpreter, run the code directly
          const execution = await sbx.runCode(fragment.code)
          result = {
            status: execution.error ? 'error' : 'success',
            output: execution.results,
            stdout: execution.logs.stdout,
            stderr: execution.logs.stderr,
            error: execution.error,
            inputs,
            timestamp: new Date().toISOString()
          }
        } else {
          // For web-based templates, start the server and get URL
          const port = fragment.port || 3000
          await sbx.commands.run(`cd /home/user && ${node.config.environment.START_COMMAND || 'npm start'}`, {
            envs: {
              PORT: port.toString(),
              ...node.config.environment
            }
          })

          result = {
            status: 'success',
            output: `https://${sbx.getHost(port)}`,
            url: `https://${sbx.getHost(port)}`,
            sandboxId: sbx.sandboxId,
            inputs,
            timestamp: new Date().toISOString()
          }
        }

        return result
      } finally {
        // Keep sandbox running for web templates, kill for code interpreter
        if (fragment.template === 'code-interpreter-v1') {
          await sbx.kill()
        }
      }
    } catch (error) {
      throw new Error(`Failed to execute fragment: ${error instanceof Error ? error.message : String(error)}`)
    }
  }


  private addLog(execution: WorkflowExecution, nodeId: string, type: ExecutionLogEntry['type'], message: string, data?: any): void {
    execution.executionLog.push({
      timestamp: new Date(),
      nodeId,
      type,
      message,
      data
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public methods for execution management
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId)
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled'
      execution.completedAt = new Date()
      this.addLog(execution, 'workflow', 'error', 'Workflow execution cancelled by user')
      return true
    }
    return false
  }

  listExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values())
    return workflowId 
      ? executions.filter(exec => exec.workflowId === workflowId)
      : executions
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine()