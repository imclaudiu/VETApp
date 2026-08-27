import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../shared/components/Navbar';

import { getMyVeterinarian } from '../../features/veterinarian/services/veterinarianService';
import {
    getAppointmentsByVeterinarian,
    confirmAppointment,
    cancelAppointment,
    markAppointmentNoShow
} from '../../features/appointment/services/appointmentService';

import { Link } from 'react-router-dom';

import './VeterinarianAppointmentsPage.css';


export default function VeterinarianAppointmentsPage() {

    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [updatingAction, setUpdatingAction] = useState(null);

    useEffect(() => {

        const loadAppointments = async () => {

            try {

                setLoading(true);
                setError(null);

                const veterinarian = await getMyVeterinarian();

                const data = await getAppointmentsByVeterinarian(
                    veterinarian.id
                );

                setAppointments(data);

            } catch (err) {

                console.error(
                    'Could not load veterinarian appointments:',
                    err
                );

                setError(
                    err.message ||
                    'Could not load appointments.'
                );

            } finally {

                setLoading(false);
            }
        };


        loadAppointments();

    }, []);


    const upcomingAppointments = useMemo(() => {
        const now = new Date();

        return appointments
            .filter(appointment =>
                ['PENDING', 'CONFIRMED'].includes(appointment.status) &&
                new Date(appointment.startOfAppointment) >= now
            )
            .sort((a, b) =>
                new Date(a.startOfAppointment) - new Date(b.startOfAppointment)
            );
    }, [appointments]);


    const previousAppointments = useMemo(() => {
        const now = new Date();

        return appointments
            .filter(appointment =>
                appointment.status === 'CANCELED' ||
                appointment.status === 'NO_SHOW' ||
                appointment.status === 'FINISHED' ||
                new Date(appointment.startOfAppointment) < now
            )
            .sort((a, b) =>
                new Date(b.startOfAppointment) - new Date(a.startOfAppointment)
            );
    }, [appointments]);


    const displayedAppointments =
        activeTab === 'upcoming'
            ? upcomingAppointments
            : previousAppointments;


    const formatDate = (dateTime) => {

        if (!dateTime) return '';

        return new Intl.DateTimeFormat(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        ).format(
            new Date(dateTime)
        );
    };


    const formatTime = (dateTime) => {

        if (!dateTime) return '';

        return new Intl.DateTimeFormat(
            'en-GB',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        ).format(
            new Date(dateTime)
        );
    };

    const updateAppointmentStatusLocally = (appointmentId, status) => {
        setAppointments(current =>
            current.map(appointment =>
                appointment.id === appointmentId
                    ? { ...appointment, status }
                    : appointment
            )
        );
    };

    const handleConfirmAppointment = async (appointmentId) => {
        try {
            setUpdatingId(appointmentId);
            setUpdatingAction('confirm');
            setError(null);

            await confirmAppointment(appointmentId);
            updateAppointmentStatusLocally(appointmentId, 'CONFIRMED');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Could not confirm appointment.');
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        const confirmed = window.confirm('Are you sure you want to cancel this appointment?');

        if (!confirmed) return;

        try {
            setUpdatingId(appointmentId);
            setUpdatingAction('cancel');
            setError(null);

            await cancelAppointment(appointmentId);
            updateAppointmentStatusLocally(appointmentId, 'CANCELED');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Could not cancel appointment.');
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const handleNoShow = async (appointmentId) => {
        const confirmed = window.confirm('Mark this patient as no-show?');

        if (!confirmed) return;

        try {
            setUpdatingId(appointmentId);
            setUpdatingAction('no-show');
            setError(null);

            await markAppointmentNoShow(appointmentId);
            updateAppointmentStatusLocally(appointmentId, 'NO_SHOW');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Could not mark appointment as no-show.');
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const getStatusClass = (status) => {
        return `vet-appointment-status ${status?.toLowerCase()}`;
    };


    if (loading) {

        return (
            <>
                <Navbar />

                <div className="vet-appointments-loading">
                    Loading appointments...
                </div>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="vet-appointments-page">

                <div className="vet-appointments-container">


                    {/* HEADER */}

                    <section className="vet-appointments-header">

                        <div>

                            <p className="vet-appointments-eyebrow">
                                VETERINARIAN
                            </p>

                            <h1>
                                My appointments
                            </h1>

                            <p>
                                View and manage your scheduled veterinary appointments.
                            </p>

                        </div>

                    </section>


                    {/* ERROR */}

                    {error && (

                        <div className="vet-appointments-error">
                            {error}
                        </div>

                    )}


                    {/* SUMMARY */}

                    <div className="vet-appointments-summary">

                        <div>

                            <span>
                                UPCOMING
                            </span>

                            <strong>
                                {upcomingAppointments.length}
                            </strong>

                            <p>
                                Scheduled visits
                            </p>

                        </div>


                        <div>

                            <span>
                                TOTAL
                            </span>

                            <strong>
                                {appointments.length}
                            </strong>

                            <p>
                                All appointments
                            </p>

                        </div>

                    </div>


                    {/* TABS */}

                    <div className="vet-appointments-tabs">

                        <button
                            type="button"
                            className={
                                activeTab === 'upcoming'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setActiveTab('upcoming')
                            }
                        >

                            Upcoming

                            <span>
                                {upcomingAppointments.length}
                            </span>

                        </button>


                        <button
                            type="button"
                            className={
                                activeTab === 'history'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setActiveTab('history')
                            }
                        >

                            History

                            <span>
                                {previousAppointments.length}
                            </span>

                        </button>

                    </div>


                    {/* EMPTY */}

                    {displayedAppointments.length === 0 ? (

                        <div className="vet-appointments-empty">

                            <div>
                                +
                            </div>

                            <h2>

                                {activeTab === 'upcoming'
                                    ? 'No upcoming appointments'
                                    : 'No appointment history'
                                }

                            </h2>

                            <p>

                                {activeTab === 'upcoming'
                                    ? 'You currently have no scheduled veterinary visits.'
                                    : 'Your previous appointments will appear here.'
                                }

                            </p>

                        </div>

                    ) : (

                        /* APPOINTMENTS */

                        <div className="vet-appointments-list">

                            {displayedAppointments.map(
                                appointment => (

                                    <article
                                        className="vet-appointment-card"
                                        key={appointment.id}
                                    >


                                        {/* DATE BOX */}

                                        <div className="vet-appointment-date">

                                            <strong>
                                                {
                                                    new Date(
                                                        appointment.startOfAppointment
                                                    ).getDate()
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    new Date(
                                                        appointment.startOfAppointment
                                                    )
                                                        .toLocaleString(
                                                            'en-GB',
                                                            {
                                                                month: 'short'
                                                            }
                                                        )
                                                        .toUpperCase()
                                                }
                                            </span>

                                        </div>


                                        {/* APPOINTMENT */}

                                        <div className="vet-appointment-content">

                                            <div className="vet-appointment-heading">

                                                <div>

                                                    <h2>
                                                        {appointment.petName || 'Patient'}
                                                    </h2>

                                                    <p>

                                                        {appointment.species || 'Unknown species'}

                                                        {appointment.race
                                                            ? ` • ${appointment.race}`
                                                            : ''
                                                        }

                                                        {appointment.sex
                                                            ? ` • ${appointment.sex}`
                                                            : ''
                                                        }

                                                    </p>

                                                </div>


                                                <div className="vet-appointment-heading-actions">

                                                    <span className={getStatusClass(appointment.status)}>
                                                        {appointment.status}
                                                    </span>

                                                    {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                                                        <div className="vet-appointment-action-buttons">

                                                            {!['CANCELED', 'NO_SHOW'].includes(appointment.status) && (
                                                                <>
                                                                    <Link
                                                                        to={`/veterinarian/pets/${appointment.petId}/medical-history/${appointment.id}`}
                                                                        className="vet-history-button"
                                                                    >
                                                                        Medical history
                                                                    </Link>

                                                                    <Link
                                                                        to={`/pets/${appointment.petId}/edit`}
                                                                        className="vet-edit-pet-button"
                                                                    >
                                                                        Edit pet
                                                                    </Link>
                                                                </>
                                                            )}

                                                            {appointment.status === 'PENDING' && (
                                                                <button
                                                                    type="button"
                                                                    className="vet-confirm-button"
                                                                    disabled={updatingId === appointment.id}
                                                                    onClick={() => handleConfirmAppointment(appointment.id)}
                                                                >
                                                                    {updatingId === appointment.id &&
                                                                        updatingAction === 'confirm'
                                                                        ? 'Confirming...'
                                                                        : 'Confirm'}
                                                                </button>
                                                            )}

                                                            {new Date(appointment.startOfAppointment) > new Date() &&
                                                                ['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                                                                    <button
                                                                        type="button"
                                                                        className="vet-cancel-button"
                                                                        disabled={updatingId === appointment.id}
                                                                        onClick={() => handleCancelAppointment(appointment.id)}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}

                                                            {appointment.status === 'CONFIRMED' &&
                                                                new Date(appointment.startOfAppointment) <= new Date() && (
                                                                    <>
                                                                        <Link
                                                                            to={`/veterinarian/appointments/${appointment.id}/medical-record`}
                                                                            className="vet-complete-button"
                                                                        >
                                                                            Complete visit
                                                                        </Link>

                                                                        <button
                                                                            type="button"
                                                                            className="vet-no-show-button"
                                                                            disabled={updatingId === appointment.id}
                                                                            onClick={() => handleNoShow(appointment.id)}
                                                                        >
                                                                            No show
                                                                        </button>
                                                                    </>
                                                                )}

                                                        </div>
                                                    )}

                                                </div>

                                            </div>


                                            <div className="vet-appointment-details">


                                                {/* DATE */}

                                                <div>

                                                    <span>
                                                        DATE
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                appointment.startOfAppointment
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                {/* TIME */}

                                                <div>

                                                    <span>
                                                        TIME
                                                    </span>

                                                    <strong>

                                                        {
                                                            formatTime(
                                                                appointment.startOfAppointment
                                                            )
                                                        }

                                                        {' — '}

                                                        {
                                                            formatTime(
                                                                appointment.endOfAppointment
                                                            )
                                                        }

                                                    </strong>

                                                </div>


                                                {/* SERVICE */}

                                                <div>

                                                    <span>
                                                        SERVICE
                                                    </span>

                                                    <strong>
                                                        {
                                                            appointment.serviceName ||
                                                            'Veterinary appointment'
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </div>

            </main>
        </>
    );
}