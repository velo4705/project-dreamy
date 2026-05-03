#!/bin/bash

# Neon PostgreSQL Setup for DBMS Project

echo "🚀 Setting up Neon PostgreSQL for your DBMS project..."
echo ""

# Check if neonctl is installed
if ! command -v neonctl &> /dev/null; then
    echo "📦 Installing neonctl..."
    npm install -g neonctl
fi

# Authenticate with Neon (user will need to do this manually)
echo "🔐 Please authenticate with Neon:"
echo "Run: neonctl auth"
echo "Follow the browser login instructions"
echo ""
read -p "Press Enter after you've authenticated with Neon..."

# Create a new project
echo "🏗️ Creating Neon project..."
PROJECT_OUTPUT=$(neonctl projects create --name "dbms-project")
echo "$PROJECT_OUTPUT"

# Extract project ID and connection details
PROJECT_ID=$(echo "$PROJECT_OUTPUT" | grep -o 'project_id: [a-zA-Z0-9-]*' | cut -d' ' -f2)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Failed to create project. Please check your Neon authentication."
    exit 1
fi

echo "✅ Project created with ID: $PROJECT_ID"

# Get connection string
echo "🔗 Getting connection details..."
CONNECTION_OUTPUT=$(neonctl connection-string $PROJECT_ID)
echo "Connection string: $CONNECTION_OUTPUT"

# Extract database details from connection string
# Format: postgresql://username:password@host/database?sslmode=require
CONNECTION_STRING=$(echo "$CONNECTION_OUTPUT" | grep "postgresql://" | head -1)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Failed to get connection string"
    exit 1
fi

# Parse connection string
DB_USER=$(echo "$CONNECTION_STRING" | sed 's|postgresql://\([^:]*\):.*|\1|')
DB_PASSWORD=$(echo "$CONNECTION_STRING" | sed 's|postgresql://[^:]*:\([^@]*\)@.*|\1|')
DB_HOST=$(echo "$CONNECTION_STRING" | sed 's|postgresql://[^@]*@\([^/]*\)/.*|\1|')
DB_NAME=$(echo "$CONNECTION_STRING" | sed 's|.*/\([^?]*\).*|\1|')

echo ""
echo "📝 Database Configuration:"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_HOST=$DB_HOST"
echo "DB_NAME=$DB_NAME"
echo "DB_PORT=5432"
echo ""
echo "💡 Update your .env file with these values!"
echo "💡 Then run: cd server && node setup.js"