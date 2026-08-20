import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import {
    getClinicById,
    getVeterinariansByClinic,
    getServicesByClinic
} from '../../features/clinic/services/clinicService';

import './ClinicDetailsPage.css';


export default function ClinicDetailsPage() {

    const { id } = useParams();

    const [clinic, setClinic] = useState(null);
    const [veterinarians, setVeterinarians] = useState([]);
    const [services, setServices] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        const loadClinic = async () => {

            setLoading(true);
            setError(null);

            try {

                const [
                    clinicData,
                    veterinariansData,
                    servicesData
                ] = await Promise.all([
                    getClinicById(id),
                    getVeterinariansByClinic(id),
                    getServicesByClinic(id)
                ]);

                setClinic(clinicData);
                setVeterinarians(veterinariansData);
                setServices(servicesData);

            } catch (err) {

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load clinic.'
                );

            } finally {

                setLoading(false);

            }

        };

        loadClinic();

    }, [id]);


    if (loading) {
        return (
            <>
                <Navbar />

                <main className="clinic-details-page">

                    <div className="clinic-details-loading">

                        <div className="clinic-details-spinner" />

                        <p>
                            Loading clinic...
                        </p>

                    </div>

                </main>
            </>
        );
    }


    if (error || !clinic) {
        return (
            <>
                <Navbar />

                <main className="clinic-details-page">

                    <div className="clinic-details-container">

                        <div className="clinic-details-error">

                            <h2>
                                Clinic could not be loaded
                            </h2>

                            <p>
                                {error}
                            </p>

                            <Link to="/clinics">
                                Back to clinics
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

            <main className="clinic-details-page">

                <div className="clinic-details-container">


                    <div className="clinic-details-back">

                        <Link to="/clinics">
                            ← Back to clinics
                        </Link>

                    </div>


                    {/* HERO */}

                    <section className="clinic-details-hero">

                        <div className="clinic-details-hero-content">

                            <p className="clinic-details-eyebrow">
                                VETERINARY CLINIC
                            </p>

                            <h1>
                                {clinic.name}
                            </h1>

                            <p className="clinic-details-location">
                                {clinic.address}, {clinic.city}
                            </p>


                            <div className="clinic-details-meta">

                                <div>

                                    <span>
                                        RATING
                                    </span>

                                    <strong>
                                        ★{' '}
                                        {Number(
                                            clinic.rating
                                        ).toFixed(1)}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        PHONE
                                    </span>

                                    <strong>
                                        {clinic.phone}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        CITY
                                    </span>

                                    <strong>
                                        {clinic.city}
                                    </strong>

                                </div>

                            </div>

                        </div>


                        <div className="clinic-details-cross">
                            +
                        </div>

                    </section>


                    {/* VETS */}

                    <section className="clinic-detail-section">

                        <div className="clinic-section-header">

                            <div>

                                <p>
                                    OUR TEAM
                                </p>

                                <h2>
                                    Veterinarians
                                </h2>

                            </div>

                            <span className="clinic-section-count">
                                {veterinarians.length}
                            </span>

                        </div>


                        {veterinarians.length === 0 ? (

                            <div className="clinic-section-empty">
                                No veterinarians are registered
                                for this clinic yet.
                            </div>

                        ) : (

                            <div className="veterinarians-grid">

                                {veterinarians.map((vet) => (

                                    <article
                                        className="veterinarian-card"
                                        key={vet.id}
                                    >

                                        <div className="veterinarian-avatar">

                                            {vet.name
                                                ?.charAt(0)
                                                ?.toUpperCase() ||
                                                'V'}

                                        </div>


                                        <div className="veterinarian-card-content">

                                            <div>

                                                <h3>
                                                    Dr. {vet.name}
                                                </h3>

                                                <p>
                                                    Veterinarian
                                                </p>

                                            </div>


                                            {vet.surgeon && (

                                                <span className="surgeon-badge">
                                                    Surgeon
                                                </span>

                                            )}

                                        </div>


                                        <Link
                                            to={
                                                `/appointments/new?clinicId=${clinic.id}` +
                                                `&veterinarianId=${vet.id}`
                                            }
                                            className="vet-book-button"
                                        >
                                            Book appointment

                                            <span>
                                                →
                                            </span>
                                        </Link>

                                    </article>

                                ))}

                            </div>
                        )}

                    </section>


                    {/* SERVICES */}

                    <section className="clinic-detail-section">

                        <div className="clinic-section-header">

                            <div>

                                <p>
                                    SERVICES
                                </p>

                                <h2>
                                    Veterinary services
                                </h2>

                            </div>

                            <span className="clinic-section-count">
                                {services.length}
                            </span>

                        </div>


                        {services.length === 0 ? (

                            <div className="clinic-section-empty">
                                No veterinary services are
                                registered yet.
                            </div>

                        ) : (

                            <div className="clinic-services-list">

                                {services.map((service) => (

                                    <article
                                        key={service.id}
                                        className="clinic-service-card"
                                    >

                                        <div className="service-number">
                                            {String(
                                                service.id
                                            ).padStart(2, '0')}
                                        </div>


                                        <div className="service-content">

                                            <h3>
                                                {service.serviceName}
                                            </h3>

                                            <p>
                                                {service.description ||
                                                    'Veterinary service'}
                                            </p>

                                        </div>


                                        <div className="service-details">

                                            <div>
                                                <span>
                                                    Duration
                                                </span>

                                                <strong>
                                                    {service.duration} min
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    Price
                                                </span>

                                                <strong>
                                                    {Number(
                                                        service.price
                                                    ).toFixed(2)} RON
                                                </strong>
                                            </div>

                                        </div>

                                    </article>

                                ))}

                            </div>
                        )}

                    </section>

                </div>

            </main>
        </>
    );
}