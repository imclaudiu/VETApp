import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../shared/components/Navbar';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { getMyPets } from '../features/pet/services/petService';

import {
    getAppointmentsByOwner,
    getAppointmentsByVeterinarian,
    cancelAppointment
} from '../features/appointment/services/appointmentService';

import {
    getVeterinarianById,
    getServiceById,
    getClinicById
} from '../features/clinic/services/clinicService';

import './HomePage.css';

import { getMyVeterinarian } from '../features/veterinarian/services/veterinarianService';


export default function HomePage() {

    const { user } = useAuth();
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [petsLoading, setPetsLoading] = useState(false);
    const [petsError, setPetsError] = useState(null);
    const [cancelingAppointmentId, setCancelingAppointmentId] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsError, setAppointmentsError] = useState(null);
    const [vetProfile, setVetProfile] = useState(null);
    const [vetClinic, setVetClinic] = useState(null);
    const [vetAppointments, setVetAppointments] = useState([]);
    const [vetDashboardLoading, setVetDashboardLoading] = useState(false);
    const [vetDashboardError, setVetDashboardError] = useState(null);



    useEffect(() => {

        if (user?.role !== 'OWNER') {
            return;
        }

        const loadPets = async () => {

            setPetsLoading(true);
            setPetsError(null);

            try {
                const data = await getMyPets();
                setPets(data);
            } catch (err) {
                setPetsError(err.message);
            } finally {
                setPetsLoading(false);
            }

        };

        loadPets();

    }, [user?.role]);

    useEffect(() => {

        if (
            user?.role !== 'OWNER' ||
            !user?.userId
        ) {
            return;
        }


        const loadAppointments = async () => {

            setAppointmentsLoading(true);
            setAppointmentsError(null);

            try {

                const data =
                    await getAppointmentsByOwner(
                        user.userId
                    );


                /*
                 * Păstrăm doar programările viitoare,
                 * care nu sunt anulate.
                 */
                const upcoming =
                    data
                        .filter((appointment) => {

                            const appointmentDate =
                                new Date(
                                    appointment.startOfAppointment
                                );

                            return (
                                appointment.status !== 'CANCELED'
                                &&
                                appointmentDate >= new Date()
                            );

                        })
                        .sort(
                            (a, b) =>
                                new Date(
                                    a.startOfAppointment
                                )
                                -
                                new Date(
                                    b.startOfAppointment
                                )
                        );


                /*
                 * Luăm informațiile despre medic
                 * și serviciu.
                 */
                const detailedAppointments =
                    await Promise.all(

                        upcoming.map(
                            async (appointment) => {

                                let veterinarian = null;
                                let service = null;


                                try {

                                    veterinarian =
                                        await getVeterinarianById(
                                            appointment.veterinarianId
                                        );

                                } catch {
                                    // păstrăm fallback-ul
                                }


                                if (appointment.vetServiceId) {

                                    try {

                                        service =
                                            await getServiceById(
                                                appointment.vetServiceId
                                            );

                                    } catch {
                                        // păstrăm fallback-ul
                                    }

                                }


                                return {
                                    ...appointment,
                                    veterinarian,
                                    service
                                };
                            }
                        )
                    );


                setAppointments(
                    detailedAppointments
                );

            } catch (err) {

                console.error(
                    'Could not load appointments:',
                    err
                );

                setAppointmentsError(
                    err.message ||
                    'Could not load appointments.'
                );

            } finally {

                setAppointmentsLoading(false);

            }
        };


        loadAppointments();

    }, [
        user?.role,
        user?.userId
    ]);



    const getPetInitial = (pet) => {
        return pet?.name?.charAt(0)?.toUpperCase() || 'P';
    };


    useEffect(() => {
        if (user?.role !== 'VETERINARIAN') return;

        const loadVeterinarianDashboard = async () => {
            try {
                setVetDashboardLoading(true);
                setVetDashboardError(null);

                const veterinarian = await getMyVeterinarian();

                setVetProfile(veterinarian);

                const [clinicData, appointmentData] = await Promise.all([
                    veterinarian.clinicId
                        ? getClinicById(veterinarian.clinicId)
                        : Promise.resolve(null),

                    getAppointmentsByVeterinarian(veterinarian.id)
                ]);

                setVetClinic(clinicData);
                setVetAppointments(
                    Array.isArray(appointmentData)
                        ? appointmentData
                        : []
                );
            } catch (err) {
                console.error('Could not load veterinarian dashboard:', err);

                setVetDashboardError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    err.message ||
                    'Could not load veterinarian dashboard.'
                );
            } finally {
                setVetDashboardLoading(false);
            }
        };

        loadVeterinarianDashboard();
    }, [user?.role]);

    const isSameDay = (first, second) =>
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();

    const vetActiveAppointments = vetAppointments
        .filter(appointment =>
            ['PENDING', 'CONFIRMED'].includes(appointment.status) &&
            new Date(appointment.startOfAppointment) >= new Date()
        )
        .sort(
            (a, b) =>
                new Date(a.startOfAppointment) -
                new Date(b.startOfAppointment)
        );

    const vetTodayAppointments = vetActiveAppointments.filter(appointment =>
        isSameDay(
            new Date(appointment.startOfAppointment),
            new Date()
        )
    );

    const vetPendingAppointments = vetAppointments.filter(
        appointment => appointment.status === 'PENDING'
    );

    const nextVetAppointment = vetActiveAppointments[0] || null;

    const formatVetDate = value => {
        if (!value) return '—';

        return new Date(value).toLocaleDateString('en-GB');
    };

    const formatVetTime = value => {
        if (!value) return '—';

        return new Date(value).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (user?.role === 'ADMIN') {
        return (
            <>
                <Navbar />

                <main className="admin-dashboard">
                    <div className="admin-dashboard-container">

                        <header className="admin-dashboard-header">
                            <div>
                                <span>ADMINISTRATION</span>

                                <h1>
                                    Welcome back, {user?.username}.
                                </h1>

                                <p>
                                    Manage users, clinics and application resources.
                                </p>
                            </div>

                            <Link
                                to="/admin/clinics"
                                className="primary-button"
                            >
                                Manage clinics
                            </Link>
                        </header>

                        <section className="admin-overview">
                            <div className="admin-overview-main">
                                <span>ADMIN CONSOLE</span>

                                <h2>
                                    VETApp administration
                                </h2>

                                <p>
                                    Manage the platform's users, veterinary clinics,
                                    veterinarians, services and schedules from one place.
                                </p>
                            </div>

                            <div className="admin-overview-role">
                                <span>ACCOUNT ROLE</span>
                                <strong>Administrator</strong>
                                <p>Full platform management access</p>
                            </div>
                        </section>

                        <section className="admin-management-section">

                            <div className="admin-section-heading">
                                <div>
                                    <span>MANAGEMENT</span>
                                    <h2>Administration tools</h2>
                                    <p>
                                        Select an area of the application to manage.
                                    </p>
                                </div>
                            </div>

                            <div className="admin-management-grid">

                                <Link
                                    to="/admin"
                                    className="admin-management-card"
                                >
                                    <div className="admin-card-top">
                                        <div className="admin-card-number">
                                            01
                                        </div>

                                        <span>→</span>
                                    </div>

                                    <div className="admin-card-content">
                                        <span>USERS</span>

                                        <h3>Manage users</h3>

                                        <p>
                                            View registered accounts and manage
                                            application roles and access.
                                        </p>
                                    </div>

                                    <div className="admin-card-footer">
                                        Open user management
                                    </div>
                                </Link>

                                <Link
                                    to="/admin/clinics"
                                    className="admin-management-card"
                                >
                                    <div className="admin-card-top">
                                        <div className="admin-card-number">
                                            02
                                        </div>

                                        <span>→</span>
                                    </div>

                                    <div className="admin-card-content">
                                        <span>CLINICS</span>

                                        <h3>Manage clinics</h3>

                                        <p>
                                            Add and edit clinics, veterinarians,
                                            services and work schedules.
                                        </p>
                                    </div>

                                    <div className="admin-card-footer">
                                        Open clinic management
                                    </div>
                                </Link>

                                <Link
                                    to="/clinics"
                                    className="admin-management-card"
                                >
                                    <div className="admin-card-top">
                                        <div className="admin-card-number">
                                            03
                                        </div>

                                        <span>→</span>
                                    </div>

                                    <div className="admin-card-content">
                                        <span>DIRECTORY</span>

                                        <h3>View clinics</h3>

                                        <p>
                                            Browse veterinary clinics exactly as
                                            they are displayed throughout VETApp.
                                        </p>
                                    </div>

                                    <div className="admin-card-footer">
                                        Browse clinics
                                    </div>
                                </Link>

                            </div>
                        </section>

                        <section className="admin-info-grid">

                            <div className="admin-info-panel">
                                <div className="admin-info-heading">
                                    <span>PLATFORM</span>
                                    <h2>What you can manage</h2>
                                </div>

                                <div className="admin-capabilities">

                                    <div>
                                        <span>01</span>

                                        <div>
                                            <strong>User accounts</strong>
                                            <p>
                                                Review users and manage their roles.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <span>02</span>

                                        <div>
                                            <strong>Veterinary clinics</strong>
                                            <p>
                                                Create, edit and remove clinic information.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <span>03</span>

                                        <div>
                                            <strong>Veterinarians</strong>
                                            <p>
                                                Assign veterinarians and configure their professional information.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <span>04</span>

                                        <div>
                                            <strong>Services & schedules</strong>
                                            <p>
                                                Configure veterinary services and availability.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <aside className="admin-access-panel">
                                <span>ADMINISTRATOR</span>

                                <div className="admin-access-avatar">
                                    {user?.username
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'A'}
                                </div>

                                <h2>
                                    {user?.username}
                                </h2>

                                <p>
                                    Administrator account
                                </p>

                                <div className="admin-access-divider" />

                                <div className="admin-access-row">
                                    <span>Role</span>
                                    <strong>Administrator</strong>
                                </div>

                                <div className="admin-access-row">
                                    <span>Access</span>
                                    <strong>Platform management</strong>
                                </div>
                            </aside>

                        </section>

                    </div>
                </main>
            </>
        );
    }


    if (user?.role === 'VETERINARIAN') {
        return (
            <>
                <Navbar />

                <main className="vet-dashboard-page">
                    <div className="vet-dashboard-container">

                        <header className="vet-dashboard-header">
                            <div>
                                <span>VETERINARIAN DASHBOARD</span>

                                <h1>
                                    Welcome back, {user?.username}
                                </h1>

                                <p>
                                    View your appointments, patients and work schedule.
                                </p>
                            </div>

                            <Link
                                to="/veterinarian/schedule"
                                className="primary-button"
                            >
                                Manage schedule
                            </Link>
                        </header>

                        {vetDashboardError && (
                            <div className="vet-dashboard-error">
                                {vetDashboardError}
                            </div>
                        )}

                        {vetDashboardLoading ? (
                            <div className="vet-dashboard-loading">
                                <div className="vet-dashboard-spinner" />
                                <p>Loading your dashboard...</p>
                            </div>
                        ) : (
                            <>
                                <section className="vet-dashboard-profile">
                                    <div className="vet-dashboard-profile-main">

                                        <div className="vet-dashboard-profile-icon">
                                            {user?.username
                                                ?.charAt(0)
                                                ?.toUpperCase() || 'V'}
                                        </div>

                                        <div>
                                            <span>PROFESSIONAL PROFILE</span>

                                            <h2>
                                                {user?.username}
                                            </h2>

                                            <p>
                                                {vetProfile?.surgeon
                                                    ? 'Veterinary surgeon'
                                                    : 'Veterinarian'}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="vet-dashboard-profile-details">

                                        <div>
                                            <span>Clinic</span>

                                            <strong>
                                                {vetClinic?.name ||
                                                    'Not assigned'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Position</span>

                                            <strong>
                                                {vetProfile?.surgeon
                                                    ? 'Veterinary surgeon'
                                                    : 'Veterinarian'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>City</span>

                                            <strong>
                                                {vetClinic?.city || '—'}
                                            </strong>
                                        </div>

                                    </div>
                                </section>

                                <section className="vet-dashboard-stats">

                                    <div className="vet-dashboard-stat primary">
                                        <span>TODAY</span>

                                        <strong>
                                            {vetTodayAppointments.length}
                                        </strong>

                                        <p>
                                            {vetTodayAppointments.length === 1
                                                ? 'appointment today'
                                                : 'appointments today'}
                                        </p>
                                    </div>

                                    <div className="vet-dashboard-stat">
                                        <span>PENDING</span>

                                        <strong>
                                            {vetPendingAppointments.length}
                                        </strong>

                                        <p>
                                            Waiting for confirmation
                                        </p>
                                    </div>

                                    <div className="vet-dashboard-stat">
                                        <span>UPCOMING</span>

                                        <strong>
                                            {vetActiveAppointments.length}
                                        </strong>

                                        <p>
                                            Scheduled visits
                                        </p>
                                    </div>

                                </section>

                                <div className="vet-dashboard-main-grid">

                                    <section className="vet-dashboard-panel">
                                        <div className="vet-dashboard-panel-header">
                                            <div>
                                                <span>NEXT APPOINTMENT</span>
                                                <h2>Upcoming patient</h2>
                                            </div>

                                            <Link to="/veterinarian/appointments">
                                                View all →
                                            </Link>
                                        </div>

                                        {!nextVetAppointment ? (
                                            <div className="vet-dashboard-empty">
                                                <div>✓</div>

                                                <h3>No upcoming appointments</h3>

                                                <p>
                                                    Your next scheduled patient will appear here.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="vet-dashboard-next">

                                                <div className="vet-dashboard-next-date">
                                                    <strong>
                                                        {String(
                                                            new Date(
                                                                nextVetAppointment.startOfAppointment
                                                            ).getDate()
                                                        ).padStart(2, '0')}
                                                    </strong>

                                                    <span>
                                                        {new Date(
                                                            nextVetAppointment.startOfAppointment
                                                        )
                                                            .toLocaleString(
                                                                'en-GB',
                                                                { month: 'short' }
                                                            )
                                                            .toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="vet-dashboard-next-content">

                                                    <div className="vet-dashboard-patient-heading">
                                                        <div>
                                                            <h3>
                                                                {nextVetAppointment.petName ||
                                                                    'Patient'}
                                                            </h3>

                                                            <p>
                                                                {nextVetAppointment.species ||
                                                                    'Unknown species'}

                                                                {nextVetAppointment.race
                                                                    ? ` · ${nextVetAppointment.race}`
                                                                    : ''}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`vet-dashboard-status ${nextVetAppointment.status?.toLowerCase()}`}
                                                        >
                                                            {nextVetAppointment.status}
                                                        </span>
                                                    </div>

                                                    <div className="vet-dashboard-next-info">

                                                        <div>
                                                            <span>Date</span>

                                                            <strong>
                                                                {formatVetDate(
                                                                    nextVetAppointment.startOfAppointment
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>Time</span>

                                                            <strong>
                                                                {formatVetTime(
                                                                    nextVetAppointment.startOfAppointment
                                                                )}

                                                                {nextVetAppointment.endOfAppointment &&
                                                                    ` – ${formatVetTime(
                                                                        nextVetAppointment.endOfAppointment
                                                                    )}`}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>Service</span>

                                                            <strong>
                                                                {nextVetAppointment.serviceName ||
                                                                    'Veterinary appointment'}
                                                            </strong>
                                                        </div>

                                                    </div>

                                                    <div className="vet-dashboard-next-actions">

                                                        <Link
                                                            to={`/veterinarian/pets/${nextVetAppointment.petId}/medical-history/${nextVetAppointment.id}`}
                                                            className="secondary-button"
                                                        >
                                                            Medical history
                                                        </Link>

                                                        <Link
                                                            to="/veterinarian/appointments"
                                                            className="primary-button"
                                                        >
                                                            Open appointment
                                                        </Link>

                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <aside className="vet-dashboard-actions-panel">
                                        <div className="vet-dashboard-panel-header">
                                            <div>
                                                <span>QUICK ACCESS</span>
                                                <h2>Workspace</h2>
                                            </div>
                                        </div>

                                        <div className="vet-dashboard-actions">

                                            <Link to="/veterinarian/appointments">
                                                <div className="vet-dashboard-action-icon">
                                                    01
                                                </div>

                                                <div>
                                                    <strong>Appointments</strong>

                                                    <p>
                                                        View and manage your patients.
                                                    </p>
                                                </div>

                                                <span>→</span>
                                            </Link>

                                            <Link to="/veterinarian/schedule">
                                                <div className="vet-dashboard-action-icon">
                                                    02
                                                </div>

                                                <div>
                                                    <strong>Work schedule</strong>

                                                    <p>
                                                        Manage your availability.
                                                    </p>
                                                </div>

                                                <span>→</span>
                                            </Link>

                                            {vetClinic?.id && (
                                                <Link to={`/clinics/${vetClinic.id}`}>
                                                    <div className="vet-dashboard-action-icon">
                                                        03
                                                    </div>

                                                    <div>
                                                        <strong>My clinic</strong>

                                                        <p>
                                                            View your clinic information.
                                                        </p>
                                                    </div>

                                                    <span>→</span>
                                                </Link>
                                            )}

                                        </div>
                                    </aside>

                                </div>

                                {vetTodayAppointments.length > 0 && (
                                    <section className="vet-dashboard-today">

                                        <div className="vet-dashboard-section-header">
                                            <div>
                                                <span>TODAY</span>
                                                <h2>Today's schedule</h2>
                                            </div>

                                            <p>
                                                {vetTodayAppointments.length}{' '}
                                                {vetTodayAppointments.length === 1
                                                    ? 'appointment'
                                                    : 'appointments'}
                                            </p>
                                        </div>

                                        <div className="vet-dashboard-today-list">

                                            {vetTodayAppointments
                                                .slice(0, 4)
                                                .map(appointment => (
                                                    <Link
                                                        key={appointment.id}
                                                        to="/veterinarian/appointments"
                                                        className="vet-dashboard-today-row"
                                                    >
                                                        <div className="vet-dashboard-today-time">
                                                            {formatVetTime(
                                                                appointment.startOfAppointment
                                                            )}
                                                        </div>

                                                        <div className="vet-dashboard-today-patient">
                                                            <strong>
                                                                {appointment.petName ||
                                                                    'Patient'}
                                                            </strong>

                                                            <span>
                                                                {appointment.serviceName ||
                                                                    'Veterinary appointment'}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={`vet-dashboard-status ${appointment.status?.toLowerCase()}`}
                                                        >
                                                            {appointment.status}
                                                        </span>

                                                        <span className="vet-dashboard-row-arrow">
                                                            →
                                                        </span>
                                                    </Link>
                                                ))}

                                        </div>
                                    </section>
                                )}
                            </>
                        )}

                    </div>
                </main>
            </>
        );
    }

    const getPetName = (petId) => {

        const pet =
            pets.find(
                (item) => item.id === petId
            );

        return pet?.name || 'Pet';
    };


    const formatAppointmentDate = (dateTime) => {

        if (!dateTime) {
            return '';
        }

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


    const formatAppointmentTime = (dateTime) => {

        if (!dateTime) {
            return '';
        }

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


    const getAppointmentStatusClass = (status) => {

        switch (status) {

            case 'CONFIRMED':
                return 'appointment-status confirmed';

            case 'PENDING':
                return 'appointment-status pending';

            case 'COMPLETED':
                return 'appointment-status completed';

            default:
                return 'appointment-status';
        }
    };

    const handleCancelAppointment = async (appointment) => {
        const confirmed = window.confirm('Are you sure you want to cancel this appointment?');

        if (!confirmed) {
            return;
        }


        setCancelingAppointmentId(appointment.id);

        setAppointmentsError(null);


        try {

            await cancelAppointment(
                appointment.id
            );

            setAppointments((currentAppointments) =>
                currentAppointments.filter(
                    (item) =>
                        item.id !== appointment.id
                )
            );

        } catch (err) {

            if (err.response?.status === 409) {

                setAppointmentsError(
                    err.response?.data?.message
                    ||
                    'This appointment can no longer be canceled.'
                );

            } else {

                setAppointmentsError(
                    err.message
                    ||
                    'Could not cancel appointment.'
                );

            }

        } finally {

            setCancelingAppointmentId(null);

        }
    };

    const nextAppointment = appointments[0];

    return (
        <>
            <Navbar />

            <main className="owner-dashboard">
                <div className="owner-dashboard-container">

                    <header className="owner-dashboard-header">
                        <div>
                            <span className="owner-dashboard-label">OVERVIEW</span>
                            <h1>Welcome back, {user?.username}.</h1>
                            <p>Here's what's happening with your pets.</p>
                        </div>

                        <Link to="/clinics" className="primary-button">Book appointment</Link>
                    </header>

                    <section className="owner-dashboard-grid">

                        <div className="owner-dashboard-panel owner-appointment-panel">
                            <div className="owner-panel-header">
                                <div>
                                    <span>UPCOMING</span>
                                    <h2>Next appointment</h2>
                                </div>

                                <Link to="/appointments">View all</Link>
                            </div>

                            {appointmentsLoading && <div className="owner-state">Loading appointment...</div>}

                            {appointmentsError && <div className="owner-error">{appointmentsError}</div>}

                            {!appointmentsLoading && !appointmentsError && !nextAppointment && (
                                <div className="owner-empty">
                                    <h3>No upcoming appointments</h3>
                                    <p>You don't have any veterinary visits scheduled.</p>
                                    <Link to="/clinics">Find a clinic →</Link>
                                </div>
                            )}

                            {nextAppointment && (
                                <div className="owner-next-appointment">
                                    <div className="owner-appointment-date">
                                        <strong>{new Date(nextAppointment.startOfAppointment).getDate()}</strong>
                                        <span>
                                            {new Date(nextAppointment.startOfAppointment)
                                                .toLocaleString('en-GB', { month: 'short' })
                                                .toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="owner-appointment-info">
                                        <div className="owner-appointment-title">
                                            <div>
                                                <h3>{getPetName(nextAppointment.petId)}</h3>
                                                <p>Dr. {nextAppointment.veterinarian?.name || 'Veterinarian'}</p>
                                            </div>

                                            <span className={`owner-status owner-status-${nextAppointment.status?.toLowerCase()}`}>
                                                {nextAppointment.status}
                                            </span>
                                        </div>

                                        <div className="owner-appointment-meta">
                                            <span>{formatAppointmentDate(nextAppointment.startOfAppointment)}</span>
                                            <span>{formatAppointmentTime(nextAppointment.startOfAppointment)}</span>
                                            <span>{nextAppointment.service?.serviceName || 'Veterinary appointment'}</span>
                                        </div>

                                        <div className="owner-appointment-actions">
                                            {nextAppointment.veterinarian?.clinicId && (
                                                <Link to={`/clinics/${nextAppointment.veterinarian.clinicId}`}>
                                                    Clinic details
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => handleCancelAppointment(nextAppointment)}
                                                disabled={cancelingAppointmentId === nextAppointment.id}
                                            >
                                                {cancelingAppointmentId === nextAppointment.id ? 'Canceling...' : 'Cancel appointment'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                        <aside className="owner-dashboard-panel owner-pets-panel">
                            <div className="owner-panel-header">
                                <div>
                                    <span>MY PETS</span>
                                    <h2>Your pets</h2>
                                </div>

                                <Link to="/pets">View all</Link>
                            </div>

                            {petsLoading && <div className="owner-state">Loading pets...</div>}
                            {petsError && <div className="owner-error">{petsError}</div>}

                            {!petsLoading && !petsError && pets.length === 0 && (
                                <div className="owner-empty">
                                    <h3>No pets yet</h3>
                                    <p>Add your first pet to start using VETApp.</p>
                                    <Link to="/pets/new">Add pet →</Link>
                                </div>
                            )}

                            {!petsLoading && pets.length > 0 && (
                                <div className="owner-pets-list">
                                    {pets.slice(0, 3).map(pet => (
                                        <Link to={`/pets/${pet.id}/edit`} className="owner-pet" key={pet.id}>
                                            <div className="owner-pet-avatar">{getPetInitial(pet)}</div>

                                            <div>
                                                <strong>{pet.name}</strong>
                                                <span>{pet.species} · {pet.race}</span>
                                            </div>

                                            <span className="owner-pet-arrow">→</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <Link to="/pets/new" className="owner-add-pet">+ Add another pet</Link>
                        </aside>

                    </section>


                    <section className="owner-quick-section">
                        <div className="owner-section-heading">
                            <h2>Quick access</h2>
                        </div>

                        <div className="owner-quick-grid">
                            <Link to="/clinics" className="owner-quick-card">
                                <span>Clinics</span>
                                <h3>Find veterinary care</h3>
                                <p>Browse partner clinics, veterinarians and available services.</p>
                                <strong>Browse clinics →</strong>
                            </Link>

                            <Link to="/chatbot" className="owner-quick-card">
                                <span>AI ASSISTANT</span>
                                <h3>Ask about your pet</h3>
                                <p>Get general veterinary information from the VETApp assistant.</p>
                                <strong>Ask VETApp AI →</strong>
                            </Link>

                            <Link to="/notifications" className="owner-quick-card">
                                <span>UPDATES</span>
                                <h3>Notifications</h3>
                                <p>Keep track of appointment updates and new medical records.</p>
                                <strong>View notifications →</strong>
                            </Link>
                        </div>
                    </section>

                </div>
            </main>
        </>
    );
}