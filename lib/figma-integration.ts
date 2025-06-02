interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  fills?: any[]
  strokes?: any[]
  effects?: any[]
  constraints?: any
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  style?: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    textAlignHorizontal?: string
    textAlignVertical?: string
    lineHeightPx?: number
    letterSpacing?: number
  }
  characters?: string
  cornerRadius?: number
  opacity?: number
}

interface FigmaFile {
  document: FigmaNode
  components: Record<string, any>
  styles: Record<string, any>
  schemaVersion: number
  name: string
}

interface FigmaDesignTokens {
  colors: { name: string; value: string; usage: string }[]
  typography: { name: string; fontFamily: string; fontSize: number; fontWeight: number; lineHeight?: number }[]
  spacing: { name: string; value: number }[]
  borderRadius: { name: string; value: number }[]
  shadows: { name: string; value: string }[]
}

export class FigmaIntegration {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIGMA_API_KEY || ""
  }

  // Extract file ID from Figma URL
  extractFileId(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|proto)\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  // Get Figma file data
  async getFile(fileId: string): Promise<FigmaFile | null> {
    if (!this.apiKey) {
      console.warn("Figma API key not provided")
      return null
    }

    try {
      const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
        headers: {
          "X-Figma-Token": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching Figma file:", error)
      return null
    }
  }

  // Get file images for better analysis
  async getFileImages(fileId: string, nodeIds: string[]): Promise<Record<string, string> | null> {
    if (!this.apiKey || nodeIds.length === 0) return null

    try {
      const idsParam = nodeIds.join(",")
      const response = await fetch(`https://api.figma.com/v1/images/${fileId}?ids=${idsParam}&format=png&scale=2`, {
        headers: {
          "X-Figma-Token": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Figma Images API error: ${response.status}`)
      }

      const data = await response.json()
      return data.images
    } catch (error) {
      console.error("Error fetching Figma images:", error)
      return null
    }
  }

  // Extract design tokens from Figma file
  extractDesignTokens(figmaFile: FigmaFile): FigmaDesignTokens {
    const tokens: FigmaDesignTokens = {
      colors: [],
      typography: [],
      spacing: [],
      borderRadius: [],
      shadows: [],
    }

    const processNode = (node: FigmaNode, depth = 0) => {
      // Extract colors
      if (node.fills) {
        node.fills.forEach((fill, index) => {
          if (fill.type === "SOLID" && fill.color) {
            const { r, g, b, a = 1 } = fill.color
            const hex = `#${Math.round(r * 255)
              .toString(16)
              .padStart(2, "0")}${Math.round(g * 255)
              .toString(16)
              .padStart(2, "0")}${Math.round(b * 255)
              .toString(16)
              .padStart(2, "0")}`

            const colorName = node.name.toLowerCase().includes("color") ? node.name : `${node.name}-fill-${index}`

            if (!tokens.colors.find((c) => c.value === hex)) {
              tokens.colors.push({
                name: colorName,
                value:
                  a < 1
                    ? `${hex}${Math.round(a * 255)
                        .toString(16)
                        .padStart(2, "0")}`
                    : hex,
                usage: this.determineColorUsage(node.type, node.name),
              })
            }
          }
        })
      }

      // Extract typography
      if (node.type === "TEXT" && node.style) {
        const { fontFamily, fontSize, fontWeight, lineHeightPx, letterSpacing } = node.style
        if (fontFamily && fontSize) {
          const typographyName = node.name || `text-${fontSize}px`
          if (!tokens.typography.find((t) => t.name === typographyName)) {
            tokens.typography.push({
              name: typographyName,
              fontFamily,
              fontSize,
              fontWeight: fontWeight || 400,
              lineHeight: lineHeightPx,
            })
          }
        }
      }

      // Extract border radius
      if (node.cornerRadius !== undefined) {
        const radiusName = `${node.name}-radius`
        if (!tokens.borderRadius.find((r) => r.value === node.cornerRadius)) {
          tokens.borderRadius.push({
            name: radiusName,
            value: node.cornerRadius,
          })
        }
      }

      // Extract spacing from layout
      if (node.absoluteBoundingBox && node.children) {
        const spacing = this.calculateSpacing(node)
        spacing.forEach((space) => {
          if (!tokens.spacing.find((s) => s.value === space.value)) {
            tokens.spacing.push(space)
          }
        })
      }

      // Extract shadows
      if (node.effects) {
        node.effects.forEach((effect, index) => {
          if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
            const shadowName = `${node.name}-shadow-${index}`
            const shadowValue = this.formatShadow(effect)
            if (shadowValue && !tokens.shadows.find((s) => s.value === shadowValue)) {
              tokens.shadows.push({
                name: shadowName,
                value: shadowValue,
              })
            }
          }
        })
      }

      // Process children
      if (node.children) {
        node.children.forEach((child) => processNode(child, depth + 1))
      }
    }

    processNode(figmaFile.document)
    return tokens
  }

  // Convert Figma design to comprehensive code description
  analyzeDesign(figmaFile: FigmaFile): string {
    const tokens = this.extractDesignTokens(figmaFile)
    const layout = this.analyzeLayout(figmaFile.document)
    const components = this.identifyComponents(figmaFile.document)
    const interactions = this.analyzeInteractions(figmaFile.document)

    return `# Figma Design Analysis: ${figmaFile.name}

## 🎨 Design Tokens

### Colors
${tokens.colors.map((color) => `- **${color.name}**: \`${color.value}\` (${color.usage})`).join("\n")}

### Typography
${tokens.typography.map((font) => `- **${font.name}**: ${font.fontFamily} ${font.fontSize}px, weight ${font.fontWeight}${font.lineHeight ? `, line-height ${font.lineHeight}px` : ""}`).join("\n")}

### Spacing
${tokens.spacing.map((space) => `- **${space.name}**: ${space.value}px`).join("\n")}

### Border Radius
${tokens.borderRadius.map((radius) => `- **${radius.name}**: ${radius.value}px`).join("\n")}

### Shadows
${tokens.shadows.map((shadow) => `- **${shadow.name}**: \`${shadow.value}\``).join("\n")}

## 🏗️ Layout Structure
${layout}

## 🧩 Components Identified
${components.map((comp) => `- ${comp}`).join("\n")}

## ⚡ Interactions & States
${interactions.map((interaction) => `- ${interaction}`).join("\n")}

## 📋 Implementation Requirements

Please create a React component that:

1. **Matches the exact visual design** from the Figma file
2. **Uses the extracted design tokens** for consistent styling
3. **Implements responsive behavior** for mobile and desktop
4. **Includes proper accessibility** (ARIA labels, semantic HTML)
5. **Uses modern CSS practices** (Flexbox/Grid, CSS custom properties)
6. **Implements any interactive elements** identified in the design
7. **Follows React best practices** (TypeScript, proper component structure)
8. **Uses Tailwind CSS** with custom configuration for design tokens

Create a comprehensive, production-ready implementation that perfectly matches the Figma design.`
  }

  private determineColorUsage(nodeType: string, nodeName: string): string {
    const name = nodeName.toLowerCase()
    if (name.includes("background") || name.includes("bg")) return "background"
    if (name.includes("text") || nodeType === "TEXT") return "text"
    if (name.includes("border") || name.includes("stroke")) return "border"
    if (name.includes("button") || name.includes("btn")) return "interactive"
    if (name.includes("primary")) return "primary"
    if (name.includes("secondary")) return "secondary"
    if (name.includes("accent")) return "accent"
    return "general"
  }

  private calculateSpacing(node: FigmaNode): { name: string; value: number }[] {
    const spacing: { name: string; value: number }[] = []

    if (node.children && node.children.length > 1) {
      // Calculate gaps between children
      const sortedChildren = node.children
        .filter((child) => child.absoluteBoundingBox)
        .sort(
          (a, b) =>
            a.absoluteBoundingBox!.y - b.absoluteBoundingBox!.y || a.absoluteBoundingBox!.x - b.absoluteBoundingBox!.x,
        )

      for (let i = 1; i < sortedChildren.length; i++) {
        const prev = sortedChildren[i - 1].absoluteBoundingBox!
        const curr = sortedChildren[i].absoluteBoundingBox!

        const verticalGap = curr.y - (prev.y + prev.height)
        const horizontalGap = curr.x - (prev.x + prev.width)

        if (verticalGap > 0 && verticalGap < 200) {
          spacing.push({ name: `gap-vertical-${verticalGap}`, value: verticalGap })
        }
        if (horizontalGap > 0 && horizontalGap < 200) {
          spacing.push({ name: `gap-horizontal-${horizontalGap}`, value: horizontalGap })
        }
      }
    }

    return spacing
  }

  private formatShadow(effect: any): string | null {
    if (!effect.color || !effect.offset) return null

    const { r, g, b, a = 1 } = effect.color
    const { x, y } = effect.offset
    const blur = effect.radius || 0
    const spread = effect.spread || 0

    const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`
  }

  private analyzeLayout(node: FigmaNode): string {
    const layoutInfo: string[] = []

    const analyzeNode = (n: FigmaNode, depth = 0): void => {
      const indent = "  ".repeat(depth)

      if (n.type === "FRAME" || n.type === "GROUP" || n.type === "COMPONENT") {
        const bounds = n.absoluteBoundingBox
        const sizeInfo = bounds ? ` (${Math.round(bounds.width)}×${Math.round(bounds.height)})` : ""

        layoutInfo.push(`${indent}📦 **${n.name}**: ${n.type.toLowerCase()}${sizeInfo}`)

        if (n.children && n.children.length > 0) {
          const childTypes = n.children.map((child) => child.type).join(", ")
          layoutInfo.push(`${indent}   └─ Contains: ${childTypes}`)

          // Analyze layout direction
          if (n.children.length > 1) {
            const direction = this.detectLayoutDirection(n.children)
            if (direction) {
              layoutInfo.push(`${indent}   └─ Layout: ${direction}`)
            }
          }
        }
      } else if (n.type === "TEXT") {
        layoutInfo.push(
          `${indent}📝 **${n.name}**: "${n.characters?.substring(0, 30)}${n.characters && n.characters.length > 30 ? "..." : ""}"`,
        )
      } else if (n.type === "RECTANGLE" || n.type === "ELLIPSE") {
        const bounds = n.absoluteBoundingBox
        const sizeInfo = bounds ? ` (${Math.round(bounds.width)}×${Math.round(bounds.height)})` : ""
        layoutInfo.push(`${indent}🔲 **${n.name}**: ${n.type.toLowerCase()}${sizeInfo}`)
      }

      if (n.children) {
        n.children.forEach((child) => analyzeNode(child, depth + 1))
      }
    }

    analyzeNode(node)
    return layoutInfo.join("\n")
  }

  private detectLayoutDirection(children: FigmaNode[]): string | null {
    if (children.length < 2) return null

    const positions = children.filter((child) => child.absoluteBoundingBox).map((child) => child.absoluteBoundingBox!)

    if (positions.length < 2) return null

    // Check if elements are arranged horizontally
    const horizontallyAligned = positions.every((pos, i) => {
      if (i === 0) return true
      const prev = positions[i - 1]
      return Math.abs(pos.y - prev.y) < 10 // Allow small vertical variance
    })

    // Check if elements are arranged vertically
    const verticallyAligned = positions.every((pos, i) => {
      if (i === 0) return true
      const prev = positions[i - 1]
      return Math.abs(pos.x - prev.x) < 10 // Allow small horizontal variance
    })

    if (horizontallyAligned) return "horizontal (flex-row)"
    if (verticallyAligned) return "vertical (flex-col)"
    return "grid or absolute positioning"
  }

  private identifyComponents(node: FigmaNode): string[] {
    const components: string[] = []

    const identifyFromNode = (n: FigmaNode): void => {
      const name = n.name.toLowerCase()
      const type = n.type

      // Identify components based on naming patterns and structure
      if (type === "COMPONENT" || type === "COMPONENT_SET") {
        components.push(`🧩 **Component**: ${n.name} (Figma component)`)
      } else if (name.includes("button") || name.includes("btn")) {
        components.push(`🔘 **Button**: ${n.name}`)
      } else if (name.includes("card")) {
        components.push(`🃏 **Card**: ${n.name}`)
      } else if (name.includes("header") || name.includes("nav")) {
        components.push(`🧭 **Navigation**: ${n.name}`)
      } else if (name.includes("footer")) {
        components.push(`🦶 **Footer**: ${n.name}`)
      } else if (name.includes("form") || name.includes("input")) {
        components.push(`📝 **Form Element**: ${n.name}`)
      } else if (name.includes("hero")) {
        components.push(`🦸 **Hero Section**: ${n.name}`)
      } else if (name.includes("modal") || name.includes("dialog")) {
        components.push(`🪟 **Modal/Dialog**: ${n.name}`)
      } else if (name.includes("sidebar") || name.includes("aside")) {
        components.push(`📋 **Sidebar**: ${n.name}`)
      } else if (name.includes("avatar") || name.includes("profile")) {
        components.push(`👤 **Avatar/Profile**: ${n.name}`)
      } else if (name.includes("badge") || name.includes("tag")) {
        components.push(`🏷️ **Badge/Tag**: ${n.name}`)
      } else if (name.includes("icon")) {
        components.push(`🎯 **Icon**: ${n.name}`)
      }

      if (n.children) {
        n.children.forEach(identifyFromNode)
      }
    }

    identifyFromNode(node)
    return [...new Set(components)] // Remove duplicates
  }

  private analyzeInteractions(node: FigmaNode): string[] {
    const interactions: string[] = []

    const analyzeNode = (n: FigmaNode): void => {
      const name = n.name.toLowerCase()

      // Identify potential interactive elements
      if (name.includes("button") || name.includes("btn")) {
        interactions.push(`🖱️ **${n.name}**: Clickable button (add onClick handler)`)
      } else if (name.includes("link")) {
        interactions.push(`🔗 **${n.name}**: Navigation link (add href or routing)`)
      } else if (name.includes("input") || name.includes("field")) {
        interactions.push(`⌨️ **${n.name}**: Form input (add value and onChange)`)
      } else if (name.includes("dropdown") || name.includes("select")) {
        interactions.push(`📋 **${n.name}**: Dropdown/Select (add options and selection logic)`)
      } else if (name.includes("toggle") || name.includes("switch")) {
        interactions.push(`🔄 **${n.name}**: Toggle/Switch (add boolean state)`)
      } else if (name.includes("tab")) {
        interactions.push(`📑 **${n.name}**: Tab navigation (add active state management)`)
      } else if (name.includes("modal") || name.includes("popup")) {
        interactions.push(`🪟 **${n.name}**: Modal/Popup (add open/close state)`)
      } else if (name.includes("hover") || name.includes("active")) {
        interactions.push(`✨ **${n.name}**: Hover/Active state (add CSS pseudo-classes)`)
      }

      if (n.children) {
        n.children.forEach(analyzeNode)
      }
    }

    analyzeNode(node)
    return [...new Set(interactions)]
  }
}
