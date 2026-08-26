import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { getPetById } from '../../features/pet/services/petService';
import { getMedicalRecordsByPet } from '../../features/medicalRecord/services/medicalRecordService';
import {
    getClinicById,
    getVeterinarianById,
    getServiceById
} from '../../features/clinic/services/clinicService';

import './PetMedicalHistoryPage.css';


export default function PetMedicalHistoryPage() {

    const { id } = useParams();

    const [pet, setPet] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        const loadHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const [petData, medicalRecords] = await Promise.all([
                    getPetById(id),
                    getMedicalRecordsByPet(id)
                ]);

                const detailedRecords = await Promise.all(
                    medicalRecords.map(async record => {

                        const [clinic, veterinarian, service] = await Promise.all([
                            getClinicById(record.clinicId).catch(() => null),
                            getVeterinarianById(record.veterinarianId).catch(() => null),
                            getServiceById(record.vetServiceId).catch(() => null)
                        ]);

                        return {
                            ...record,
                            clinic,
                            veterinarian,
                            service
                        };
                    })
                );

                setPet(petData);
                setRecords(detailedRecords);

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

    }, [id]);


    const formatDate = date => {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date(date));
    };


    if (loading) {
        return (
            <>
                <Navbar />
                <div className="medical-history-loading">
                    Loading medical history...
                </div>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="medical-history-page">

                <div className="medical-history-container">

                    <Link
                        to="/pets"
                        className="medical-history-back"
                    >
                        ← Back to my pets
                    </Link>


                    <section className="medical-history-header">

                        <div>
                            <p className="medical-history-eyebrow">
                                MEDICAL RECORD
                            </p>

                            <h1>
                                {pet?.name}'s medical history
                            </h1>

                            <p>
                                {pet?.species}
                                {pet?.race ? ` • ${pet.race}` : ''}
                            </p>
                        </div>

                        <div className="medical-history-count">
                            <strong>{records.length}</strong>
                            <span>
                                {records.length === 1 ? 'record' : 'records'}
                            </span>
                        </div>

                    </section>


                    {error && (
                        <div className="medical-history-error">
                            {error}
                        </div>
                    )}


                    {!error && records.length === 0 ? (

                        <section className="medical-history-empty">
                            <div>+</div>

                            <h2>No medical records yet</h2>

                            <p>
                                Medical records created after veterinary
                                consultations will appear here.
                            </p>
                        </section>

                    ) : (

                        <div className="medical-history-list">

                            {records.map(record => (

                                <article
                                    key={record.id}
                                    className="medical-record-card"
                                >

                                    <div className="medical-record-top">

                                        <div>
                                            <span className="medical-record-date">
                                                {formatDate(record.consultationDate)}
                                            </span>

                                            <h2>
                                                {record.diagnosis || 'No diagnosis specified'}
                                            </h2>
                                        </div>

                                        <div className="medical-record-clinic">
                                            <span>CLINIC</span>
                                            <strong>
                                                {record.clinic?.name || 'Unknown clinic'}
                                            </strong>
                                        </div>

                                    </div>


                                    <div className="medical-record-meta">

                                        <div>
                                            <span>Veterinarian</span>
                                            <strong>
                                                {record.veterinarian?.name
                                                    ? `Dr. ${record.veterinarian.name}`
                                                    : 'Unknown veterinarian'}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Service</span>
                                            <strong>
                                                {record.service?.serviceName || '—'}
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
                                        <div className="medical-record-section">
                                            <span>SYMPTOMS</span>
                                            <p>{record.symptoms}</p>
                                        </div>
                                    )}


                                    {record.observations && (
                                        <div className="medical-record-section">
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