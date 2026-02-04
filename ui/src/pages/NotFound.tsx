import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md w-full"
            >
                {/* Custom SVG Illustration */}
                <div className="w-64 h-64 mx-auto mb-8 relative">
                    <motion.svg
                        viewBox="0 0 200 200"
                        className="w-full h-full text-blue-500"
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Floating Ghost/Page Graphic */}
                        <motion.path
                            d="M40 60 C40 30, 160 30, 160 60 L160 160 Q100 180 40 160 Z"
                            fill="currentColor"
                            className="text-blue-100"
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        {/* Face */}
                        <motion.g
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <circle cx="80" cy="90" r="8" className="text-blue-300" fill="currentColor" />
                            <circle cx="120" cy="90" r="8" className="text-blue-300" fill="currentColor" />
                            <path d="M85 120 Q100 110 115 120" stroke="currentColor" strokeWidth="4" fill="none" className="text-blue-300" />
                        </motion.g>

                        {/* 404 Text */}
                        <motion.text
                            x="100"
                            y="190"
                            textAnchor="middle"
                            className="text-4xl font-bold fill-blue-600 opacity-20"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.2 }}
                            transition={{ delay: 0.5 }}
                        >
                            404
                        </motion.text>
                    </motion.svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-gray-600 mb-8">
                    Oops! The page you are looking for has vanished into thin air.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link
                        to="/"
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200"
                    >
                        <Home size={18} />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
