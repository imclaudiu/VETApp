import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import ClinicMap from '../../features/clinic/components/ClinicMap';
import { useAuth } from '../../features/auth/contexts/AuthContext';

import {
    getClinicById,
    getVeterinariansByClinic,
    getServicesByClinic
} from '../../features/clinic/services/clinicService';

import './ClinicDetailsPage.css';

export default function ClinicDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();

    const [clinic, setClinic] = useState(null);
    const [veterinarians, setVeterinarians] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const canBook = user?.role === 'OWNER';

    useEffect(() => {
        const loadClinic = async () => {
            setLoading(true);
            setError(null);

            try {
                const [clinicData, veterinariansData, servicesData] = await Promise.all([
                    getClinicById(id),
                    getVeterinariansByClinic(id),
                    getServicesByClinic(id)
                ]);

                setClinic(clinicData);
                setVeterinarians(Array.isArray(veterinariansData) ? veterinariansData : []);
                setServices(Array.isArray(servicesData) ? servicesData : []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Could not load clinic.');
            } finally {
                setLoading(false);
            }
        };

        loadClinic();
    }, [id]);

    const getRating = () => {
        const rating = Number(clinic?.rating);
        return Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : 'No rating';
    };

    const getDirectionsUrl = () => {
        if (clinic.googlePlaceId && !clinic.googlePlaceId.startsWith('seed_')) {
            return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                clinic.address || clinic.name
            )}&destination_place_id=${encodeURIComponent(clinic.googlePlaceId)}`;
        }

        return `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="clinic-details-page">
                    <div className="clinic-details-loading">
                        <div className="clinic-details-spinner" />
                        <p>Loading clinic...</p>
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
                            <h2>Clinic could not be loaded</h2>
                            <p>{error || 'The requested clinic does not exist.'}</p>
                            <Link to="/clinics" className="primary-button">Back to clinics</Link>
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
                        <Link to="/clinics">← Back to clinics</Link>
                    </div>

                    <section className="clinic-overview">
                        <div className="clinic-overview-info">
                            <span className="clinic-eyebrow">VETERINARY CLINIC</span>

                            <h1>{clinic.name}</h1>

                            <p className="clinic-address">
                                {clinic.address}
                                {clinic.city && `, ${clinic.city}`}
                            </p>

                            {clinic.description && (
                                <p className="clinic-description">{clinic.description}</p>
                            )}

                            <div className="clinic-info-grid">
                                <div>
                                    <span>Rating</span>
                                    <strong className="clinic-rating-value">
                                        <b>★</b> {getRating()}
                                    </strong>
                                </div>

                                <div>
                                    <span>Phone</span>
                                    <strong>{clinic.phone || 'Not available'}</strong>
                                </div>

                                <div>
                                    <span>City</span>
                                    <strong>{clinic.city || 'Not available'}</strong>
                                </div>
                            </div>

                            <div className="clinic-overview-actions">
                                {clinic.latitude != null && clinic.longitude != null && (
                                    <a
                                        href={getDirectionsUrl()}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="secondary-button"
                                    >
                                        Get directions
                                    </a>
                                )}

                                {canBook && (
                                    <Link
                                        to={`/appointments/new?clinicId=${clinic.id}`}
                                        className="primary-button"
                                    >
                                        Book appointment
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="clinic-overview-map">
                            {clinic.latitude != null && clinic.longitude != null ? (
                                <ClinicMap clinic={clinic} />
                            ) : (
                                <div className="clinic-map-unavailable">
                                    <strong>Location unavailable</strong>
                                    <p>This clinic does not have map coordinates yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="clinic-detail-section">
                        <div className="clinic-section-header">
                            <div>
                                <span>OUR TEAM</span>
                                <h2>Veterinarians</h2>
                            </div>

                            <p>
                                {veterinarians.length} {veterinarians.length === 1 ? 'veterinarian' : 'veterinarians'}
                            </p>
                        </div>

                        {veterinarians.length === 0 ? (
                            <div className="clinic-section-empty">
                                <h3>No veterinarians yet</h3>
                                <p>No veterinarians are currently registered for this clinic.</p>
                            </div>
                        ) : (
                            <div className="veterinarians-grid">
                                {veterinarians.map(vet => (
                                    <article className="veterinarian-card" key={vet.id}>
                                        <Link
                                            to={`/veterinarians/${vet.id}`}
                                            className="veterinarian-profile"
                                        >
                                            <div className="veterinarian-avatar">
                                                {vet.name?.charAt(0)?.toUpperCase() || 'V'}
                                            </div>

                                            <div className="veterinarian-info">
                                                <div className="veterinarian-name">
                                                    <h3>
                                                        {vet.name
                                                            ? `Dr. ${vet.name}`
                                                            : 'Veterinarian'}
                                                    </h3>

                                                    {vet.surgeon && (
                                                        <span>Surgeon</span>
                                                    )}
                                                </div>

                                                <p>Veterinarian at {clinic.name}</p>
                                            </div>
                                        </Link>

                                        {canBook && (
                                            <Link
                                                to={`/appointments/new?clinicId=${clinic.id}&veterinarianId=${vet.id}`}
                                                className="vet-book-button"
                                            >
                                                Book with this veterinarian
                                            </Link>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="clinic-detail-section">
                        <div className="clinic-section-header">
                            <div>
                                <span>SERVICES</span>
                                <h2>Veterinary services</h2>
                            </div>

                            <p>
                                {services.length} {services.length === 1 ? 'service' : 'services'}
                            </p>
                        </div>

                        {services.length === 0 ? (
                            <div className="clinic-section-empty">
                                <h3>No services yet</h3>
                                <p>No veterinary services are currently registered for this clinic.</p>
                            </div>
                        ) : (
                            <div className="clinic-services-list">
                                {services.map(service => (
                                    <article className="clinic-service-card" key={service.id}>
                                        <div className="service-content">
                                            <h3>{service.serviceName}</h3>
                                            <p>{service.description || 'Veterinary service'}</p>
                                        </div>

                                        <div className="service-details">
                                            <div>
                                                <span>Duration</span>
                                                <strong>{service.duration} min</strong>
                                            </div>

                                            <div>
                                                <span>Price</span>
                                                <strong>
                                                    {Number(service.price || 0).toFixed(2)} RON
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