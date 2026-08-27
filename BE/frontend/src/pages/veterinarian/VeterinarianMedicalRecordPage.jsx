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
                const veterinarian = await getMyVeterinarian();
                const appointments =
                    await getAppointmentsByVeterinarian(veterinarian.id);

                const current = appointments.find(
                    item => item.id === appointmentId
                );

                if (!current) {
                    throw new Error('Appointment not found.');
                }

                if (current.status !== 'CONFIRMED') {
                    throw new Error(
                        'Only confirmed appointments can be completed.'
                    );
                }

                setAppointment(current);

            } catch (err) {
                setError(
                    err.response?.data?.message ||
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
    };


    const handleSubmit = async e => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);

            await createMedicalRecord({
                appointmentId,
                symptoms: form.symptoms,
                diagnosis: form.diagnosis,
                observations: form.observations || null,
                weight: form.weight ? Number(form.weight) : null,
                temperature: form.temperature
                    ? Number(form.temperature)
                    : null
            });

            navigate(
                '/veterinarian/appointments',
                { replace: true }
            );

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


    if (loading) {
        return (
            <>
                <Navbar />
                <div className="medical-form-loading">
                    Loading consultation...
                </div>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="medical-form-page">

                <div className="medical-form-container">

                    <Link
                        to="/veterinarian/appointments"
                        className="medical-form-back"
                    >
                        ← Back to appointments
                    </Link>

                    {appointment && (
                        <section className="medical-form-header">

                            <p>CONSULTATION</p>

                            <h1>
                                Complete visit
                            </h1>

                            <span>
                                {appointment.petName}
                                {' • '}
                                {appointment.species}

                                {appointment.race
                                    ? ` • ${appointment.race}`
                                    : ''
                                }
                            </span>

                            <Link
                                to={`/veterinarian/pets/${appointment.petId}/medical-history/${appointment.id}`}
                                className="medical-form-history"
                            >
                                View medical history
                            </Link>

                        </section>
                    )}

                    {error && (
                        <div className="medical-form-error">
                            {error}
                        </div>
                    )}

                    {appointment && (
                        <form
                            className="medical-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="medical-field">
                                <label>Symptoms</label>

                                <textarea
                                    name="symptoms"
                                    value={form.symptoms}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="medical-field">
                                <label>Diagnosis</label>

                                <textarea
                                    name="diagnosis"
                                    value={form.diagnosis}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="medical-field">
                                <label>Observations</label>

                                <textarea
                                    name="observations"
                                    value={form.observations}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="medical-form-row">

                                <div className="medical-field">
                                    <label>Weight (kg)</label>

                                    <input
                                        type="number"
                                        name="weight"
                                        step="0.01"
                                        min="0"
                                        value={form.weight}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="medical-field">
                                    <label>Temperature (°C)</label>

                                    <input
                                        type="number"
                                        name="temperature"
                                        step="0.1"
                                        min="0"
                                        value={form.temperature}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>

                            <button
                                type="submit"
                                className="medical-save-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : 'Save medical record & finish visit'
                                }
                            </button>

                        </form>
                    )}

                </div>

            </main>
        </>
    );
}