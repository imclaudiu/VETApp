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
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?.userId) return;

        const loadAppointments = async () => {
            try {
                setLoading(true);
                setError(null);

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

    const upcomingAppointments = useMemo(() => {
        return appointments
            .filter(a => ['PENDING', 'CONFIRMED'].includes(a.status))
            .sort((a, b) => new Date(a.startOfAppointment) - new Date(b.startOfAppointment));
    }, [appointments]);

    const historyAppointments = useMemo(() => {
        return appointments
            .filter(a => ['FINISHED', 'CANCELED', 'NO_SHOW'].includes(a.status))
            .sort((a, b) => new Date(b.startOfAppointment) - new Date(a.startOfAppointment));
    }, [appointments]);

    const displayedAppointments =
        activeTab === 'upcoming' ? upcomingAppointments : historyAppointments;

    const handleCancel = async appointment => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            setCancelingId(appointment.id);
            setError(null);

            await cancelAppointment(appointment.id);

            setAppointments(current =>
                current.map(item =>
                    item.id === appointment.id
                        ? { ...item, status: 'CANCELED' }
                        : item
                )
            );
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
        new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(value));

    const formatTime = value =>
        new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(value));

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="owner-appointments-loading">
                    Loading appointments...
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="owner-appointments-page">
                <div className="owner-appointments-container">

                    <section className="owner-appointments-header">
                        <div>
                            <p>APPOINTMENTS</p>
                            <h1>My appointments</h1>
                            <span>
                                View your upcoming visits and appointment history.
                            </span>
                        </div>

                        <Link to="/clinics" className="owner-new-appointment">
                            + Book appointment
                        </Link>
                    </section>

                    {error && (
                        <div className="owner-appointments-error">
                            {error}
                        </div>
                    )}

                    <div className="owner-appointments-summary">
                        <div>
                            <span>UPCOMING</span>
                            <strong>{upcomingAppointments.length}</strong>
                            <p>Active appointments</p>
                        </div>

                        <div>
                            <span>HISTORY</span>
                            <strong>{historyAppointments.length}</strong>
                            <p>Previous appointments</p>
                        </div>
                    </div>

                    <div className="owner-appointments-tabs">
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
                        <div className="owner-appointments-empty">
                            <div>+</div>
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
                        </div>
                    ) : (
                        <div className="owner-appointments-list">
                            {displayedAppointments.map(appointment => {
                                const canCancel =
                                    ['PENDING', 'CONFIRMED'].includes(appointment.status) &&
                                    new Date(appointment.startOfAppointment) > new Date();

                                return (
                                    <article
                                        key={appointment.id}
                                        className="owner-appointment-card"
                                    >
                                        <div className="owner-appointment-date">
                                            <strong>
                                                {new Date(appointment.startOfAppointment).getDate()}
                                            </strong>
                                            <span>
                                                {new Date(appointment.startOfAppointment)
                                                    .toLocaleString('en-GB', { month: 'short' })
                                                    .toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="owner-appointment-content">
                                            <div className="owner-appointment-heading">
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
                                                    className={`owner-appointment-status ${appointment.status?.toLowerCase()}`}
                                                >
                                                    {appointment.status}
                                                </span>
                                            </div>

                                            <div className="owner-appointment-details">
                                                <div>
                                                    <span>DATE</span>
                                                    <strong>
                                                        {formatDate(appointment.startOfAppointment)}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>TIME</span>
                                                    <strong>
                                                        {formatTime(appointment.startOfAppointment)}
                                                        {' — '}
                                                        {formatTime(appointment.endOfAppointment)}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>VETERINARIAN</span>
                                                    <strong>
                                                        Dr. {appointment.veterinarian?.name || 'Veterinarian'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>SERVICE</span>
                                                    <strong>
                                                        {appointment.service?.serviceName ||
                                                            'Veterinary appointment'}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="owner-appointment-actions">
                                                {appointment.veterinarian?.clinicId && (
                                                    <Link
                                                        to={`/clinics/${appointment.veterinarian.clinicId}`}
                                                        className="owner-view-clinic"
                                                    >
                                                        View clinic
                                                    </Link>
                                                )}

                                                {canCancel && (
                                                    <button
                                                        type="button"
                                                        className="owner-cancel-appointment"
                                                        disabled={cancelingId === appointment.id}
                                                        onClick={() => handleCancel(appointment)}
                                                    >
                                                        {cancelingId === appointment.id
                                                            ? 'Canceling...'
                                                            : 'Cancel appointment'}
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
        </>
    );
}