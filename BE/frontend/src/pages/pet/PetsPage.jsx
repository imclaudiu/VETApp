import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import PetList from '../../features/pet/components/PetList';
import {
    getMyPets
} from '../../features/pet/services/petService';

import './PetsPage.css';

export default function PetsPage() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadPets = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getMyPets();
            setPets(data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Could not load your pets.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPets();
    }, []);


    return (
        <>
            <Navbar />

            <main className="pets-page">
                <div className="pets-page-container">

                    <section className="pets-page-header">

                        <div>
                            <p className="pets-page-eyebrow">
                                MY PETS
                            </p>

                            <h1>Your companions</h1>

                            <p className="pets-page-description">
                                Manage your pets and keep their information
                                up to date.
                            </p>
                        </div>

                        <Link
                            to="/pets/new"
                            className="pets-add-button"
                        >
                            <span>+</span>
                            Add new pet
                        </Link>

                    </section>


                    {error && (
                        <div className="pets-error">
                            <div>
                                <strong>Something went wrong</strong>
                                <p>{error}</p>
                            </div>

                            <button
                                type="button"
                                onClick={loadPets}
                            >
                                Try again
                            </button>
                        </div>
                    )}


                    {loading ? (
                        <div className="pets-loading">
                            <div className="pets-loading-spinner" />

                            <p>Loading your pets...</p>
                        </div>
                    ) : (
                        <PetList
                            pets={pets}
                        />
                    )}

                </div>
            </main>
        </>
    );
}