// frontend/app/dashboard/page.js
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Import the useAuth hook

// The StoryRow component is now inside the Dashboard file for simplicity
const StoryRow = ({ story, token }) => {
    const [isPublic, setIsPublic] = useState(story.is_public);
    const [isLoading, setIsLoading] = useState(false);

    const togglePublic = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/stories/${story.id}/toggle-public`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedStory = await response.json();
                setIsPublic(updatedStory.is_public);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyShareLink = () => {
        const url = `${window.location.origin}/story/public/${story.id}`;
        navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
            <div className="mb-4 sm:mb-0">
                {/* In a real app, you'd have a page to view the story details */}
                <p className="font-semibold text-violet-700">{story.title}</p>
                <p className="text-sm text-gray-500">Created: {new Date(story.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {isPublic ? "Public" : "Private"}
                </span>
                <button onClick={togglePublic} disabled={isLoading} className="px-3 py-1 text-xs sm:text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                    {isLoading ? "..." : "Toggle"}
                </button>
                {isPublic && (
                    <button onClick={copyShareLink} className="px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                        Share
                    </button>
                )}
            </div>
        </div>
    );
};


export default function Dashboard() {
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use the auth context to get user info and protect the page
    const { token, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // This is the route protection logic
        if (!authLoading && !token) {
            router.push('/login');
            return;
        }

        if (token) {
            const fetchStories = async () => {
                try {
                    const response = await fetch('http://localhost:8000/stories/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.status === 401) {
                        logout(); // Token is invalid, log the user out
                        return;
                    }
                    if (!response.ok) throw new Error('Failed to fetch stories');
                    const data = await response.json();
                    setStories(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchStories();
        }
    }, [token, authLoading, router, logout]);

    if (authLoading || isLoading) {
        return <div className="text-center p-10">Loading Your Dashboard...</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Your Dashboard</h1>
                    <div>
                        <Link href="/" className="px-4 py-2 mr-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">
                            + Add New Story
                        </Link>
                        <button onClick={logout} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm">
                            Logout
                        </button>
                    </div>
                </div>
                {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
                <div className="space-y-4">
                    {stories.length > 0 ? (
                        stories.map(story => <StoryRow key={story.id} story={story} token={token} />)
                    ) : (
                        !error && <p className="text-center text-gray-500 p-8 bg-white rounded-lg">You have not preserved any stories yet.</p>
                    )}
                </div>
            </div>
        </main>
    );
}