import { useEffect, useState } from 'react';
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
                const veterinarian = await getMyVeterinarian();

                const appointments =
                    await getAppointmentsByVeterinarian(
                        veterinarian.id
                    );

                const currentAppointment =
                    appointments.find(
                        item =>
                            item.id === appointmentId &&
                            item.petId === petId
                    );

                if (!currentAppointment) {
                    throw new Error(
                        'Appointment not found.'
                    );
                }

                const history =
                    await getMedicalRecordsForVeterinarian(
                        petId,
                        appointmentId
                    );

                const detailed =
                    await Promise.all(
                        history.map(async record => {

                            const [
                                clinic,
                                vet,
                                service
                            ] = await Promise.all([
                                getClinicById(record.clinicId)
                                    .catch(() => null),

                                getVeterinarianById(
                                    record.veterinarianId
                                ).catch(() => null),

                                getServiceById(
                                    record.vetServiceId
                                ).catch(() => null)
                            ]);

                            return {
                                ...record,
                                clinic,
                                vet,
                                service
                            };
                        })
                    );

                setAppointment(currentAppointment);
                setRecords(detailed);

            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load medical history.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadHistory();

    }, [petId, appointmentId]);


    const formatDate = date => {
        return new Intl.DateTimeFormat(
            'en-GB',
            {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        ).format(new Date(date));
    };


    if (loading) {
        return (
            <>
                <Navbar />
                <div className="vet-history-loading">
                    Loading medical history...
                </div>
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

                    <section className="vet-history-header">

                        <p>PATIENT MEDICAL HISTORY</p>

                        <h1>
                            {appointment?.petName || 'Patient'}
                        </h1>

                        <span>
                            {appointment?.species}

                            {appointment?.race
                                ? ` • ${appointment.race}`
                                : ''
                            }

                            {appointment?.sex
                                ? ` • ${appointment.sex}`
                                : ''
                            }
                        </span>

                    </section>


                    {error && (
                        <div className="vet-history-error">
                            {error}
                        </div>
                    )}


                    {!error && records.length === 0 ? (

                        <div className="vet-history-empty">
                            No previous medical records.
                        </div>

                    ) : (

                        <div className="vet-history-list">

                            {records.map(record => (

                                <article
                                    key={record.id}
                                    className="vet-history-card"
                                >

                                    <div className="vet-history-card-top">

                                        <div>
                                            <span>
                                                {formatDate(
                                                    record.consultationDate
                                                )}
                                            </span>

                                            <h2>
                                                {record.diagnosis ||
                                                    'No diagnosis'}
                                            </h2>
                                        </div>

                                        <strong>
                                            {record.clinic?.name ||
                                                'Unknown clinic'}
                                        </strong>

                                    </div>


                                    <div className="vet-history-meta">

                                        <div>
                                            <span>Veterinarian</span>
                                            <strong>
                                                {record.vet?.name
                                                    ? `Dr. ${record.vet.name}`
                                                    : '—'
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Service</span>
                                            <strong>
                                                {record.service?.serviceName ||
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


                                    {record.symptoms && (
                                        <div className="vet-history-section">
                                            <span>SYMPTOMS</span>
                                            <p>{record.symptoms}</p>
                                        </div>
                                    )}

                                    {record.observations && (
                                        <div className="vet-history-section">
                                            <span>OBSERVATIONS</span>
                                            <p>{record.observations}</p>
                                        </div>
                                    )}

                                </article>

                            ))}

                        </div>
                    )}

                </div>

            </main>
        </>
    );
}