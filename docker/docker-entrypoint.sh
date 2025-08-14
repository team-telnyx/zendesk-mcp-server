#!/bin/sh
set -e

# Load Vault secrets if available (Kubernetes deployment)
if [ -f "/vault/secrets/zendesk-mcp-server.env" ]; then
    echo "✅ Loading Vault secrets from /vault/secrets/zendesk-mcp-server.env"
    set -a  # automatically export all variables
    . /vault/secrets/zendesk-mcp-server.env
    set +a  # disable automatic export
else
    echo "ℹ️ No Vault secrets found, using environment variables"
fi

# Execute the main command
exec "$@"