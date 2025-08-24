# Memoria: Bedtime Stories Across Generations

Memoria is a full-stack AI-powered platform for preserving, sharing, and continuing bedtime stories across generations. Users can record or upload stories, which are then transcribed, analyzed, and made public for all to enjoy. The platform uses GPT-5 to extract the story's summary, humor, meaning, and more, and allows interactive chat to ask about or continue the story.

## Features

- 🎤 **Record or Upload**: Capture bedtime stories by recording audio or uploading files.
- 🤖 **AI Analysis**: Stories are transcribed and analyzed by GPT-5 for summary, humor, themes, and meaning.
- 📖 **Public Library**: All stories are visible to everyone, preserving culture and wisdom for future generations.
- 💬 **Interactive Chat**: Ask questions about the story or say "continue" to have the AI continue the tale in the same style.
- 🔊 **Audio Playback**: Listen to the original story audio.
- 📝 **Transcript & Meaning**: View the full transcript and the story's main lesson or essence.
- 🌈 **Modern UI**: Beautiful, accessible, and demo-friendly interface.

## Demo

1. **Start the backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
2. **Start the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Record or upload a story, process it, and explore the results!

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: FastAPI, Python, ChromaDB, GPT-5 API
- **AI**: GPT-5 (via AIML API)

## How It Works
1. **Upload/Record**: User uploads or records a bedtime story.
2. **Transcription & Analysis**: The backend transcribes (placeholder or real) and sends the transcript to GPT-5 for analysis.
3. **AI Output**: GPT-5 returns summary, humor, themes, meaning, and more.
4. **Public Sharing**: The story and its analysis are made public for all users.
5. **Interactive Chat**: Users can ask about the story or ask the AI to continue it.

## Example Use Cases
- Preserve family stories for future generations.
- Share cultural tales and wisdom with the world.
- Let children and adults interactively explore and extend stories.

## Local Development
- Requires Python 3.10+, Node.js 18+, and (optionally) ffmpeg for audio.
- Set your GPT-5 API key in `backend/.env` as `AIML_API_KEY=your_key_here`.

## License
MIT

---

