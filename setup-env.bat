@echo off
echo 🚀 Setting up environment variables for candidate ranking...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please create it first.
    pause
    exit /b 1
)

REM Add Gemini API key if not present
findstr /C:"GEMINI_API_KEY=" .env >nul
if %errorlevel% neq 0 (
    echo.
    echo 📝 Please enter your Gemini API key:
    echo Get it from: https://makersuite.google.com/app/apikey
    set /p gemini_key="Gemini API Key: "
    
    echo. >> .env
    echo # Google Gemini API for embeddings and LLM reranking >> .env
    echo GEMINI_API_KEY=%gemini_key% >> .env
    echo ✅ GEMINI_API_KEY added to .env
) else (
    echo ✅ GEMINI_API_KEY already exists in .env
)

REM Check Qdrant variables
findstr /C:"QDRANT_URL=" .env >nul
if %errorlevel% neq 0 (
    echo.
    echo 📝 Qdrant configuration not found.
    echo If you have Qdrant, enter your credentials (press Enter to skip):
    set /p qdrant_url="Qdrant URL: "
    
    if not "%qdrant_url%"=="" (
        set /p qdrant_key="Qdrant API Key: "
        
        echo. >> .env
        echo # Qdrant for vector search >> .env
        echo QDRANT_URL=%qdrant_url% >> .env
        echo QDRANT_API_KEY=%qdrant_key% >> .env
        echo ✅ Qdrant configuration added to .env
    ) else (
        echo ⚠️ Skipping Qdrant setup (vector search will be disabled)
    )
) else (
    echo ✅ Qdrant configuration already exists in .env
)

echo.
echo 🎉 Setup complete! Please restart your development server:
echo npm run dev
pause
