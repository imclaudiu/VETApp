import api from '../../../shared/services/api';


export const askChatbot = async (messages) => {

    const response = await api.post(
        '/chatbot/ask',
        {
            messages
        }
    );

    return response.data.answer;
};