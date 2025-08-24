import React, { useEffect, useState } from "react";

export default function PublicStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stories/public")
      .then((res) => res.json())
      .then((data) => {
        setStories(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">🌙 Bedtime Stories for All</h1>
      {loading ? (
        <div>Loading...</div>
      ) : stories.length === 0 ? (
        <div>No public stories yet.</div>
      ) : (
        <ul className="space-y-6">
          {stories.map((story) => (
            <li key={story.id} className="border rounded-lg p-4 bg-white shadow">
              <h2 className="text-xl font-semibold mb-2">{story.title}</h2>
              <div className="mb-2 text-gray-700">{story.summary}</div>
              {story.humor && (
                <div className="mb-1 text-sm text-blue-700"><b>Humor:</b> {story.humor}</div>
              )}
              {story.essence && (
                <div className="mb-1 text-sm text-green-700"><b>Essence:</b> {story.essence}</div>
              )}
              {story.memorable_quote && (
                <div className="mb-1 text-sm text-purple-700"><b>Memorable Quote:</b> “{story.memorable_quote}”</div>
              )}
              <div className="text-xs text-gray-400 mt-2">Shared on {new Date(story.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
