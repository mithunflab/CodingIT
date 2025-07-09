## Tailwind CSS - Theming
**Pattern: Theme-Aware Styling**
- For styles that need to adapt to different themes (e.g., light/dark mode), prefer using theme-configured utility classes (e.g., `bg-background`, `text-foreground`, `ring-border`) over hardcoding colors with `dark:` prefixes.
- *Rationale:* This approach leverages the central theme configuration, making the styling more maintainable and ensuring consistency across the application. It avoids scattering theme-specific logic throughout individual components.

## Component Styling
**Best Practice: Consistent Styling for Component Instances**
- When updating the style of a reusable component, ensure that the changes are applied consistently across all its instances, even if they have minor variations in their existing styles.
- *Rationale:* This maintains visual uniformity and predictable behavior for the component throughout the application.
