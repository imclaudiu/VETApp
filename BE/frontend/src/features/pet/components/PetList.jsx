import { Link } from 'react-router-dom';

export default function PetList({ pets }) {
    const getSex = (sex) => sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : 'Unknown';

    const getAge = (dob) => {
        if (!dob) return 'Age unknown';
        const birth = new Date(dob);
        const today = new Date();
        let years = today.getFullYear() - birth.getFullYear();
        if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) years--;
        return years < 1 ? 'Under 1 year' : `${years} ${years === 1 ? 'year' : 'years'} old`;
    };

    if (!pets.length) {
        return (
            <div className="pets-empty">
                <div className="pets-empty-mark">+</div>
                <h2>Add your first pet</h2>
                <p>Your pets will appear here together with their details and medical history.</p>
                <Link to="/pets/new" className="primary-button">Add pet</Link>
            </div>
        );
    }

    return (
        <>
            <div className="pets-count">{pets.length} {pets.length === 1 ? 'pet' : 'pets'} registered</div>

            <div className="pets-list">
                {pets.map(pet => (
                    <article className="pet-row" key={pet.id}>
                        <div className="pet-row-avatar">{pet.name?.charAt(0)?.toUpperCase() || 'P'}</div>

                        <div className="pet-row-main">
                            <div className="pet-row-heading">
                                <div>
                                    <h2>{pet.name}</h2>
                                    <p>{pet.race || pet.species}</p>
                                </div>

                                <Link to={`/pets/${pet.id}/medical-history`} className="pet-history-link">
                                    Medical history →
                                </Link>
                            </div>

                            <div className="pet-row-details">
                                <div>
                                    <span>Species</span>
                                    <strong>{pet.species || '—'}</strong>
                                </div>

                                <div>
                                    <span>Sex</span>
                                    <strong>{getSex(pet.sex)}</strong>
                                </div>

                                <div>
                                    <span>Age</span>
                                    <strong>{getAge(pet.dob)}</strong>
                                </div>

                                <div>
                                    <span>Date of birth</span>
                                    <strong>{pet.dob ? new Date(pet.dob).toLocaleDateString('en-GB') : '—'}</strong>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}

                <Link to="/pets/new" className="pets-add-row">
                    <span>+</span>
                    <div>
                        <strong>Add another pet</strong>
                        <p>Register another companion in your account.</p>
                    </div>
                </Link>
            </div>
        </>
    );
}