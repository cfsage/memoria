// frontend/components/StoryResult.js


import ValuePill from "./ValuePill";
import ChatInterface from "./ChatInterface"; // Import the chat component

export default function StoryResult({ storyData, onReset, storyId, audioUrl, transcript }) {
  if (!storyData) return null;

  // Try to get audio URL and transcript from props or storyData
  const audioSrc = audioUrl || storyData.audio_url;
  const transcriptText = transcript || storyData.transcript;

  return (
    <div className="w-full max-w-2xl p-8 space-y-10 bg-gradient-to-br from-violet-50 to-white rounded-3xl shadow-2xl animate-fade-in border border-violet-100">
      {/* Header Section */}
      <div className="mb-4">
        <h1 className="text-4xl font-extrabold text-violet-800 drop-shadow-sm tracking-tight">{storyData.title}</h1>
        {storyData.emoji_summary && <p className="text-3xl mt-2" aria-label="Emoji Summary">{storyData.emoji_summary}</p>}
      </div>


      {/* Audio Playback Section */}
      {audioSrc && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-violet-700 border-b pb-2">Listen to the Story</h2>
          <audio src={audioSrc} controls className="w-full mt-2 rounded-lg border border-violet-200 shadow" />
        </div>
      )}

      {/* Summary Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-violet-700 border-b pb-2">Summary</h2>
        <p className="text-lg text-gray-800 leading-relaxed pt-2 font-medium bg-violet-50 rounded p-3 shadow-inner">{storyData.summary}</p>
      </div>

      {/* Meaning / Essence Section */}
      {storyData.essence && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-green-700 border-b pb-2">What You Can Learn / Meaning</h2>
          <p className="text-lg text-green-900 font-semibold leading-relaxed pt-2 bg-green-50 rounded p-3 shadow-inner">{storyData.essence}</p>
        </div>
      )}
      {/* Transcript Section */}
      {transcriptText && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-violet-700 border-b pb-2">Transcript</h2>
          <pre className="bg-gray-900 rounded p-4 text-green-200 whitespace-pre-wrap text-base font-mono shadow-inner overflow-x-auto max-h-64">{transcriptText}</pre>
        </div>
      )}

      {/* Themes Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-violet-700 border-b pb-2">Key Themes</h2>
        <div className="pt-2 flex flex-wrap gap-2">
            {storyData.themes.map(theme => <ValuePill key={theme}>{theme}</ValuePill>)}
        </div>
      </div>
      
      {/* Personality Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-violet-700 border-b pb-2">Speaker&apos;s Personality</h2>
        <div className="pt-2 flex flex-wrap gap-2">
            {storyData.personality_traits.map(trait => <ValuePill key={trait}>{trait}</ValuePill>)}
        </div>
      </div>
      
      {/* Cultural References Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-violet-700 border-b pb-2">Things You Might Not Know</h2>
        <ul className="list-disc list-inside space-y-3 pt-2">
          {(storyData.cultural_references || []).map(ref => (
            <li key={ref.term} className="text-gray-800 text-base">
              <strong className="font-semibold text-violet-700">{ref.term}:</strong> {ref.explanation}
            </li>
          ))}
        </ul>
      </div>

      {/* Interactive Chat Section */}
      <ChatInterface storyId={storyId} />

      {/* Reset Button */}
      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-violet-600 to-violet-400 rounded-full shadow-lg hover:from-violet-700 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200"
        >
          Analyze Another Story
        </button>
      </div>
    </div>
  );
}