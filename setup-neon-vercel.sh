#!/bin/bash

# Complete Neon Database Setup for Vercel Integration

echo "🚀 Setting up Neon Database for Vercel Integration..."
echo ""

# Check if neonctl is installed
if ! command -v neonctl &> /dev/null; then
    echo "📦 Installing neonctl..."
    npm install -g neonctl
fi

echo "🔐 Please authenticate with Neon (if not already done):"
echo "neonctl auth"
echo ""
read -p "Press Enter after authentication..."

# Create a new project
echo "🏗️ Creating new Neon project..."
PROJECT_OUTPUT=$(neonctl projects create --name "dreamy-dbms-vercel")

echo "$PROJECT_OUTPUT"

# Extract project ID
PROJECT_ID=$(echo "$PROJECT_OUTPUT" | grep -o 'id: [a-zA-Z0-9-]*' | cut -d' ' -f2)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Failed to create project. Using existing project ID..."
    # Ask user for project ID
    read -p "Enter your Neon project ID: " PROJECT_ID
fi

echo "✅ Project ID: $PROJECT_ID"

# Get connection string
echo "🔗 Getting connection details..."
CONNECTION_OUTPUT=$(neonctl connection-string $PROJECT_ID)
echo "Connection string: $CONNECTION_OUTPUT"

# Parse connection string
CONNECTION_STRING=$(echo "$CONNECTION_OUTPUT" | grep "postgresql://" | head -1)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Failed to get connection string"
    exit 1
fi

# Parse the connection string
DB_USER=$(echo "$CONNECTION_STRING" | sed 's|postgresql://\([^:]*\):.*|\1|')
DB_PASSWORD=$(echo "$CONNECTION_STRING" | sed 's|postgresql://[^:]*:\([^@]*\)@.*|\1|')
DB_HOST=$(echo "$CONNECTION_STRING" | sed 's|postgresql://[^@]*@\([^/]*\)/.*|\1|')
DB_NAME=$(echo "$CONNECTION_STRING" | sed 's|.*/\([^?]*\).*|\1|')

echo ""
echo "📝 New Database Configuration:"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=5432"
echo "DB_NAME=$DB_NAME"
echo ""

# Update .env file
echo "📝 Updating .env file..."
cat > .env << EOF
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
JWT_SECRET=dreamy_dbms_project_super_secret_jwt_key_2026_secure_random_string
EOF

echo "✅ .env file updated!"

# Copy to server directory
cp .env server/.env

echo ""
echo "🗄️ Setting up database schema and data..."

# Run the database setup
cd server && node setup.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup complete!"
    echo ""
    echo "📋 Add these to Vercel Environment Variables:"
    echo "DB_USER=$DB_USER"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "DB_HOST=$DB_HOST"
    echo "DB_PORT=5432"
    echo "DB_NAME=$DB_NAME"
    echo "JWT_SECRET=dreamy_dbms_project_super_secret_jwt_key_2026_secure_random_string"
    echo ""
    echo "🚀 Ready for Vercel deployment!"
else
    echo "❌ Database setup failed. Please check your connection."
fi