import { motion } from 'framer-motion';
import { Settings, X, Trash2 } from 'lucide-react';
import type { Session } from '../types';

interface SettingsPanelProps {
    show: boolean;
    onClose: () => void;
    apiKey: string;
    setApiKey: (key: string) => void;
    openAiKey: string;
    setOpenAiKey: (key: string) => void;
    session: Session | null;
    isOnline: boolean;
    role: string;
    onClearChat: () => void;
}

export default function SettingsPanel({
    show,
    onClose,
    apiKey,
    setApiKey,
    openAiKey,
    setOpenAiKey,
    session,
    isOnline,
    role,
    onClearChat
}: SettingsPanelProps) {
    if (!show) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="bg-gray-800 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings size={24} />
                        <h2 className="text-xl font-bold">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">

                    {/* API Key Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">API Configuration</h3>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                }}
                                placeholder="Enter your API key..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500">
                                Your key is stored locally in your browser. Leave empty to use server default.
                            </p>
                        </div>
                        <div className="space-y-3 mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                OpenAI API Key (for Audio)
                            </label>
                            <input
                                type="password"
                                value={openAiKey}
                                onChange={(e) => {
                                    setOpenAiKey(e.target.value);
                                }}
                                placeholder="Enter your OpenAI API key..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500">
                                Required for audio transcription. Stored locally.
                            </p>
                        </div>
                    </div>

                    {/* Session Management */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Session Management</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    onClearChat();
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-3 rounded-xl transition-colors font-medium border border-red-100"
                            >
                                <Trash2 size={18} />
                                Clear Current Chat
                            </button>
                        </div>
                    </div>

                    {/* Connection Info */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Connection Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Status</span>
                                <span className={isOnline ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                    {isOnline ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Session ID</span>
                                <span className="font-mono text-gray-700 truncate max-w-[150px]">{session?.id}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Doctor Lang</span>
                                <span className="capitalize text-gray-700">{session?.doctor_lang}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Patient Lang</span>
                                <span className="capitalize text-gray-700">{session?.patient_lang}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Role</span>
                                <span className="capitalize text-gray-700">{role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
