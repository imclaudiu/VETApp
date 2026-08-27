import { Link } from 'react-router-dom';

export default function PetList({ pets }) {

    const getPetInitial = (name) => {
        return name?.charAt(0)?.toUpperCase() || 'P';
    };

    const getSexLabel = (sex) => {
        if (sex === 'M') {
            return 'Male';
        }

        if (sex === 'F') {
            return 'Female';
        }

        return sex || 'Unknown';
    };

    const formatDate = (dob) => {
        if (!dob) {
            return 'Unknown';
        }

        const datePart = dob.split('T')[0];

        const [year, month, day] = datePart.split('-');

        if (!year || !month || !day) {
            return dob;
        }

        return `${day}.${month}.${year}`;
    };

    const getAge = (dob) => {
        if (!dob) {
            return null;
        }

        const datePart = dob.split('T')[0];
        const parts = datePart.split('-');

        if (parts.length !== 3) {
            return null;
        }

        const birthYear = Number(parts[0]);
        const birthMonth = Number(parts[1]);
        const birthDay = Number(parts[2]);

        const today = new Date();

        let age = today.getFullYear() - birthYear;

        const monthDifference =
            today.getMonth() + 1 - birthMonth;

        if (
            monthDifference < 0 ||
            (
                monthDifference === 0 &&
                today.getDate() < birthDay
            )
        ) {
            age--;
        }

        if (age < 1) {
            return 'Under 1 year';
        }

        return `${age} ${age === 1 ? 'year' : 'years'} old`;
    };


    if (pets.length === 0) {
        return (
            <section className="pets-empty">

                <div className="pets-empty-icon">
                    +
                </div>

                <h2>No pets yet</h2>

                <p>
                    Add your first pet to start managing their
                    information, appointments and medical history.
                </p>

                <Link
                    to="/pets/new"
                    className="pets-empty-button"
                >
                    Add your first pet
                </Link>

            </section>
        );
    }


    return (
        <>
            <div className="pets-summary">
                <span>
                    {pets.length}
                    {' '}
                    {pets.length === 1 ? 'pet' : 'pets'}
                </span>
            </div>

            <div className="pets-grid">

                {pets.map((pet) => {

                    const age = getAge(pet.dob);

                    return (
                        <article
                            key={pet.id}
                            className="pet-card"
                        >

                            <div className="pet-card-top">

                                <div className="pet-card-avatar">
                                    {getPetInitial(pet.name)}
                                </div>

                                <div className="pet-card-title">
                                    <h2>
                                        {pet.name}
                                    </h2>

                                    <p>
                                        {pet.race || 'No breed specified'}
                                    </p>
                                </div>

                            </div>


                            <div className="pet-card-tags">

                                <span>
                                    {pet.species}
                                </span>

                                <span>
                                    {getSexLabel(pet.sex)}
                                </span>

                                {age && (
                                    <span>
                                        {age}
                                    </span>
                                )}

                            </div>


                            <div className="pet-card-information">

                                <div className="pet-information-row">
                                    <span className="pet-information-label">
                                        Species
                                    </span>

                                    <strong>
                                        {pet.species}
                                    </strong>
                                </div>

                                <div className="pet-information-row">
                                    <span className="pet-information-label">
                                        Breed
                                    </span>

                                    <strong>
                                        {pet.race || '—'}
                                    </strong>
                                </div>

                                <div className="pet-information-row">
                                    <span className="pet-information-label">
                                        Date of birth
                                    </span>

                                    <strong>
                                        {formatDate(pet.dob)}
                                    </strong>
                                </div>

                                <div className="pet-information-row">
                                    <span className="pet-information-label">
                                        Sex
                                    </span>

                                    <strong>
                                        {getSexLabel(pet.sex)}
                                    </strong>
                                </div>

                            </div>


                            <div className="pet-card-readonly">
                                Pet information can only be changed by a veterinarian.
                            </div>

                        </article>
                    );
                })}


                <Link
                    to="/pets/new"
                    className="pet-add-card"
                >
                    <div className="pet-add-icon">
                        +
                    </div>

                    <h3>Add another pet</h3>

                    <p>
                        Register a new companion in your account.
                    </p>
                </Link>

            </div>
        </>
    );
}