import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import api, { setSessionId } from '../api';
import type { Session, Message as MsgType } from '../types';

import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import SummaryPanel from '../components/SummaryPanel';
import SettingsPanel from '../components/SettingsPanel';

export default function Chat() {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');

    // Validate Role
    if (roleParam !== 'doctor' && roleParam !== 'patient') {
        return <Navigate to="/not-found" replace />;
    }

    const role = roleParam as 'doctor' | 'patient';

    const [session, setSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<MsgType[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showOriginal, setShowOriginal] = useState<Record<number, boolean>>({});
    const [isSending, setIsSending] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [cachedSummary, setCachedSummary] = useState<{ text: string, timestamp: number } | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [openAiKey, setOpenAiKey] = useState(localStorage.getItem('openai_api_key') || '');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionRef = useRef<Session | null>(null);

    // Keep sessionRef updated
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    // 1. Init Shared Demo Session
    useEffect(() => {
        const initSession = async () => {
            try {
                // Get language preferences from localStorage
                const doctorLang = localStorage.getItem('doctorLang') || 'en';
                const patientLang = localStorage.getItem('patientLang') || 'es';

                // Use shared demo session with language config
                const res = await api.get(`/session/demo?doctor_lang=${doctorLang}&patient_lang=${patientLang}`);
                setSession(res.data);
                setSessionId(res.data.id);

                // Fetch initial messages after session is set
                const messagesRes = await api.get('/messages');
                setMessages(messagesRes.data);
            } catch (e) {
                console.error("Failed to init session", e);
                setIsOnline(false);
            }
        };
        initSession();
    }, []);

    // 2. Fetch Messages (on demand, not polling)
    const fetchMessages = async () => {
        if (!session) return;

        try {
            const url = searchQuery ? `/search?q=${searchQuery}` : '/messages';
            const res = await api.get(url);
            setMessages(res.data);
            setIsOnline(true);
        } catch (e) {
            console.error("Fetch error", e);
            setIsOnline(false);
        }
    };


    // Refetch when search query changes
    useEffect(() => {
        if (session && searchQuery) {
            fetchMessages();
        }
    }, [searchQuery]);

    // WebSocket for real-time updates
    useEffect(() => {
        if (!session) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:8000/api/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsOnline(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_message') {
                    // Add new message to state
                    setMessages(prev => [...prev, {
                        ...data.message,
                        timestamp: new Date(data.message.timestamp)
                    }]);
                } else if (data.type === 'clear_history') {
                    if (data.session_id === sessionRef.current?.id) {
                        setMessages([]);
                    }
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onerror = () => {
            console.error('WebSocket error');
            setIsOnline(false);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsOnline(false);
        };

        return () => {
            ws.close();
        };
    }, [session]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 3. Send Message (with optimistic UI)
    const handleSend = async () => {
        if (!session || !inputText.trim() || isSending) return;

        const tempMessage = inputText;
        setInputText(""); // Clear immediately (optimistic)
        setIsSending(true);

        try {
            await api.post('/chat', { role, content: tempMessage });
            // WebSocket will push the new message automatically
        } catch (e) {
            console.error("Send error", e);
            setInputText(tempMessage); // Restore on error
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    // 4. Audio Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('role', role);
                formData.append('file', blob, 'recording.webm');

                await api.post('/audio', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (e) {
            console.error("Mic error", e);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        // WebSocket will push the new message automatically
    };

    // 5. Summary with caching and lazy loading
    const handleSummary = async () => {
        // Open panel immediately
        setShowSummaryModal(true);

        // Check if we have a recent cached summary (within last 30 seconds)
        const now = Date.now();
        if (cachedSummary && (now - cachedSummary.timestamp) < 30000) {
            setSummaryText(cachedSummary.text);
            return;
        }

        // Show loading state and fetch new summary
        setSummaryLoading(true);
        setSummaryText(''); // Clear old text

        try {
            const res = await api.post('/summary', {});
            const newSummary = res.data.summary;
            setSummaryText(newSummary);
            setCachedSummary({ text: newSummary, timestamp: now });
        } catch (e) {
            setSummaryText('Failed to generate summary. Please try again.');
            console.error('Summary error:', e);
        } finally {
            setSummaryLoading(false);
        }
    };

    // 6. Clear Chat (clears messages in current session)
    const handleClearChat = async () => {
        if (!session) return;
        try {
            // Get language preferences
            const doctorLang = localStorage.getItem('doctorLang') || 'en';
            const patientLang = localStorage.getItem('patientLang') || 'es';

            // Create new session (not demo - unique ID)
            const res = await api.post('/session', {
                doctor_lang: doctorLang,
                patient_lang: patientLang
            });

            setSession(res.data);
            setSessionId(res.data.id);
            setMessages([]);
            setIsOnline(true);
        } catch (e) {
            console.error("Failed to create new session", e);
            alert("Failed to create new session");
        }
    }


    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* 1. Header */}
            <ChatHeader
                role={role}
                isOnline={isOnline}
                session={session}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenSettings={() => setShowSettingsModal(true)}
                onOpenSummary={handleSummary}
            />

            {/* 2. Message List */}
            <MessageList
                messages={messages}
                role={role}
                messagesEndRef={messagesEndRef}
                showOriginal={showOriginal}
                toggleOriginal={(id) => setShowOriginal(prev => ({ ...prev, [id]: !prev[id] }))}
            />

            {/* 3. Input Area */}
            <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                onSend={handleSend}
                isSending={isSending}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
            />

            {/* 4. Side Panels */}
            <SummaryPanel
                show={showSummaryModal}
                onClose={() => setShowSummaryModal(false)}
                summary={summaryText}
                loading={summaryLoading}
            />

            <SettingsPanel
                show={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                apiKey={apiKey}
                setApiKey={(key) => {
                    setApiKey(key);
                    localStorage.setItem('gemini_api_key', key);
                }}
                openAiKey={openAiKey}
                setOpenAiKey={(key) => {
                    setOpenAiKey(key);
                    localStorage.setItem('openai_api_key', key);
                    if (key) {
                        // Optional: Reload logic or API re-init
                    }
                }}
                session={session}
                isOnline={isOnline}
                role={role}
                onClearChat={handleClearChat}
            />
        </div>
    );
}
