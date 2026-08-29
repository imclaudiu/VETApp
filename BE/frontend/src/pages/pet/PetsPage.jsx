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
                            <span className="pets-page-eyebrow">MY PETS</span>
                            <h1>Your pets</h1>
                            <p>View your pets and access their veterinary history.</p>
                        </div>

                        <Link to="/pets/new" className="primary-button">Add pet</Link>
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