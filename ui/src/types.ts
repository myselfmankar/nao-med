export interface Session {
    id: string;
    created_at: string;
    doctor_lang: string;
    patient_lang: string;
}

export interface Message {
    id: number;
    session_id: string;
    role: 'doctor' | 'patient';
    original_text: string;
    translated_text?: string;
    audio_url?: string;
    timestamp: string;
}

export interface SummaryResponse {
    summary: string;
}
