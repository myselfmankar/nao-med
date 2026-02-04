import { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, User } from 'lucide-react';

export default function Landing() {
    const [doctorLang, setDoctorLang] = useState('en');
    const [patientLang, setPatientLang] = useState('es');

    const handleRoleSelect = (role: 'doctor' | 'patient') => {
        // Store language preferences in localStorage
        localStorage.setItem('doctorLang', doctorLang);
        localStorage.setItem('patientLang', patientLang);
        // Open in new tab
        window.open(`/chat?role=${role}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">
                        Healthcare Translator
                    </h1>
                    <p className="text-xl text-gray-600">
                        Breaking language barriers in medical care
                    </p>
                </div>

                {/* Language Configuration */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Configure Languages</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Doctor's Language
                            </label>
                            <select
                                value={doctorLang}
                                onChange={(e) => setDoctorLang(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="hi">Hindi</option>
                                <option value="fr">French</option>
                                <option value="zh">Chinese</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Patient's Language
                            </label>
                            <select
                                value={patientLang}
                                onChange={(e) => setPatientLang(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="es">Spanish</option>
                                <option value="hi">Hindi</option>
                                <option value="en">English</option>
                                <option value="fr">French</option>
                                <option value="zh">Chinese</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Role Selection Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Doctor Card */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRoleSelect('doctor')}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-blue-100 hover:border-blue-300 group"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Stethoscope className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                                I am a Doctor
                            </h2>
                            <p className="text-gray-600 text-center">
                                Communicate with patients in their language
                            </p>
                        </div>
                    </motion.button>

                    {/* Patient Card */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRoleSelect('patient')}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-green-100 hover:border-green-300 group"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <User className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                                I am a Patient
                            </h2>
                            <p className="text-gray-600 text-center">
                                Speak to your doctor in your native language
                            </p>
                        </div>
                    </motion.button>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center text-sm text-gray-500">
                    <p>Powered by AI Translation • Secure • HIPAA Compliant</p>
                </div>
            </motion.div>
        </div>
    );
}
