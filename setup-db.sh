#!/bin/bash

# PostgreSQL Setup Script for DBMS Project

echo "Setting up PostgreSQL database for DBMS project..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service:"
    echo "   sudo systemctl start postgresql  # Linux"
    echo "   brew services start postgresql  # macOS"
    exit 1
fi

# Create database if it doesn't exist
echo "Creating database 'dbms_project'..."
createdb dbms_project 2>/dev/null || echo "Database already exists or creation failed"

echo "✅ PostgreSQL setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with your PostgreSQL credentials"
echo "2. Run: cd server && node setup.js"