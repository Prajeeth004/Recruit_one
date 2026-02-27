#!/bin/bash

echo "🚀 Setting up environment variables for candidate ranking..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Add Gemini API key if not present
if ! grep -q "GEMINI_API_KEY=" .env; then
    echo ""
    echo "📝 Please enter your Gemini API key:"
    echo "Get it from: https://makersuite.google.com/app/apikey"
    read -p "Gemini API Key: " gemini_key
    echo "" >> .env
    echo "# Google Gemini API for embeddings and LLM reranking" >> .env
    echo "GEMINI_API_KEY=$gemini_key" >> .env
    echo "✅ GEMINI_API_KEY added to .env"
else
    echo "✅ GEMINI_API_KEY already exists in .env"
fi

# Check Qdrant variables
if ! grep -q "QDRANT_URL=" .env; then
    echo ""
    echo "📝 Qdrant configuration not found."
    echo "If you have Qdrant, enter your credentials (press Enter to skip):"
    read -p "Qdrant URL: " qdrant_url
    if [ ! -z "$qdrant_url" ]; then
        read -p "Qdrant API Key: " qdrant_key
        echo "" >> .env
        echo "# Qdrant for vector search" >> .env
        echo "QDRANT_URL=$qdrant_url" >> .env
        echo "QDRANT_API_KEY=$qdrant_key" >> .env
        echo "✅ Qdrant configuration added to .env"
    else
        echo "⚠️ Skipping Qdrant setup (vector search will be disabled)"
    fi
else
    echo "✅ Qdrant configuration already exists in .env"
fi

echo ""
echo "🎉 Setup complete! Please restart your development server:"
echo "npm run dev"
