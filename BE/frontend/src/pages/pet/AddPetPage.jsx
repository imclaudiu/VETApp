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

    const parseDob = (dob) => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return null;

        const [day, month, year] = dob.split('/').map(Number);
        const date = new Date(year, month - 1, day);

        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        if (date > new Date()) return null;

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const handleSubmit = async (formData) => {
        const backendDob = parseDob(formData.dob);

        if (!backendDob) {
            setError('Please enter a valid date of birth in DD/MM/YYYY format.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await addPet({
                ...formData,
                dob: backendDob,
                ownerID: user.userId
            });

            navigate('/pets');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Could not add pet.');
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
                        <Link to="/pets">← Back to pets</Link>
                    </div>

                    <header className="pet-editor-header">
                        <span>NEW PET</span>
                        <h1>Add a pet</h1>
                        <p>Add your pet's details to start managing appointments and medical history.</p>
                    </header>

                    <div className="pet-editor-form">
                        <PetForm
                            onSubmit={handleSubmit}
                            loading={loading}
                            error={error}
                            submitLabel="Add pet"
                        />
                    </div>

                </div>
            </main>
        </>
    );
}