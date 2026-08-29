import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import { getMyVeterinarian } from '../../features/veterinarian/services/veterinarianService';
import {
    getAppointmentsByVeterinarian,
    confirmAppointment,
    cancelAppointment,
    markAppointmentNoShow
} from '../../features/appointment/services/appointmentService';

import './VeterinarianAppointmentsPage.css';

export default function VeterinarianAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('today');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [updatingId, setUpdatingId] = useState(null);
    const [updatingAction, setUpdatingAction] = useState(null);

    const [confirmation, setConfirmation] = useState(null);

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                setLoading(true);
                setError(null);

                const veterinarian = await getMyVeterinarian();
                const data = await getAppointmentsByVeterinarian(veterinarian.id);

                setAppointments(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Could not load veterinarian appointments:', err);

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load appointments.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadAppointments();
    }, []);

    const isSameDay = (first, second) =>
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();

    const todayAppointments = useMemo(() => {
        const today = new Date();

        return appointments
            .filter(appointment => {
                const date = new Date(appointment.startOfAppointment);

                return (
                    isSameDay(date, today) &&
                    ['PENDING', 'CONFIRMED'].includes(appointment.status)
                );
            })
            .sort(
                (a, b) =>
                    new Date(a.startOfAppointment) -
                    new Date(b.startOfAppointment)
            );
    }, [appointments]);

    const upcomingAppointments = useMemo(() => {
        const now = new Date();

        return appointments
            .filter(appointment => {
                const date = new Date(appointment.startOfAppointment);

                return (
                    date > now &&
                    !isSameDay(date, now) &&
                    ['PENDING', 'CONFIRMED'].includes(appointment.status)
                );
            })
            .sort(
                (a, b) =>
                    new Date(a.startOfAppointment) -
                    new Date(b.startOfAppointment)
            );
    }, [appointments]);

    const historyAppointments = useMemo(() => {
        const today = new Date();

        return appointments
            .filter(appointment => {
                const date = new Date(appointment.startOfAppointment);

                return (
                    ['CANCELED', 'NO_SHOW', 'FINISHED'].includes(appointment.status) ||
                    (date < today &&
                        !isSameDay(date, today) &&
                        !['PENDING', 'CONFIRMED'].includes(appointment.status))
                );
            })
            .sort(
                (a, b) =>
                    new Date(b.startOfAppointment) -
                    new Date(a.startOfAppointment)
            );
    }, [appointments]);

    const pendingCount = useMemo(
        () => appointments.filter(a => a.status === 'PENDING').length,
        [appointments]
    );

    const displayedAppointments =
        activeTab === 'today'
            ? todayAppointments
            : activeTab === 'upcoming'
                ? upcomingAppointments
                : historyAppointments;

    const formatDate = dateTime => {
        if (!dateTime) return '—';
        return new Date(dateTime).toLocaleDateString('en-GB');
    };

    const formatTime = dateTime => {
        if (!dateTime) return '—';

        return new Date(dateTime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSex = sex => {
        if (sex === 'M') return 'Male';
        if (sex === 'F') return 'Female';
        return sex || 'Unknown';
    };

    const getStatusLabel = status => {
        if (status === 'NO_SHOW') return 'No show';
        if (status === 'FINISHED') return 'Finished';
        if (status === 'CANCELED') return 'Canceled';
        if (status === 'CONFIRMED') return 'Confirmed';
        if (status === 'PENDING') return 'Pending';

        return status;
    };

    const updateStatusLocally = (appointmentId, status) => {
        setAppointments(current =>
            current.map(appointment =>
                appointment.id === appointmentId
                    ? { ...appointment, status }
                    : appointment
            )
        );
    };

    const handleConfirm = async appointmentId => {
        try {
            setUpdatingId(appointmentId);
            setUpdatingAction('confirm');
            setError(null);

            await confirmAppointment(appointmentId);
            updateStatusLocally(appointmentId, 'CONFIRMED');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Could not confirm appointment.'
            );
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const executeConfirmation = async () => {
        if (!confirmation) return;

        const { appointment, action } = confirmation;

        try {
            setUpdatingId(appointment.id);
            setUpdatingAction(action);
            setError(null);

            if (action === 'cancel') {
                await cancelAppointment(appointment.id);
                updateStatusLocally(appointment.id, 'CANCELED');
            }

            if (action === 'no-show') {
                await markAppointmentNoShow(appointment.id);
                updateStatusLocally(appointment.id, 'NO_SHOW');
            }

            setConfirmation(null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                `Could not ${action === 'cancel' ? 'cancel appointment' : 'mark appointment as no-show'}.`
            );
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const openConfirmation = (appointment, action) => {
        setConfirmation({ appointment, action });
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="vet-appointments-page">
                    <div className="vet-appointments-loading">
                        <div className="vet-appointments-spinner" />
                        <p>Loading appointments...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="vet-appointments-page">
                <div className="vet-appointments-container">

                    <header className="vet-appointments-header">
                        <div>
                            <span>VETERINARIAN</span>
                            <h1>Appointments</h1>
                            <p>Manage your patients and today's veterinary visits.</p>
                        </div>

                        <Link
                            to="/veterinarian/schedule"
                            className="primary-button"
                        >
                            Manage schedule
                        </Link>
                    </header>

                    {error && (
                        <div className="vet-appointments-error">
                            {error}
                        </div>
                    )}

                    <section className="vet-summary-grid">
                        <div className="vet-summary-card highlight">
                            <span>TODAY</span>
                            <strong>{todayAppointments.length}</strong>
                            <p>
                                {todayAppointments.length === 1
                                    ? 'visit scheduled today'
                                    : 'visits scheduled today'}
                            </p>
                        </div>

                        <div className="vet-summary-card">
                            <span>PENDING</span>
                            <strong>{pendingCount}</strong>
                            <p>Waiting for confirmation</p>
                        </div>

                        <div className="vet-summary-card">
                            <span>UPCOMING</span>
                            <strong>{upcomingAppointments.length}</strong>
                            <p>Future appointments</p>
                        </div>
                    </section>

                    <div className="vet-appointments-tabs">
                        <button
                            type="button"
                            className={activeTab === 'today' ? 'active' : ''}
                            onClick={() => setActiveTab('today')}
                        >
                            Today
                            <span>{todayAppointments.length}</span>
                        </button>

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
                        <div className="vet-appointments-empty">
                            <div>✓</div>

                            <h2>
                                {activeTab === 'today'
                                    ? 'No visits today'
                                    : activeTab === 'upcoming'
                                        ? 'No upcoming appointments'
                                        : 'No appointment history'}
                            </h2>

                            <p>
                                {activeTab === 'today'
                                    ? 'There are no veterinary visits scheduled for today.'
                                    : activeTab === 'upcoming'
                                        ? 'Your future appointments will appear here.'
                                        : 'Finished, canceled and missed appointments will appear here.'}
                            </p>
                        </div>
                    ) : (
                        <div className="vet-appointments-list">
                            {displayedAppointments.map(appointment => {
                                const start = new Date(appointment.startOfAppointment);
                                const now = new Date();

                                const canCancel =
                                    start > now &&
                                    ['PENDING', 'CONFIRMED'].includes(
                                        appointment.status
                                    );

                                const canStartVisit =
                                    appointment.status === 'CONFIRMED' &&
                                    start <= now;

                                return (
                                    <article
                                        className="vet-appointment-card"
                                        key={appointment.id}
                                    >
                                        <div className="vet-appointment-time">
                                            <strong>
                                                {formatTime(
                                                    appointment.startOfAppointment
                                                )}
                                            </strong>

                                            <span>
                                                {formatTime(
                                                    appointment.endOfAppointment
                                                )}
                                            </span>
                                        </div>

                                        <div className="vet-appointment-content">

                                            <div className="vet-appointment-top">
                                                <div className="vet-patient">
                                                    <div className="vet-patient-avatar">
                                                        {appointment.petName
                                                            ?.charAt(0)
                                                            ?.toUpperCase() || 'P'}
                                                    </div>

                                                    <div>
                                                        <h2>
                                                            {appointment.petName ||
                                                                'Patient'}
                                                        </h2>

                                                        <p>
                                                            {appointment.species ||
                                                                'Unknown species'}

                                                            {appointment.race &&
                                                                ` · ${appointment.race}`}

                                                            {' · '}

                                                            {getSex(
                                                                appointment.sex
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`vet-appointment-status ${appointment.status?.toLowerCase()}`}
                                                >
                                                    {getStatusLabel(
                                                        appointment.status
                                                    )}
                                                </span>
                                            </div>

                                            <div className="vet-appointment-info">
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
                                                        )}{' '}
                                                        –{' '}
                                                        {formatTime(
                                                            appointment.endOfAppointment
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Service</span>
                                                    <strong>
                                                        {appointment.serviceName ||
                                                            'Veterinary appointment'}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="vet-appointment-actions">

                                                {!['CANCELED', 'NO_SHOW'].includes(
                                                    appointment.status
                                                ) && (
                                                        <>
                                                            <Link
                                                                to={`/veterinarian/pets/${appointment.petId}/medical-history/${appointment.id}`}
                                                                className="vet-secondary-action"
                                                            >
                                                                Medical history
                                                            </Link>

                                                            <Link
                                                                to={`/pets/${appointment.petId}/edit`}
                                                                className="vet-secondary-action"
                                                            >
                                                                Edit patient
                                                            </Link>
                                                        </>
                                                    )}

                                                <div className="vet-main-actions">

                                                    {appointment.status ===
                                                        'PENDING' && (
                                                            <button
                                                                type="button"
                                                                className="vet-confirm-action"
                                                                disabled={
                                                                    updatingId ===
                                                                    appointment.id
                                                                }
                                                                onClick={() =>
                                                                    handleConfirm(
                                                                        appointment.id
                                                                    )
                                                                }
                                                            >
                                                                {updatingId ===
                                                                    appointment.id &&
                                                                    updatingAction ===
                                                                    'confirm'
                                                                    ? 'Confirming...'
                                                                    : 'Confirm'}
                                                            </button>
                                                        )}

                                                    {canStartVisit && (
                                                        <>
                                                            <Link
                                                                to={`/veterinarian/appointments/${appointment.id}/medical-record`}
                                                                className="vet-complete-action"
                                                            >
                                                                Complete visit
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                className="vet-no-show-action"
                                                                disabled={
                                                                    updatingId ===
                                                                    appointment.id
                                                                }
                                                                onClick={() =>
                                                                    openConfirmation(
                                                                        appointment,
                                                                        'no-show'
                                                                    )
                                                                }
                                                            >
                                                                No show
                                                            </button>
                                                        </>
                                                    )}

                                                    {canCancel && (
                                                        <button
                                                            type="button"
                                                            className="vet-cancel-action"
                                                            disabled={
                                                                updatingId ===
                                                                appointment.id
                                                            }
                                                            onClick={() =>
                                                                openConfirmation(
                                                                    appointment,
                                                                    'cancel'
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}

                                                </div>
                                            </div>

                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                </div>
            </main>

            {confirmation && (
                <div
                    className="vet-modal-backdrop"
                    onMouseDown={() => {
                        if (!updatingId) setConfirmation(null);
                    }}
                >
                    <div
                        className="vet-modal"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <span>
                            {confirmation.action === 'cancel'
                                ? 'CANCEL APPOINTMENT'
                                : 'NO SHOW'}
                        </span>

                        <h2>
                            {confirmation.action === 'cancel'
                                ? 'Cancel this appointment?'
                                : 'Mark patient as no-show?'}
                        </h2>

                        <p>
                            {confirmation.action === 'cancel'
                                ? 'This appointment will be canceled and the pet owner will be notified.'
                                : `${confirmation.appointment.petName || 'This patient'} will be marked as not having attended the scheduled appointment.`}
                        </p>

                        <div className="vet-modal-appointment">
                            <strong>
                                {confirmation.appointment.petName || 'Patient'}
                            </strong>

                            <span>
                                {formatDate(
                                    confirmation.appointment.startOfAppointment
                                )}{' '}
                                ·{' '}
                                {formatTime(
                                    confirmation.appointment.startOfAppointment
                                )}
                            </span>
                        </div>

                        <div className="vet-modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={updatingId}
                                onClick={() => setConfirmation(null)}
                            >
                                Go back
                            </button>

                            <button
                                type="button"
                                className={
                                    confirmation.action === 'cancel'
                                        ? 'vet-modal-danger'
                                        : 'vet-modal-warning'
                                }
                                disabled={updatingId}
                                onClick={executeConfirmation}
                            >
                                {updatingId
                                    ? 'Updating...'
                                    : confirmation.action === 'cancel'
                                        ? 'Cancel appointment'
                                        : 'Mark as no-show'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}