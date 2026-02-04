import { Send, Mic } from 'lucide-react';

interface ChatInputProps {
    inputText: string;
    setInputText: (text: string) => void;
    onSend: () => void;
    isSending: boolean;
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
}

export default function ChatInput({
    inputText,
    setInputText,
    onSend,
    isSending,
    isRecording,
    onStartRecording,
    onStopRecording
}: ChatInputProps) {
    return (
        <div className="bg-white border-t p-4 shadow-lg shrink-0 z-20">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
                <button
                    onMouseDown={onStartRecording}
                    onMouseUp={onStopRecording}
                    // For touch devices support
                    onTouchStart={(e) => { e.preventDefault(); onStartRecording(); }}
                    onTouchEnd={(e) => { e.preventDefault(); onStopRecording(); }}
                    className={`p-3 rounded-full transition-all ${isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Mic size={20} />
                </button>

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                />

                <button
                    onClick={onSend}
                    disabled={!inputText.trim() || isSending}
                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {isSending ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span className="text-xs hidden md:inline">Sending...</span>
                        </>
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>
        </div>
    );
}
