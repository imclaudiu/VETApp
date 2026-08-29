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
    const textareaRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (!textareaRef.current) return;

        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }, [input]);

    const sendMessage = async (messageText = input) => {
        const text = messageText.trim();

        if (!text || loading) return;

        const userMessage = {
            role: 'user',
            content: text
        };

        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setError(null);
        setLoading(true);

        try {
            const answer = await askChatbot(updatedMessages);

            setMessages([
                ...updatedMessages,
                {
                    role: 'assistant',
                    content: answer
                }
            ]);
        } catch (err) {
            console.error('Chatbot error:', err);

            if (err.response?.status === 403) {
                setError('The AI assistant is available only for pet owner accounts.');
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'The AI assistant is currently unavailable.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = e => {
        e.preventDefault();
        sendMessage();
    };

    const handleKeyDown = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleNewChat = () => {
        if (loading) return;

        setMessages([]);
        setInput('');
        setError(null);
    };

    return (
        <>
            <Navbar />

            <main className="ai-page">
                <div className="ai-container">

                    <header className="ai-page-header">
                        <div>
                            <span>VETAPP AI</span>
                            <h1>AI Assistant</h1>
                            <p>Ask general questions about your pet's health and veterinary care.</p>
                        </div>

                        {messages.length > 0 && (
                            <button
                                type="button"
                                className="ai-new-chat"
                                onClick={handleNewChat}
                                disabled={loading}
                            >
                                New conversation
                            </button>
                        )}
                    </header>

                    <div className="ai-notice">
                        <div className="ai-notice-mark">i</div>

                        <div>
                            <strong>General veterinary guidance only</strong>
                            <p>
                                VETApp AI does not replace a veterinary examination.
                                For emergencies or severe symptoms, contact a veterinarian immediately.
                            </p>
                        </div>
                    </div>

                    <section className="ai-chat">

                        <div className="ai-chat-header">
                            <div className="ai-chat-identity">
                                <div className="ai-avatar">AI</div>

                                <div>
                                    <strong>VETA Assistant</strong>
                                    <span>
                                        <i />
                                        Available
                                    </span>
                                </div>
                            </div>

                            <span className="ai-chat-label">Veterinary AI</span>
                        </div>

                        <div className="ai-messages">

                            {messages.length === 0 && !loading && (
                                <div className="ai-welcome">
                                    <div className="ai-welcome-avatar">AI</div>

                                    <h2>Hello! I am VETA, how can I help?</h2>

                                    <p>
                                        Tell me what's happening with your pet.
                                        Including species, age, symptoms and how long they have been present can help me give a more useful answer.
                                    </p>

                                    <div className="ai-suggestions">
                                        {suggestedQuestions.map(question => (
                                            <button
                                                type="button"
                                                key={question}
                                                onClick={() => sendMessage(question)}
                                            >
                                                <span>{question}</span>
                                                <b>→</b>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`ai-message ${message.role === 'user'
                                        ? 'ai-message-user'
                                        : 'ai-message-assistant'
                                        }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="ai-message-avatar">AI</div>
                                    )}

                                    <div className="ai-message-body">
                                        <span className="ai-message-author">
                                            {message.role === 'user'
                                                ? 'You'
                                                : 'VETA'}
                                        </span>

                                        <div className="ai-message-bubble">
                                            {message.role === 'assistant' ? (
                                                <ReactMarkdown>
                                                    {message.content}
                                                </ReactMarkdown>
                                            ) : (
                                                <p>{message.content}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="ai-message ai-message-assistant">
                                    <div className="ai-message-avatar">AI</div>

                                    <div className="ai-message-body">
                                        <span className="ai-message-author">
                                            VETApp AI
                                        </span>

                                        <div className="ai-message-bubble ai-thinking">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="ai-error">
                                    <strong>Something went wrong</strong>
                                    <p>{error}</p>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="ai-composer">
                            <form onSubmit={handleSubmit}>
                                <div className="ai-input-wrapper">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask something about your pet..."
                                        rows={1}
                                        maxLength={4000}
                                        disabled={loading}
                                    />

                                    <span className="ai-character-count">
                                        {input.length}/4000
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    className="ai-send-button"
                                    disabled={loading || !input.trim()}
                                >
                                    {loading ? 'Thinking...' : 'Send'}
                                </button>
                            </form>

                            <p className="ai-input-hint">
                                Press Enter to send · Shift + Enter for a new line
                            </p>
                        </div>

                    </section>

                    <p className="ai-footer-disclaimer">
                        AI responses may contain mistakes. Always consult a veterinarian for diagnosis and treatment decisions.
                    </p>

                </div>
            </main>
        </>
    );
}