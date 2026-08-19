import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import { useAuth } from '../../features/auth/contexts/AuthContext';

import PetForm from '../../features/pet/components/PetForm';

import { addPet } from '../../features/pet/services/petService';

import './PetEditorPage.css';

export default function AddPetPage() {

    const { user } = useAuth();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleSubmit = async (formData) => {

        setLoading(true);
        setError(null);

        try {

            await addPet({
                ...formData,
                ownerID: user.userId,
            });

            navigate('/pets');

        } catch (err) {

            setError(
                err.response?.data?.message ||
                err.message ||
                'Could not add pet.'
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <>
            <Navbar />

            <main className="pet-editor-page">

                <div className="pet-editor-container">

                    <div className="pet-editor-back">

                        <Link to="/pets">
                            ← Back to my pets
                        </Link>

                    </div>


                    <section className="pet-editor-header">

                        <div>

                            <p className="pet-editor-eyebrow">
                                NEW PET
                            </p>

                            <h1>
                                Add a new pet
                            </h1>

                            <p>
                                Add your pet's information to start
                                managing their veterinary care.
                            </p>

                        </div>

                    </section>


                    <div className="pet-editor-layout">

                        <div className="pet-editor-main">

                            <PetForm
                                onSubmit={handleSubmit}
                                loading={loading}
                                error={error}
                                submitLabel="Add pet"
                            />

                        </div>


                        <aside className="pet-editor-sidebar">

                            <div className="pet-editor-info-card">

                                <span className="pet-editor-info-number">
                                    VET
                                </span>

                                <h2>
                                    Why add your pet?
                                </h2>

                                <p>
                                    Pet profiles help keep important
                                    veterinary information connected
                                    to the correct animal.
                                </p>


                                <div className="pet-editor-info-list">

                                    <div>
                                        <span>01</span>

                                        <p>
                                            Keep personal information
                                            organized
                                        </p>
                                    </div>

                                    <div>
                                        <span>02</span>

                                        <p>
                                            Connect future appointments
                                        </p>
                                    </div>

                                    <div>
                                        <span>03</span>

                                        <p>
                                            Access medical history
                                        </p>
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