import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Settings, FileText } from 'lucide-react';
import type { Session } from '../types';

interface ChatHeaderProps {
    role: 'doctor' | 'patient';
    isOnline: boolean;
    session: Session | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onOpenSettings: () => void;
    onOpenSummary: () => void;
}

export default function ChatHeader({
    role,
    isOnline,
    session,
    searchQuery,
    setSearchQuery,
    onOpenSettings,
    onOpenSummary
}: ChatHeaderProps) {
    const roleLabel = role === 'doctor' ? 'Doctor' : 'Patient';
    const roleColor = role === 'doctor' ? 'bg-blue-600' : 'bg-green-600';

    return (
        <div className={`${roleColor} text-white p-4 shadow-md flex items-center justify-between z-10`}>
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
                <Link to="/" className="hover:bg-white/20 p-2 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="font-bold text-lg">{roleLabel}</h1>
                    <div className="flex items-center gap-2 text-xs opacity-90">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
                        {session && (
                            <span className="opacity-75">• Session: {session.id.slice(0, 8)}...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                    <Search size={16} className="text-white" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-white placeholder-white/80 w-32 md:w-48"
                    />
                </div>

                {/* Settings Button */}
                <button
                    onClick={onOpenSettings}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-2 rounded-lg transition-colors"
                    title="Settings"
                >
                    <Settings size={16} />
                </button>

                {/* Summary Button */}
                <button
                    onClick={onOpenSummary}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <FileText size={16} />
                    <span className="hidden md:inline">Summary</span>
                </button>
            </div>
        </div>
    );
}
