import { motion } from 'framer-motion';
import type { Message } from '../types';
import type { RefObject } from 'react';

interface MessageListProps {
    messages: Message[];
    role: 'doctor' | 'patient';
    messagesEndRef: RefObject<HTMLDivElement | null>;
    showOriginal: Record<number, boolean>;
    toggleOriginal: (id: number) => void;
}

export default function MessageList({
    messages,
    role,
    messagesEndRef,
    showOriginal,
    toggleOriginal
}: MessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.role === role;
                    const displayText = isMe ? msg.original_text : (msg.translated_text || "Translating...");
                    const originalText = isMe ? msg.translated_text : msg.original_text;
                    const showOrig = showOriginal[msg.id];

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex flex-col max-w-[80%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-gray-400 mb-1 ml-1 capitalize font-medium">
                                    {isMe ? 'You' : (msg.role === 'doctor' ? 'Dr. Smith' : 'Patient')}
                                </span>

                                <div className={`rounded-2xl px-4 py-3 shadow-md ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                                    {msg.audio_url && (
                                        <audio controls src={msg.audio_url} className="mb-2 w-full" />
                                    )}

                                    <p className="whitespace-pre-wrap">{displayText}</p>

                                    {originalText && (
                                        <button
                                            onClick={() => toggleOriginal(msg.id)}
                                            className={`text-xs mt-2 underline opacity-70 hover:opacity-100 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}
                                        >
                                            {showOrig ? 'Hide' : 'Show'} original
                                        </button>
                                    )}

                                    {showOrig && originalText && (
                                        <p className={`text-xs mt-1 italic opacity-80 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                            Original: {originalText}
                                        </p>
                                    )}

                                    <p className={`text-xs mt-1 opacity-60 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
