// frontend/app/page.js
'use client'; // The most important line for a component with hooks!

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import StoryResult from '../components/StoryResult';
import AudioRecorder from '../components/AudioRecorder';

// --- Reusable Components ---

const Header = () => {
    const { isAuthenticated, logout } = useAuth();
    return (
        <header className="absolute top-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm border-b z-10 flex justify-between items-center">
            <Link href="/" className="text-lg font-bold text-gray-800">Memoria</Link>
            <nav>
                {isAuthenticated ? (
                    <>
                        <Link href="/dashboard" className="mr-4 text-gray-600 hover:text-gray-900">Dashboard</Link>
                        <button onClick={logout} className="text-gray-600 hover:text-gray-900">Logout</button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="mr-4 text-gray-600 hover:text-gray-900">Login</Link>
                        <Link href="/register" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

const ProcessingState = () => (
    <div className="text-center space-y-4">
        <p className="text-lg font-semibold text-gray-700">Deconstructing Story...</p>
        <p className="text-gray-500">Our AI anthropologist is analyzing the narrative, values, and personality. This may take a moment.</p>
        <div className="flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
    </div>
);


export default function Home() {
    const [file, setFile] = useState(null);
    const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
    const [appState, setAppState] = useState('IDLE');
    const [storyData, setStoryData] = useState(null);
    const [storyId, setStoryId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const { token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const handleRecordingComplete = (blob) => {
        setRecordedAudioBlob(blob);
        setFile(null);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setRecordedAudioBlob(null);
    };

    const resetApp = () => {
        setFile(null);
        setRecordedAudioBlob(null);
        setAppState('IDLE');
        setStoryData(null);
        setErrorMessage('');
        setStoryId(null);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!recordedAudioBlob && !file) {
            setErrorMessage('Please record a story or select a file.');
            setAppState('ERROR');
            return;
        }
        
        setAppState('UPLOADING');
        setErrorMessage('');
        const formData = new FormData();
        if (recordedAudioBlob) {
            formData.append('file', recordedAudioBlob, 'recording.webm');
        } else {
            formData.append('file', file);
        }

        let currentStoryId = null;
        try {
            const uploadResponse = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (uploadResponse.status === 401) throw new Error('Authentication failed. Please log in again.');
            if (!uploadResponse.ok) throw new Error('File upload failed.');
            
            const uploadData = await uploadResponse.json();
            currentStoryId = uploadData.story_id;
            setStoryId(currentStoryId);

            setAppState('PROCESSING');
            const processResponse = await fetch(`http://localhost:8000/process/${currentStoryId}`, { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (processResponse.status === 401) throw new Error('Authentication failed. Please log in again.');
            if (!processResponse.ok) throw new Error('AI processing failed.');
            
            const processData = await processResponse.json();
            setStoryData(processData.data);
            setAppState('SUCCESS');

        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || 'An unknown error occurred.');
            setAppState('ERROR');
        }
    };
    
    const getButtonText = () => {
        if (appState === 'UPLOADING') return 'Uploading...';
        if (appState === 'PROCESSING') return 'Processing...';
        return 'Upload & Preserve';
    }

    if (authLoading) {
        return <div className="flex min-h-screen items-center justify-center">Loading Memoria...</div>
    }

    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-24 md:pt-24 bg-gray-50">
                
                {appState === 'SUCCESS' ? (
                    <StoryResult storyData={storyData} onReset={resetApp} storyId={storyId} />
                ) : (
                    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-800">Preserve a Legacy</h1>
                            <p className="text-gray-500 mt-2">
                                {isAuthenticated ? "Record a new story or upload a file." : "Please login or register to begin."}
                            </p>
                        </div>
                        {appState === 'PROCESSING' ? ( <ProcessingState /> ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Record a New Story</label>
                                    <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                                </div>

                                <div className="text-center text-sm text-gray-500">OR</div>

                                <div>
                                    <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700">
                                        Upload an Existing File
                                    </label>
                                    <input
                                        id="audioFile" type="file" accept="audio/*" onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={appState === 'UPLOADING' || appState === 'PROCESSING' || (!file && !recordedAudioBlob)}
                                    className="w-full px-4 py-2 text-white bg-violet-600 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-gray-400"
                                >
                                    {isAuthenticated ? getButtonText() : 'Login to Preserve'}
                                </button>
                            </form>
                        )}
                        {errorMessage && <p className="mt-4 text-center text-red-500">{errorMessage}</p>}
                    </div>
                )}
            </main>
        </>
    );
}