import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import Navbar from '../../shared/components/Navbar';
import { askChatbot } from '../../features/chatbot/services/chatbotService';

import './ChatbotPage.css';


const suggestedQuestions = [
    'My cat is not eating. What should I watch for?',
    'My dog has vomited twice today. What should I do?',
    'What vaccines does a puppy usually need?',
    'When should scratching in a pet become concerning?'
];


export default function ChatbotPage() {

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const messagesEndRef = useRef(null);


    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });

    }, [messages, loading]);


    const sendMessage = async (messageText = input) => {

        const text = messageText.trim();

        if (!text || loading) {
            return;
        }


        const userMessage = {
            role: 'user',
            content: text
        };


        const updatedMessages = [
            ...messages,
            userMessage
        ];


        setMessages(updatedMessages);
        setInput('');
        setError(null);
        setLoading(true);


        try {

            const answer =
                await askChatbot(updatedMessages);


            const assistantMessage = {
                role: 'assistant',
                content: answer
            };


            setMessages([
                ...updatedMessages,
                assistantMessage
            ]);

        } catch (err) {

            console.error(
                'Chatbot error:',
                err
            );


            if (err.response?.status === 403) {

                setError(
                    'The AI assistant is available only for pet owner accounts.'
                );

            } else {

                setError(
                    err.message ||
                    'The AI assistant is currently unavailable.'
                );

            }

        } finally {

            setLoading(false);

        }
    };


    const handleSubmit = (event) => {

        event.preventDefault();

        sendMessage();
    };


    const handleKeyDown = (event) => {

        if (
            event.key === 'Enter' &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    };


    const handleNewChat = () => {

        setMessages([]);
        setInput('');
        setError(null);
    };


    return (
        <>
            <Navbar />

            <main className="chatbot-page">

                <div className="chatbot-container">


                    {/* HEADER */}

                    <section className="chatbot-header">

                        <div>

                            <p className="chatbot-eyebrow">
                                VETERINARY AI ASSISTANT
                            </p>

                            <h1>
                                Ask VETApp AI
                            </h1>

                            <p className="chatbot-subtitle">
                                Get general information about your pet's
                                health, symptoms and veterinary care.
                            </p>

                        </div>


                        {messages.length > 0 && (

                            <button
                                type="button"
                                className="chatbot-new-chat"
                                onClick={handleNewChat}
                                disabled={loading}
                            >
                                + New chat
                            </button>

                        )}

                    </section>


                    <section className="chatbot-layout">


                        {/* LEFT INFORMATION PANEL */}

                        <aside className="chatbot-info-panel">

                            <div className="chatbot-ai-icon">
                                +
                            </div>

                            <h2>
                                VETApp AI
                            </h2>

                            <p>
                                An AI assistant designed to provide
                                general veterinary information for
                                pet owners.
                            </p>


                            <div className="chatbot-info-divider" />


                            <div className="chatbot-info-item">

                                <span className="chatbot-info-number">
                                    01
                                </span>

                                <div>
                                    <strong>
                                        Describe the problem
                                    </strong>

                                    <p>
                                        Include symptoms, duration,
                                        age and species when possible.
                                    </p>
                                </div>

                            </div>


                            <div className="chatbot-info-item">

                                <span className="chatbot-info-number">
                                    02
                                </span>

                                <div>
                                    <strong>
                                        Ask follow-up questions
                                    </strong>

                                    <p>
                                        The assistant remembers the
                                        current conversation.
                                    </p>
                                </div>

                            </div>


                            <div className="chatbot-info-item">

                                <span className="chatbot-info-number">
                                    03
                                </span>

                                <div>
                                    <strong>
                                        Contact a veterinarian
                                    </strong>

                                    <p>
                                        AI information does not replace
                                        a veterinary examination.
                                    </p>
                                </div>

                            </div>


                            <div className="chatbot-warning">

                                <strong>
                                    Emergency?
                                </strong>

                                <p>
                                    For severe breathing difficulty,
                                    poisoning, seizures, major bleeding
                                    or rapid deterioration, contact a
                                    veterinarian immediately.
                                </p>

                            </div>

                        </aside>


                        {/* CHAT */}

                        <section className="chatbot-chat-card">


                            <div className="chatbot-chat-topbar">

                                <div className="chatbot-status">

                                    <span className="chatbot-status-dot" />

                                    <div>

                                        <strong>
                                            VETApp AI Assistant
                                        </strong>

                                        <span>
                                            Online
                                        </span>

                                    </div>

                                </div>

                                <span className="chatbot-ai-label">
                                    AI
                                </span>

                            </div>


                            {/* MESSAGES */}

                            <div className="chatbot-messages">


                                {messages.length === 0 && (

                                    <div className="chatbot-welcome">

                                        <div className="chatbot-welcome-icon">
                                            +
                                        </div>

                                        <h2>
                                            How can I help your pet today?
                                        </h2>

                                        <p>
                                            Describe what is happening
                                            and I will provide general
                                            veterinary information.
                                        </p>


                                        <div className="chatbot-suggestions">

                                            {suggestedQuestions.map(
                                                (question) => (

                                                    <button
                                                        key={question}
                                                        type="button"
                                                        onClick={() =>
                                                            sendMessage(
                                                                question
                                                            )
                                                        }
                                                        disabled={loading}
                                                    >
                                                        {question}

                                                        <span>
                                                            →
                                                        </span>
                                                    </button>

                                                )
                                            )}

                                        </div>

                                    </div>

                                )}


                                {messages.map(
                                    (message, index) => (

                                        <div
                                            key={index}
                                            className={
                                                message.role === 'user'
                                                    ? 'chatbot-message chatbot-message-user'
                                                    : 'chatbot-message chatbot-message-assistant'
                                            }
                                        >

                                            <div className="chatbot-message-avatar">

                                                {message.role === 'user'
                                                    ? 'You'
                                                    : '+'}

                                            </div>


                                            <div className="chatbot-message-content">

                                                <span className="chatbot-message-author">

                                                    {message.role === 'user'
                                                        ? 'You'
                                                        : 'VETApp AI'}

                                                </span>


                                                <div className="chatbot-message-bubble">

                                                    {message.role === 'assistant'
                                                        ? (
                                                            <ReactMarkdown>
                                                                {message.content}
                                                            </ReactMarkdown>
                                                        )
                                                        : (
                                                            <p>
                                                                {message.content}
                                                            </p>
                                                        )
                                                    }

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}


                                {/* LOADING */}

                                {loading && (

                                    <div className="
                                        chatbot-message
                                        chatbot-message-assistant
                                    ">

                                        <div className="chatbot-message-avatar">
                                            +
                                        </div>

                                        <div className="chatbot-message-content">

                                            <span className="chatbot-message-author">
                                                VETApp AI
                                            </span>

                                            <div className="
                                                chatbot-message-bubble
                                                chatbot-thinking
                                            ">

                                                <span />
                                                <span />
                                                <span />

                                            </div>

                                        </div>

                                    </div>

                                )}


                                {error && (

                                    <div className="chatbot-error">
                                        {error}
                                    </div>

                                )}


                                <div ref={messagesEndRef} />

                            </div>


                            {/* INPUT */}

                            <form
                                className="chatbot-input-area"
                                onSubmit={handleSubmit}
                            >

                                <div className="chatbot-textarea-wrapper">

                                    <textarea
                                        value={input}
                                        onChange={(event) =>
                                            setInput(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask something about your pet..."
                                        rows={1}
                                        maxLength={4000}
                                        disabled={loading}
                                    />

                                    <span className="chatbot-character-count">
                                        {input.length}/4000
                                    </span>

                                </div>


                                <button
                                    type="submit"
                                    className="chatbot-send-button"
                                    disabled={
                                        loading ||
                                        !input.trim()
                                    }
                                >
                                    {loading
                                        ? 'Thinking...'
                                        : 'Send'
                                    }

                                    {!loading && (
                                        <span>
                                            →
                                        </span>
                                    )}
                                </button>

                            </form>


                            <div className="chatbot-disclaimer">

                                VETApp AI can make mistakes.
                                Information provided by the assistant
                                does not replace professional
                                veterinary diagnosis or treatment.

                            </div>

                        </section>

                    </section>

                </div>

            </main>
        </>
    );
}