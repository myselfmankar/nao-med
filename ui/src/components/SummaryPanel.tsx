import { motion } from 'framer-motion';
import { FileText, X, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

interface SummaryPanelProps {
    show: boolean;
    onClose: () => void;
    summary: string;
    loading: boolean;
}

export default function SummaryPanel({
    show,
    onClose,
    summary,
    loading
}: SummaryPanelProps) {
    const [copied, setCopied] = useState(false);

    if (!show) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

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
                className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText size={28} />
                        <h2 className="text-2xl font-bold">Medical Summary</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Copy Button */}
                        {!loading && summary && (
                            <button
                                onClick={handleCopy}
                                className="hover:bg-white/20 p-2 rounded-lg transition-colors flex items-center gap-2"
                                title="Copy to Clipboard"
                            >
                                {copied ? <Check size={20} className="text-green-300" /> : <Copy size={20} />}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        // Loading State
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="text-gray-500 font-medium">Generating summary...</p>
                        </div>
                    ) : summary ? (
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-5" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold text-blue-700" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-gray-700 leading-relaxed" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />
                                    }}
                                >
                                    {summary}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>No summary available yet.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
