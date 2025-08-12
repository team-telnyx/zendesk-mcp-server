FROM node:18.16.0

# Set working directory
WORKDIR /app

# Set build arguments
ARG GIT_COMMIT
ARG GIT_COMMIT_DATE
ARG IMAGE_NAME
ARG BUILD_DATE
ARG BUILD_URL
ARG VER_NODE

# Set environment labels
LABEL git.commit=$GIT_COMMIT \
      git.commit_date=$GIT_COMMIT_DATE \
      image.name=$IMAGE_NAME \
      build.date=$BUILD_DATE \
      build.url=$BUILD_URL \
      node.version=$VER_NODE

# Add `/app/node_modules/.bin` to $PATH
ENV PATH="/app/node_modules/.bin:$PATH"

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY src/ ./src/
COPY CLAUDE.md ./
COPY README.md ./

# Create non-root user for security
RUN groupadd -r mcpserver && useradd -r -g mcpserver mcpserver
RUN chown -R mcpserver:mcpserver /app
USER mcpserver

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the HTTP server
CMD ["npm", "run", "start:http"]