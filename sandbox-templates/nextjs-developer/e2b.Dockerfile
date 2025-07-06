# Use ARG to define versions for easier updates
ARG NODE_VERSION=22-slim
ARG NEXT_APP_VERSION=14.2.20
ARG SHADCN_VERSION=2.1.7

# ---- Base Image ----
# Use a base image with Node pre-installed
FROM node:${NODE_VERSION} as base

# Set up the environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /home/user/app

# ---- Builder Stage ----
# This stage is for building the Next.js application
FROM base as builder

# Install necessary build tools
RUN apt-get update && apt-get install -y --no-install-recommends curl git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create the Next.js application
# Using --use-pnpm for faster dependency installation
RUN npx create-next-app@${NEXT_APP_VERSION} . --ts --tailwind --no-eslint --import-alias "@/*" --use-pnpm --no-app --no-src-dir

# Copy custom configurations
COPY _app.tsx pages/_app.tsx

# Initialize and add shadcn components
# The -y flag accepts all defaults
RUN npx shadcn-cli@${SHADCN_VERSION} init -y
RUN npx shadcn-cli@${SHADCN_VERSION} add --all -y

# Install additional dependencies
RUN pnpm install posthog-js

# ---- Runtime Stage ----
# This stage creates the final, smaller image
FROM base as runtime

WORKDIR /home/user/app

# Copy dependencies and application code from the builder stage
COPY --from=builder /home/user/app/package.json /home/user/app/pnpm-lock.yaml ./
RUN pnpm install --prod

COPY --from=builder /home/user/app/ ./

# Copy the compile script and make it executable
COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Create a non-root user for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3000

# Set the default command to start the Next.js app in development mode
CMD ["pnpm", "run", "dev"]
