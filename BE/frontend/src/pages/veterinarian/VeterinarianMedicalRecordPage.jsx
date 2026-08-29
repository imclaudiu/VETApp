import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { getMyVeterinarian } from '../../features/veterinarian/services/veterinarianService';
import { getAppointmentsByVeterinarian } from '../../features/appointment/services/appointmentService';
import { createMedicalRecord } from '../../features/medicalRecord/services/medicalRecordService';

import './VeterinarianMedicalRecordPage.css';

export default function VeterinarianMedicalRecordPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [form, setForm] = useState({
        symptoms: '',
        diagnosis: '',
        observations: '',
        weight: '',
        temperature: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAppointment = async () => {
            try {
                setLoading(true);
                setError(null);

                const veterinarian = await getMyVeterinarian();
                const appointments = await getAppointmentsByVeterinarian(veterinarian.id);

                const current = appointments.find(
                    item => String(item.id) === String(appointmentId)
                );

                if (!current) throw new Error('Appointment not found.');

                if (current.status !== 'CONFIRMED') {
                    throw new Error('Only confirmed appointments can be completed.');
                }

                setAppointment(current);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    err.message ||
                    'Could not load appointment.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadAppointment();
    }, [appointmentId]);

    const handleChange = e => {
        const { name, value } = e.target;

        setForm(current => ({
            ...current,
            [name]: value
        }));

        setError(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();

        if (!form.symptoms.trim()) {
            setError('Please enter the patient symptoms.');
            return;
        }

        if (!form.diagnosis.trim()) {
            setError('Please enter a diagnosis.');
            return;
        }

        if (form.weight && Number(form.weight) <= 0) {
            setError('Weight must be greater than 0.');
            return;
        }

        if (form.temperature && Number(form.temperature) <= 0) {
            setError('Temperature must be greater than 0.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await createMedicalRecord({
                appointmentId,
                symptoms: form.symptoms.trim(),
                diagnosis: form.diagnosis.trim(),
                observations: form.observations.trim() || null,
                weight: form.weight ? Number(form.weight) : null,
                temperature: form.temperature ? Number(form.temperature) : null
            });

            navigate('/veterinarian/appointments', { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'Could not save medical record.'
            );
        } finally {
            setSaving(false);
        }
    };

    const formatDate = value => {
        if (!value) return '—';
        return new Date(value).toLocaleDateString('en-GB');
    };

    const formatTime = value => {
        if (!value) return '—';

        return new Date(value).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSex = sex => {
        if (sex === 'M') return 'Male';
        if (sex === 'F') return 'Female';
        return sex || 'Unknown';
    };

    const visitStarted = appointment
        ? new Date(appointment.startOfAppointment) <= new Date()
        : false;

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="medical-record-page">
                    <div className="medical-record-loading">
                        <div className="medical-record-spinner" />
                        <p>Loading consultation...</p>
                    </div>
                </main>
            </>
        );
    }

    if (!appointment) {
        return (
            <>
                <Navbar />

                <main className="medical-record-page">
                    <div className="medical-record-container">
                        <div className="medical-record-load-error">
                            <h2>Consultation unavailable</h2>
                            <p>{error || 'The appointment could not be loaded.'}</p>

                            <Link
                                to="/veterinarian/appointments"
                                className="primary-button"
                            >
                                Back to appointments
                            </Link>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="medical-record-page">
                <div className="medical-record-container">

                    <Link
                        to="/veterinarian/appointments"
                        className="medical-record-back"
                    >
                        ← Back to appointments
                    </Link>

                    <header className="medical-record-header">
                        <div>
                            <span>CONSULTATION</span>
                            <h1>Complete visit</h1>
                            <p>
                                Record the clinical findings and finish the appointment for{' '}
                                <strong>{appointment.petName}</strong>.
                            </p>
                        </div>
                    </header>

                    {error && (
                        <div className="medical-record-error">
                            {error}
                        </div>
                    )}

                    {!visitStarted && (
                        <div className="medical-record-warning">
                            <strong>This consultation has not started yet.</strong>
                            <p>
                                The medical record can be completed once the scheduled appointment begins.
                            </p>
                        </div>
                    )}

                    <div className="medical-record-layout">

                        <form
                            className="medical-record-form"
                            onSubmit={handleSubmit}
                        >
                            <section className="medical-record-section">
                                <div className="medical-section-heading">
                                    <span>CLINICAL NOTES</span>
                                    <h2>Consultation details</h2>
                                    <p>
                                        Record the symptoms, diagnosis and relevant observations from this visit.
                                    </p>
                                </div>

                                <div className="medical-field">
                                    <label htmlFor="symptoms">
                                        Symptoms <span>*</span>
                                    </label>

                                    <textarea
                                        id="symptoms"
                                        name="symptoms"
                                        value={form.symptoms}
                                        onChange={handleChange}
                                        placeholder="Describe the symptoms reported or observed..."
                                        maxLength={3000}
                                        required
                                    />

                                    <small>
                                        {form.symptoms.length}/3000
                                    </small>
                                </div>

                                <div className="medical-field">
                                    <label htmlFor="diagnosis">
                                        Diagnosis <span>*</span>
                                    </label>

                                    <textarea
                                        id="diagnosis"
                                        name="diagnosis"
                                        value={form.diagnosis}
                                        onChange={handleChange}
                                        placeholder="Enter the clinical diagnosis..."
                                        maxLength={3000}
                                        required
                                    />

                                    <small>
                                        {form.diagnosis.length}/3000
                                    </small>
                                </div>

                                <div className="medical-field">
                                    <label htmlFor="observations">
                                        Observations
                                    </label>

                                    <textarea
                                        id="observations"
                                        name="observations"
                                        value={form.observations}
                                        onChange={handleChange}
                                        placeholder="Treatment recommendations, follow-up notes or other observations..."
                                        maxLength={3000}
                                    />

                                    <small>
                                        {form.observations.length}/3000
                                    </small>
                                </div>
                            </section>

                            <section className="medical-record-section">
                                <div className="medical-section-heading">
                                    <span>VITALS</span>
                                    <h2>Patient measurements</h2>
                                    <p>
                                        Add measurements taken during the consultation, if available.
                                    </p>
                                </div>

                                <div className="medical-vitals-grid">
                                    <div className="medical-field">
                                        <label htmlFor="weight">Weight</label>

                                        <div className="medical-input-unit">
                                            <input
                                                id="weight"
                                                type="number"
                                                name="weight"
                                                step="0.01"
                                                min="0"
                                                value={form.weight}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />

                                            <span>kg</span>
                                        </div>
                                    </div>

                                    <div className="medical-field">
                                        <label htmlFor="temperature">
                                            Temperature
                                        </label>

                                        <div className="medical-input-unit">
                                            <input
                                                id="temperature"
                                                type="number"
                                                name="temperature"
                                                step="0.1"
                                                min="0"
                                                value={form.temperature}
                                                onChange={handleChange}
                                                placeholder="0.0"
                                            />

                                            <span>°C</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="medical-record-actions">
                                <Link
                                    to="/veterinarian/appointments"
                                    className="secondary-button"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving || !visitStarted}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : 'Save record & finish visit'}
                                </button>
                            </div>
                        </form>

                        <aside className="medical-patient-sidebar">

                            <div className="medical-patient-card">
                                <span className="medical-sidebar-label">
                                    PATIENT
                                </span>

                                <div className="medical-patient-profile">
                                    <div className="medical-patient-avatar">
                                        {appointment.petName
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'P'}
                                    </div>

                                    <div>
                                        <h2>
                                            {appointment.petName || 'Patient'}
                                        </h2>

                                        <p>
                                            {appointment.species || 'Unknown species'}
                                            {appointment.race
                                                ? ` · ${appointment.race}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="medical-patient-details">
                                    <div>
                                        <span>Species</span>
                                        <strong>
                                            {appointment.species || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Breed</span>
                                        <strong>
                                            {appointment.race || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Sex</span>
                                        <strong>
                                            {getSex(appointment.sex)}
                                        </strong>
                                    </div>
                                </div>

                                <Link
                                    to={`/veterinarian/pets/${appointment.petId}/medical-history/${appointment.id}`}
                                    className="medical-history-button"
                                >
                                    View medical history
                                </Link>
                            </div>

                            <div className="medical-appointment-card">
                                <span className="medical-sidebar-label">
                                    APPOINTMENT
                                </span>

                                <div className="medical-appointment-service">
                                    <strong>
                                        {appointment.serviceName ||
                                            'Veterinary appointment'}
                                    </strong>

                                    <span className="medical-confirmed-badge">
                                        Confirmed
                                    </span>
                                </div>

                                <div className="medical-appointment-details">
                                    <div>
                                        <span>Date</span>
                                        <strong>
                                            {formatDate(
                                                appointment.startOfAppointment
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Time</span>
                                        <strong>
                                            {formatTime(
                                                appointment.startOfAppointment
                                            )}
                                            {' – '}
                                            {formatTime(
                                                appointment.endOfAppointment
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div className="medical-finish-notice">
                                <strong>Finishing the visit</strong>
                                <p>
                                    Saving this medical record will complete the appointment and make the record available in the patient's medical history.
                                </p>
                            </div>

                        </aside>

                    </div>
                </div>
            </main>
        </>
    );
}