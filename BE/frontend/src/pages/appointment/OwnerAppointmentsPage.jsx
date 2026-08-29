import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { getMyPets } from '../../features/pet/services/petService';
import {
    getAppointmentsByOwner,
    cancelAppointment
} from '../../features/appointment/services/appointmentService';
import {
    getVeterinarianById,
    getServiceById,
    getClinicById
} from '../../features/clinic/services/clinicService';

import './OwnerAppointmentsPage.css';

export default function OwnerAppointmentsPage() {
    const { user } = useAuth();

    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [cancelingId, setCancelingId] = useState(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?.userId) return;

        const loadAppointments = async () => {
            setLoading(true);
            setError(null);

            try {
                const [appointmentData, pets] = await Promise.all([
                    getAppointmentsByOwner(user.userId),
                    getMyPets()
                ]);

                const petMap = new Map(pets.map(pet => [pet.id, pet]));

                const detailed = await Promise.all(
                    appointmentData.map(async appointment => {
                        let veterinarian = null;
                        let service = null;
                        let clinic = null;

                        try {
                            veterinarian = await getVeterinarianById(appointment.veterinarianId);
                        } catch { }

                        try {
                            if (appointment.vetServiceId) {
                                service = await getServiceById(appointment.vetServiceId);
                            }
                        } catch { }

                        try {
                            if (veterinarian?.clinicId) {
                                clinic = await getClinicById(veterinarian.clinicId);
                            }
                        } catch { }

                        return {
                            ...appointment,
                            pet: petMap.get(appointment.petId) || null,
                            veterinarian,
                            service,
                            clinic
                        };
                    })
                );

                setAppointments(detailed);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load appointments.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadAppointments();
    }, [user?.userId]);

    const upcomingAppointments = useMemo(() =>
        appointments
            .filter(a => ['PENDING', 'CONFIRMED'].includes(a.status))
            .sort((a, b) => new Date(a.startOfAppointment) - new Date(b.startOfAppointment)),
        [appointments]
    );

    const historyAppointments = useMemo(() =>
        appointments
            .filter(a => ['FINISHED', 'CANCELED', 'NO_SHOW'].includes(a.status))
            .sort((a, b) => new Date(b.startOfAppointment) - new Date(a.startOfAppointment)),
        [appointments]
    );

    const displayedAppointments =
        activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

    const confirmCancel = async () => {
        if (!appointmentToCancel) return;

        try {
            setCancelingId(appointmentToCancel.id);
            setError(null);

            await cancelAppointment(appointmentToCancel.id);

            setAppointments(current =>
                current.map(item =>
                    item.id === appointmentToCancel.id
                        ? { ...item, status: 'CANCELED' }
                        : item
                )
            );

            setAppointmentToCancel(null);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not cancel appointment.'
            );
        } finally {
            setCancelingId(null);
        }
    };

    const formatDate = value =>
        new Date(value).toLocaleDateString('en-GB');

    const formatTime = value =>
        new Date(value).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });

    const getStatusLabel = status => {
        if (status === 'NO_SHOW') return 'No show';
        if (status === 'FINISHED') return 'Finished';
        if (status === 'CANCELED') return 'Canceled';
        if (status === 'CONFIRMED') return 'Confirmed';
        if (status === 'PENDING') return 'Pending';
        return status;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="appointments-page">
                    <div className="appointments-loading">
                        <div className="appointments-spinner" />
                        <p>Loading appointments...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="appointments-page">
                <div className="appointments-container">

                    <header className="appointments-header">
                        <div>
                            <span>APPOINTMENTS</span>
                            <h1>My appointments</h1>
                            <p>Manage your upcoming veterinary visits and view previous appointments.</p>
                        </div>

                        <Link to="/clinics" className="primary-button">
                            Book appointment
                        </Link>
                    </header>

                    {error && (
                        <div className="appointments-error">
                            {error}
                        </div>
                    )}

                    <div className="appointments-tabs">
                        <button
                            type="button"
                            className={activeTab === 'upcoming' ? 'active' : ''}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            Upcoming
                            <span>{upcomingAppointments.length}</span>
                        </button>

                        <button
                            type="button"
                            className={activeTab === 'history' ? 'active' : ''}
                            onClick={() => setActiveTab('history')}
                        >
                            History
                            <span>{historyAppointments.length}</span>
                        </button>
                    </div>

                    {displayedAppointments.length === 0 ? (
                        <div className="appointments-empty">
                            <div className="appointments-empty-icon">
                                {activeTab === 'upcoming' ? '+' : '✓'}
                            </div>

                            <h2>
                                {activeTab === 'upcoming'
                                    ? 'No upcoming appointments'
                                    : 'No appointment history'}
                            </h2>

                            <p>
                                {activeTab === 'upcoming'
                                    ? 'You currently have no scheduled veterinary visits.'
                                    : 'Completed and canceled appointments will appear here.'}
                            </p>

                            {activeTab === 'upcoming' && (
                                <Link to="/clinics" className="primary-button">
                                    Find a clinic
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="appointments-list">
                            {displayedAppointments.map(appointment => {
                                const canCancel =
                                    ['PENDING', 'CONFIRMED'].includes(appointment.status) &&
                                    new Date(appointment.startOfAppointment) > new Date();

                                return (
                                    <article className="appointment-card" key={appointment.id}>

                                        <div className="appointment-card-date">
                                            <strong>
                                                {String(new Date(appointment.startOfAppointment).getDate()).padStart(2, '0')}
                                            </strong>

                                            <span>
                                                {new Date(appointment.startOfAppointment)
                                                    .toLocaleString('en-GB', { month: 'short' })
                                                    .toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="appointment-card-content">

                                            <div className="appointment-card-header">
                                                <div>
                                                    <h2>
                                                        {appointment.pet?.name || 'Pet'}
                                                    </h2>

                                                    <p>
                                                        {appointment.clinic?.name ||
                                                            appointment.clinic?.denumire ||
                                                            'Veterinary clinic'}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`appointment-status ${appointment.status?.toLowerCase()}`}
                                                >
                                                    {getStatusLabel(appointment.status)}
                                                </span>
                                            </div>

                                            <div className="appointment-information">
                                                <div>
                                                    <span>Date</span>
                                                    <strong>
                                                        {formatDate(appointment.startOfAppointment)}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Time</span>
                                                    <strong>
                                                        {formatTime(appointment.startOfAppointment)}
                                                        {appointment.endOfAppointment &&
                                                            ` – ${formatTime(appointment.endOfAppointment)}`}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Veterinarian</span>
                                                    <strong>
                                                        {appointment.veterinarian?.name
                                                            ? `Dr. ${appointment.veterinarian.name}`
                                                            : 'Veterinarian'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Service</span>
                                                    <strong>
                                                        {appointment.service?.serviceName ||
                                                            'Veterinary appointment'}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="appointment-card-actions">
                                                {appointment.veterinarian?.clinicId && (
                                                    <Link
                                                        to={`/clinics/${appointment.veterinarian.clinicId}`}
                                                        className="appointment-secondary-action"
                                                    >
                                                        View clinic
                                                    </Link>
                                                )}

                                                {appointment.status === 'FINISHED' && appointment.pet?.id && (
                                                    <Link
                                                        to={`/pets/${appointment.pet.id}/medical-history`}
                                                        className="appointment-secondary-action"
                                                    >
                                                        Medical history
                                                    </Link>
                                                )}

                                                {canCancel && (
                                                    <button
                                                        type="button"
                                                        className="appointment-cancel-action"
                                                        onClick={() => setAppointmentToCancel(appointment)}
                                                    >
                                                        Cancel appointment
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                </div>
            </main>

            {appointmentToCancel && (
                <div
                    className="appointment-modal-backdrop"
                    onMouseDown={() => {
                        if (!cancelingId) setAppointmentToCancel(null);
                    }}
                >
                    <div
                        className="appointment-modal"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <span className="appointment-modal-label">CANCEL APPOINTMENT</span>

                        <h2>Cancel this appointment?</h2>

                        <p>
                            The appointment for{' '}
                            <strong>{appointmentToCancel.pet?.name || 'your pet'}</strong>{' '}
                            on {formatDate(appointmentToCancel.startOfAppointment)} at{' '}
                            {formatTime(appointmentToCancel.startOfAppointment)} will be canceled.
                        </p>

                        <div className="appointment-modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={cancelingId}
                                onClick={() => setAppointmentToCancel(null)}
                            >
                                Keep appointment
                            </button>

                            <button
                                type="button"
                                className="appointment-modal-danger"
                                disabled={cancelingId}
                                onClick={confirmCancel}
                            >
                                {cancelingId ? 'Canceling...' : 'Cancel appointment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}