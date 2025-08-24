// frontend/components/StoryResult.js

import ValuePill from "./ValuePill";
import ChatInterface from "./ChatInterface"; // Import the chat component

export default function StoryResult({ storyData, onReset, storyId }) {
  if (!storyData) return null;

  return (
    <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-xl shadow-lg animate-fade-in">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{storyData.title}</h1>
        <p className="text-2xl mt-2" aria-label="Emoji Summary">{storyData.emoji_summary}</p>
      </div>

      {/* Summary Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Summary</h2>
        <p className="text-gray-600 leading-relaxed pt-2">{storyData.summary}</p>
      </div>

      {/* Themes Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Key Themes</h2>
        <div className="pt-2">
            {storyData.themes.map(theme => <ValuePill key={theme}>{theme}</ValuePill>)}
        </div>
      </div>
      
      {/* Personality Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Speaker's Personality</h2>
        <div className="pt-2">
            {storyData.personality_traits.map(trait => <ValuePill key={trait}>{trait}</ValuePill>)}
        </div>
      </div>
      
      {/* Cultural References Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Things You Might Not Know</h2>
        <ul className="list-disc list-inside space-y-3 pt-2">
          {storyData.cultural_references.map(ref => (
            <li key={ref.term} className="text-gray-700">
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
          className="px-6 py-2 text-white bg-violet-600 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
        >
          Analyze Another Story
        </button>
      </div>
    </div>
  );
}