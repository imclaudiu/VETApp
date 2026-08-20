import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../shared/components/Navbar';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { getMyPets } from '../features/pet/services/petService';

import { getAppointmentsByOwner } from '../features/appointment/services/appointmentService';

import { getVeterinarianById, getServiceById } from '../features/clinic/services/clinicService';

import './HomePage.css';


export default function HomePage() {

    const { user } = useAuth();

    const [pets, setPets] = useState([]);
    const [petsLoading, setPetsLoading] = useState(false);
    const [petsError, setPetsError] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsError, setAppointmentsError] = useState(null);


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


    if (user?.role === 'ADMIN') {

        return (
            <>
                <Navbar />

                <main className="dashboard-page">

                    <div className="dashboard-container">


                        <section className="dashboard-heading">

                            <div>

                                <p className="dashboard-eyebrow">
                                    ADMINISTRATION
                                </p>

                                <h1>
                                    Welcome back, {user?.username}
                                </h1>

                                <p>
                                    Manage users, clinics and application
                                    resources from your administration dashboard.
                                </p>

                            </div>

                        </section>


                        <section className="dashboard-hero">

                            <div className="dashboard-hero-content">

                                <span className="dashboard-hero-label">
                                    ADMIN PANEL
                                </span>

                                <h2>
                                    Manage the VETApp platform.
                                </h2>

                                <p>
                                    Add veterinary clinics, manage users
                                    and configure the resources available
                                    throughout the application.
                                </p>

                            </div>


                            <div className="dashboard-hero-decoration">

                                <div
                                    className="
                                    hero-circle
                                    hero-circle-large
                                "
                                />

                                <div
                                    className="
                                    hero-circle
                                    hero-circle-medium
                                "
                                />

                                <div className="hero-cross">
                                    +
                                </div>

                            </div>

                        </section>


                        <section className="quick-actions-section">

                            <div className="section-header">

                                <div>

                                    <p className="section-label">
                                        MANAGEMENT
                                    </p>

                                    <h2>
                                        Admin tools
                                    </h2>

                                </div>

                            </div>


                            <div className="quick-actions-grid">


                                {/* USERS */}

                                <Link
                                    to="/admin"
                                    className="quick-action-card"
                                >

                                    <div className="quick-action-number">
                                        01
                                    </div>

                                    <div>

                                        <h3>
                                            Manage users
                                        </h3>

                                        <p>
                                            View registered users and
                                            manage their roles.
                                        </p>

                                    </div>

                                    <span className="quick-action-arrow">
                                        →
                                    </span>

                                </Link>


                                <Link
                                    to="/admin/clinics"
                                    className="quick-action-card"
                                >
                                    <div className="quick-action-number">
                                        02
                                    </div>

                                    <div>
                                        <h3>
                                            Manage clinics
                                        </h3>

                                        <p>
                                            Add clinics, veterinarians,
                                            services and work schedules.
                                        </p>
                                    </div>

                                    <span className="quick-action-arrow">
                                        →
                                    </span>
                                </Link>


                                {/* CLINICS */}

                                <Link
                                    to="/clinics"
                                    className="quick-action-card"
                                >

                                    <div className="quick-action-number">
                                        03
                                    </div>

                                    <div>

                                        <h3>
                                            View clinics
                                        </h3>

                                        <p>
                                            Browse clinics registered
                                            in the application.
                                        </p>

                                    </div>

                                    <span className="quick-action-arrow">
                                        →
                                    </span>

                                </Link>


                            </div>

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

                <main className="dashboard-page">

                    <div className="dashboard-container">

                        <section className="dashboard-heading">

                            <div>
                                <p className="dashboard-eyebrow">
                                    VETERINARIAN DASHBOARD
                                </p>

                                <h1>
                                    Welcome back, {user?.username}
                                </h1>

                                <p>
                                    Your veterinary dashboard will contain
                                    appointments, availability and medical
                                    records.
                                </p>
                            </div>

                        </section>


                        <section className="dashboard-placeholder">

                            <span className="dashboard-placeholder-number">
                                NEXT
                            </span>

                            <div>
                                <h3>
                                    Veterinarian workspace
                                </h3>

                                <p>
                                    We will connect this section when we build
                                    appointments and availability.
                                </p>
                            </div>

                        </section>

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

    return (
        <>
            <Navbar />

            <main className="dashboard-page">

                <div className="dashboard-container">


                    {/* HEADER */}

                    <section className="dashboard-heading">

                        <div>
                            <p className="dashboard-eyebrow">
                                YOUR DASHBOARD
                            </p>

                            <h1>
                                Welcome back, {user?.username}
                            </h1>

                            <p>
                                Everything you need to care for your pets,
                                all in one place.
                            </p>
                        </div>


                        <Link
                            to="/pets/new"
                            className="dashboard-primary-button"
                        >
                            <span>+</span>
                            Add new pet
                        </Link>

                    </section>


                    {/* INTRO CARD */}

                    <section className="dashboard-hero">

                        <div className="dashboard-hero-content">

                            <span className="dashboard-hero-label">
                                VETApp
                            </span>

                            <h2>
                                Better care starts with
                                better organization.
                            </h2>

                            <p>
                                Keep your pets, appointments and medical
                                information organized in one secure place.
                            </p>

                            <div className="dashboard-hero-buttons">

                                <Link
                                    to="/pets"
                                    className="hero-main-button"
                                >
                                    View my pets
                                </Link>

                                <Link
                                    to="/clinics"
                                    className="hero-secondary-button"
                                >
                                    Find a clinic
                                    <span>→</span>
                                </Link>

                            </div>

                        </div>


                        <div className="dashboard-hero-decoration">

                            <div className="hero-circle hero-circle-large" />
                            <div className="hero-circle hero-circle-medium" />

                            <div className="hero-cross">
                                +
                            </div>

                        </div>

                    </section>


                    {/* PETS */}

                    <section className="pets-preview-section">

                        <div className="section-header">

                            <div>
                                <p className="section-label">
                                    MY PETS
                                </p>

                                <h2>
                                    Your companions
                                </h2>
                            </div>


                            <Link
                                to="/pets"
                                className="section-link"
                            >
                                View all
                                <span>→</span>
                            </Link>

                        </div>


                        {petsLoading && (
                            <div className="dashboard-loading">
                                Loading your pets...
                            </div>
                        )}


                        {petsError && (
                            <div className="dashboard-error">
                                {petsError}
                            </div>
                        )}


                        {!petsLoading &&
                            !petsError &&
                            pets.length === 0 && (

                                <div className="pets-empty-state">

                                    <div className="pets-empty-icon">
                                        +
                                    </div>

                                    <h3>
                                        No pets added yet
                                    </h3>

                                    <p>
                                        Add your first pet to start managing
                                        their information and veterinary care.
                                    </p>

                                    <Link
                                        to="/pets/new"
                                        className="empty-add-button"
                                    >
                                        Add your first pet
                                    </Link>

                                </div>
                            )}


                        {!petsLoading &&
                            !petsError &&
                            pets.length > 0 && (

                                <div className="pets-preview-grid">

                                    {pets
                                        .slice(0, 3)
                                        .map((pet) => (

                                            <Link
                                                to={`/pets/${pet.id}/edit`}
                                                key={pet.id}
                                                className="pet-preview-card"
                                            >

                                                <div className="pet-avatar">
                                                    {getPetInitial(pet)}
                                                </div>


                                                <div className="pet-card-content">

                                                    <div className="pet-card-heading">

                                                        <div>
                                                            <h3>
                                                                {pet.name}
                                                            </h3>

                                                            <p>
                                                                {pet.race}
                                                            </p>
                                                        </div>


                                                        <span className="pet-card-arrow">
                                                            →
                                                        </span>

                                                    </div>


                                                    <div className="pet-details">

                                                        <span>
                                                            {pet.species}
                                                        </span>

                                                        <span className="pet-dot" />

                                                        <span>
                                                            {pet.sex}
                                                        </span>

                                                    </div>

                                                </div>

                                            </Link>
                                        ))}


                                    <Link
                                        to="/pets/new"
                                        className="add-pet-preview-card"
                                    >
                                        <span className="add-pet-preview-icon">
                                            +
                                        </span>

                                        <span>
                                            Add another pet
                                        </span>
                                    </Link>

                                </div>
                            )}

                    </section>


                    {/* LOWER GRID */}

                    <section className="dashboard-lower-grid">


                        {/* APPOINTMENTS */}

                        <div className="dashboard-panel">

                            <div className="panel-heading">

                                <div>

                                    <p className="section-label">
                                        APPOINTMENTS
                                    </p>

                                    <h2>
                                        Upcoming visits
                                    </h2>

                                </div>


                                {appointments.length > 0 && (

                                    <Link
                                        to="/appointments"
                                        className="section-link"
                                    >
                                        View all

                                        <span>
                                            →
                                        </span>
                                    </Link>

                                )}

                            </div>


                            {appointmentsLoading ? (

                                <div className="dashboard-panel-empty">

                                    <div className="panel-empty-symbol">
                                        ...
                                    </div>

                                    <div>

                                        <h3>
                                            Loading appointments
                                        </h3>

                                        <p>
                                            We're loading your upcoming
                                            veterinary visits.
                                        </p>

                                    </div>

                                </div>

                            ) : appointmentsError ? (

                                <div className="dashboard-appointment-error">

                                    {appointmentsError}

                                </div>

                            ) : appointments.length === 0 ? (

                                <div className="dashboard-panel-empty">

                                    <div className="panel-empty-symbol">
                                        01
                                    </div>

                                    <div>

                                        <h3>
                                            No upcoming appointments
                                        </h3>

                                        <p>
                                            You don't have any veterinary
                                            visits scheduled yet.
                                        </p>

                                        <Link
                                            to="/clinics"
                                            className="appointment-find-clinic"
                                        >
                                            Find a clinic →
                                        </Link>

                                    </div>

                                </div>

                            ) : (

                                <div className="dashboard-appointments-list">

                                    {appointments
                                        .slice(0, 3)
                                        .map((appointment) => (

                                            <article
                                                key={appointment.id}
                                                className="dashboard-appointment-card"
                                            >

                                                <div className="appointment-date-box">

                                                    <strong>
                                                        {new Date(
                                                            appointment.startOfAppointment
                                                        ).getDate()}
                                                    </strong>

                                                    <span>
                                                        {new Date(
                                                            appointment.startOfAppointment
                                                        )
                                                            .toLocaleString(
                                                                'en-GB',
                                                                {
                                                                    month: 'short'
                                                                }
                                                            )
                                                            .toUpperCase()}
                                                    </span>

                                                </div>


                                                <div className="appointment-main-info">

                                                    <div className="appointment-title-row">

                                                        <div>

                                                            <h3>
                                                                {getPetName(
                                                                    appointment.petId
                                                                )}
                                                            </h3>

                                                            <p>
                                                                Dr. {
                                                                    appointment
                                                                        .veterinarian
                                                                        ?.name
                                                                    ||
                                                                    'Veterinarian'
                                                                }
                                                            </p>

                                                        </div>


                                                        <span
                                                            className={
                                                                getAppointmentStatusClass(
                                                                    appointment.status
                                                                )
                                                            }
                                                        >
                                                            {appointment.status}
                                                        </span>

                                                    </div>


                                                    <div className="appointment-meta">

                                                        <span>
                                                            {formatAppointmentDate(
                                                                appointment.startOfAppointment
                                                            )}
                                                        </span>

                                                        <span className="appointment-dot" />

                                                        <strong>
                                                            {formatAppointmentTime(
                                                                appointment.startOfAppointment
                                                            )}
                                                        </strong>

                                                        <span className="appointment-dot" />

                                                        <span>
                                                            {
                                                                appointment
                                                                    .service
                                                                    ?.serviceName
                                                                ||
                                                                'Veterinary appointment'
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </article>

                                        ))}

                                </div>

                            )}

                        </div>


                        {/* QUICK ACTIONS */}

                        <div className="dashboard-panel">

                            <div className="panel-heading">

                                <div>
                                    <p className="section-label">
                                        QUICK ACTIONS
                                    </p>

                                    <h2>
                                        What do you need?
                                    </h2>
                                </div>

                            </div>


                            <div className="dashboard-actions">

                                <Link
                                    to="/pets"
                                    className="dashboard-action"
                                >
                                    <span className="action-number">
                                        01
                                    </span>

                                    <div>
                                        <strong>
                                            My pets
                                        </strong>

                                        <small>
                                            View and manage pets
                                        </small>
                                    </div>

                                    <span className="action-arrow">
                                        →
                                    </span>
                                </Link>


                                <Link
                                    to="/pets/new"
                                    className="dashboard-action"
                                >
                                    <span className="action-number">
                                        02
                                    </span>

                                    <div>
                                        <strong>
                                            Add a pet
                                        </strong>

                                        <small>
                                            Register a new pet
                                        </small>
                                    </div>

                                    <span className="action-arrow">
                                        →
                                    </span>
                                </Link>


                                <Link
                                    to="/clinics"
                                    className="dashboard-action"
                                >
                                    <span className="action-number">
                                        03
                                    </span>

                                    <div>
                                        <strong>
                                            Find a clinic
                                        </strong>

                                        <small>
                                            Browse veterinary clinics
                                        </small>
                                    </div>

                                    <span className="action-arrow">
                                        →
                                    </span>
                                </Link>

                            </div>

                        </div>

                    </section>

                </div>

            </main>
        </>
    );
}