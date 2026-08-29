import { useEffect, useState } from 'react';
import {
    Link,
    useNavigate,
    useParams
} from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import PetForm from '../../features/pet/components/PetForm';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import {
    getPetById,
    updatePet
} from '../../features/pet/services/petService';

import './PetEditorPage.css';

export default function EditPetPage() {

    const { id } = useParams();

    const navigate = useNavigate();

    const { user } = useAuth();

    const goBack = () => {
        if (user?.role === 'VETERINARIAN') {
            navigate('/veterinarian/appointments');
        } else {
            navigate('/admin');
        }
    };

    const [pet, setPet] = useState(null);

    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState(null);


    useEffect(() => {

        const loadPet = async () => {

            setPageLoading(true);
            setError(null);

            try {

                const data = await getPetById(id);

                setPet(data);

            } catch (err) {

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load this pet.'
                );

            } finally {

                setPageLoading(false);

            }
        };


        loadPet();

    }, [id]);

    const parseDob = (dob) => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return null;

        const [day, month, year] = dob.split('/').map(Number);
        const date = new Date(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day ||
            date > new Date()
        ) return null;

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const handleSubmit = async (formData) => {
        const backendDob = parseDob(formData.dob);

        if (!backendDob) {
            setError('Please enter a valid date of birth in DD/MM/YYYY format.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await updatePet(id, {
                ...formData,
                dob: backendDob
            });

            goBack();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Could not update this pet.'
            );
        } finally {
            setSaving(false);
        }
    };


    if (pageLoading) {
        return (
            <>
                <Navbar />

                <main className="pet-editor-page">

                    <div className="pet-editor-loading">

                        <div className="pet-editor-spinner" />

                        <p>
                            Loading pet...
                        </p>

                    </div>

                </main>
            </>
        );
    }


    if (!pet) {
        return (
            <>
                <Navbar />

                <main className="pet-editor-page">

                    <div className="pet-editor-container">

                        <div className="pet-editor-load-error">

                            <h2>
                                Pet could not be loaded
                            </h2>

                            <p>
                                {error ||
                                    'The requested pet does not exist.'}
                            </p>

                            <button
                                type="button"
                                onClick={goBack}
                                className="pet-editor-back-button"
                            >
                                Back
                            </button>

                        </div>

                    </div>

                </main>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="pet-editor-page">
                <div className="pet-editor-container">

                    <div className="pet-editor-back">
                        <button type="button" onClick={goBack}>← Back</button>
                    </div>

                    <header className="pet-editor-header">
                        <span>EDIT PET</span>
                        <h1>Edit {pet.name}</h1>
                        <p>Update the information stored for this pet.</p>
                    </header>

                    <div className="pet-editor-form">
                        <PetForm
                            initialData={pet}
                            onSubmit={handleSubmit}
                            onCancel={goBack}
                            loading={saving}
                            error={error}
                            submitLabel="Save changes"
                        />
                    </div>

                </div>
            </main>
        </>
    );
}