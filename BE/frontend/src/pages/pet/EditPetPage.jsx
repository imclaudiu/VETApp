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


    const handleSubmit = async (formData) => {

        setSaving(true);
        setError(null);

        try {
            await updatePet(id, formData);

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
                        <button
                            type="button"
                            onClick={goBack}
                        >
                            ← Back
                        </button>
                    </div>

                    <section className="pet-editor-header">

                        <div>

                            <p className="pet-editor-eyebrow">
                                EDIT PET
                            </p>

                            <h1>
                                Edit {pet.name}
                            </h1>

                            <p>
                                Update your pet's information below.
                            </p>

                        </div>

                    </section>


                    <div className="pet-editor-layout">

                        <div className="pet-editor-main">

                            <PetForm
                                initialData={pet}
                                onSubmit={handleSubmit}
                                loading={saving}
                                error={error}
                                submitLabel="Save changes"
                            />

                        </div>


                        <aside className="pet-editor-sidebar">

                            <div className="pet-editor-profile-card">

                                <div className="pet-editor-avatar">
                                    {pet.name
                                        ?.charAt(0)
                                        ?.toUpperCase()}
                                </div>

                                <h2>
                                    {pet.name}
                                </h2>

                                <p>
                                    {pet.race || pet.species}
                                </p>


                                <div className="pet-editor-profile-details">

                                    <div>
                                        <span>
                                            Species
                                        </span>

                                        <strong>
                                            {pet.species}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Sex
                                        </span>

                                        <strong>
                                            {pet.sex === 'M'
                                                ? 'Male'
                                                : pet.sex === 'F'
                                                    ? 'Female'
                                                    : pet.sex}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        </aside>

                    </div>

                </div>

            </main>
        </>
    );
}