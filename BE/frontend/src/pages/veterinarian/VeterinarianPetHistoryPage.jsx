import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import { getMyVeterinarian } from '../../features/veterinarian/services/veterinarianService';
import { getAppointmentsByVeterinarian } from '../../features/appointment/services/appointmentService';
import { getMedicalRecordsForVeterinarian } from '../../features/medicalRecord/services/medicalRecordService';

import {
    getClinicById,
    getVeterinarianById,
    getServiceById
} from '../../features/clinic/services/clinicService';

import './VeterinarianPetHistoryPage.css';

export default function VeterinarianPetHistoryPage() {
    const { petId, appointmentId } = useParams();

    const [appointment, setAppointment] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const veterinarian = await getMyVeterinarian();

                const appointments = await getAppointmentsByVeterinarian(
                    veterinarian.id
                );

                const currentAppointment = appointments.find(
                    item =>
                        String(item.id) === String(appointmentId) &&
                        String(item.petId) === String(petId)
                );

                if (!currentAppointment) {
                    throw new Error('Appointment not found.');
                }

                const history = await getMedicalRecordsForVeterinarian(
                    petId,
                    appointmentId
                );

                const detailed = await Promise.all(
                    (Array.isArray(history) ? history : []).map(async record => {
                        const [clinic, vet, service] = await Promise.all([
                            record.clinicId
                                ? getClinicById(record.clinicId).catch(() => null)
                                : null,

                            record.veterinarianId
                                ? getVeterinarianById(record.veterinarianId).catch(() => null)
                                : null,

                            record.vetServiceId
                                ? getServiceById(record.vetServiceId).catch(() => null)
                                : null
                        ]);

                        return {
                            ...record,
                            clinic,
                            vet,
                            service
                        };
                    })
                );

                detailed.sort(
                    (a, b) =>
                        new Date(b.consultationDate) -
                        new Date(a.consultationDate)
                );

                setAppointment(currentAppointment);
                setRecords(detailed);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    err.message ||
                    'Could not load medical history.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [petId, appointmentId]);

    const latestRecord = useMemo(
        () => records.length > 0 ? records[0] : null,
        [records]
    );

    const formatDate = value => {
        if (!value) return '—';

        return new Date(value).toLocaleDateString('en-GB');
    };

    const formatTime = value => {
        if (!value) return '';

        return new Date(value).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSex = sex => {
        if (!sex) return '—';

        const normalized = sex.toUpperCase();

        if (normalized === 'M' || normalized === 'MALE') return 'Male';
        if (normalized === 'F' || normalized === 'FEMALE') return 'Female';

        return sex;
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="vet-history-page">
                    <div className="vet-history-loading">
                        <div className="vet-history-spinner" />
                        <p>Loading medical history...</p>
                    </div>
                </main>
            </>
        );
    }

    if (!appointment) {
        return (
            <>
                <Navbar />

                <main className="vet-history-page">
                    <div className="vet-history-container">
                        <div className="vet-history-load-error">
                            <h2>Medical history unavailable</h2>

                            <p>
                                {error || 'The patient could not be loaded.'}
                            </p>

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

            <main className="vet-history-page">
                <div className="vet-history-container">

                    <Link
                        to="/veterinarian/appointments"
                        className="vet-history-back"
                    >
                        ← Back to appointments
                    </Link>

                    <header className="vet-history-header">
                        <div>
                            <span>PATIENT RECORD</span>
                            <h1>Medical history</h1>

                            <p>
                                Review previous consultations and clinical information for this patient.
                            </p>
                        </div>
                    </header>

                    {error && (
                        <div className="vet-history-error">
                            {error}
                        </div>
                    )}

                    <section className="vet-history-patient-card">
                        <div className="vet-history-patient-main">
                            <div className="vet-history-patient-avatar">
                                {appointment.petName
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'P'}
                            </div>

                            <div>
                                <span>PATIENT</span>

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

                        <div className="vet-history-patient-details">
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

                            <div>
                                <span>Medical records</span>
                                <strong>{records.length}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="vet-history-summary">
                        <div>
                            <span>LAST CONSULTATION</span>

                            <strong className="vet-history-summary-text">
                                {latestRecord
                                    ? formatDate(latestRecord.consultationDate)
                                    : 'No previous visits'}
                            </strong>

                            <p>
                                {latestRecord?.service?.serviceName ||
                                    latestRecord?.diagnosis ||
                                    'No medical record available'}
                            </p>
                        </div>

                        <div>
                            <span>LAST RECORDED WEIGHT</span>

                            <strong>
                                {latestRecord?.weight != null
                                    ? `${latestRecord.weight} kg`
                                    : '—'}
                            </strong>

                            <p>
                                Most recent measurement
                            </p>
                        </div>

                        <div>
                            <span>LAST TEMPERATURE</span>

                            <strong>
                                {latestRecord?.temperature != null
                                    ? `${latestRecord.temperature} °C`
                                    : '—'}
                            </strong>

                            <p>
                                Most recent measurement
                            </p>
                        </div>
                    </section>

                    <section className="vet-history-content">
                        <div className="vet-history-section-heading">
                            <div>
                                <span>CLINICAL HISTORY</span>
                                <h2>Previous consultations</h2>
                            </div>

                            <p>
                                {records.length}{' '}
                                {records.length === 1
                                    ? 'record'
                                    : 'records'}
                            </p>
                        </div>

                        {records.length === 0 ? (
                            <div className="vet-history-empty">
                                <div>+</div>

                                <h3>No previous medical records</h3>

                                <p>
                                    This patient does not have any completed consultations recorded yet.
                                </p>
                            </div>
                        ) : (
                            <div className="vet-history-timeline">

                                {records.map((record, index) => (
                                    <article
                                        className="vet-history-timeline-item"
                                        key={record.id}
                                    >
                                        <div className="vet-history-timeline-line">
                                            <span
                                                className={
                                                    index === 0
                                                        ? 'latest'
                                                        : ''
                                                }
                                            />
                                        </div>

                                        <div className="vet-history-record">
                                            <div className="vet-history-record-header">
                                                <div>
                                                    <span className="vet-history-date">
                                                        {formatDate(
                                                            record.consultationDate
                                                        )}

                                                        {record.consultationDate && (
                                                            <>
                                                                {' · '}
                                                                {formatTime(
                                                                    record.consultationDate
                                                                )}
                                                            </>
                                                        )}
                                                    </span>

                                                    <h3>
                                                        {record.diagnosis ||
                                                            'Veterinary consultation'}
                                                    </h3>

                                                    <p>
                                                        {record.service?.serviceName ||
                                                            'Veterinary appointment'}
                                                    </p>
                                                </div>

                                                {index === 0 && (
                                                    <span className="vet-history-latest">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>

                                            <div className="vet-history-record-meta">
                                                <div>
                                                    <span>Veterinarian</span>

                                                    <strong>
                                                        {record.vet?.name
                                                            ? `Dr. ${record.vet.name}`
                                                            : '—'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Clinic</span>

                                                    <strong>
                                                        {record.clinic?.name ||
                                                            '—'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Weight</span>

                                                    <strong>
                                                        {record.weight != null
                                                            ? `${record.weight} kg`
                                                            : '—'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Temperature</span>

                                                    <strong>
                                                        {record.temperature != null
                                                            ? `${record.temperature} °C`
                                                            : '—'}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="vet-history-clinical-grid">
                                                <div className="vet-history-clinical-section">
                                                    <span>SYMPTOMS</span>

                                                    <p>
                                                        {record.symptoms ||
                                                            'No symptoms recorded.'}
                                                    </p>
                                                </div>

                                                <div className="vet-history-clinical-section diagnosis">
                                                    <span>DIAGNOSIS</span>

                                                    <p>
                                                        {record.diagnosis ||
                                                            'No diagnosis recorded.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {record.observations && (
                                                <div className="vet-history-observations">
                                                    <span>OBSERVATIONS</span>

                                                    <p>
                                                        {record.observations}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}

                            </div>
                        )}
                    </section>

                    {appointment.status === 'CONFIRMED' && (
                        <div className="vet-history-current-appointment">
                            <div>
                                <span>CURRENT APPOINTMENT</span>

                                <strong>
                                    {formatDate(
                                        appointment.startOfAppointment
                                    )}{' '}
                                    ·{' '}
                                    {formatTime(
                                        appointment.startOfAppointment
                                    )}
                                </strong>

                                <p>
                                    {appointment.serviceName ||
                                        'Veterinary appointment'}
                                </p>
                            </div>

                            {new Date(appointment.startOfAppointment) <= new Date() && (
                                <Link
                                    to={`/veterinarian/appointments/${appointment.id}/medical-record`}
                                    className="primary-button"
                                >
                                    Complete visit
                                </Link>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </>
    );
}