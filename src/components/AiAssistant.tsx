
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import { CloseIcon, AiIcon } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface AiAssistantProps {
    onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onClose }) => {
    const { user, projects, clients, events, contentEntries } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSessionRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const initialSystemInstruction = useMemo(() => {
        if (!user) return '';

        const isAdmin = user.category.includes('Admin');

        const userProjectsData = isAdmin ? projects : projects.filter(p => p.ownerId === user.id || p.team.some(m => m.id === user.id));
        const userProjects = userProjectsData.map(p => ({
                name: p.name,
                description: p.description,
                status: p.status,
                deadline: p.deadline?.toLocaleDateString(),
                tasks_total: p.tasks.length,
                tasks_completed: p.tasks.filter(t => t.completed).length,
            }));

        const userClientsData = isAdmin ? clients : clients.filter(c => c.ownerId === user.id);
        const userClients = userClientsData.map(c => ({
                name: c.name,
                contact: c.contactPerson,
                status: c.status,
            }));
        
        const now = new Date();
        const userEventsData = isAdmin ? events : events.filter(e => e.ownerId === user.id);
        const upcomingEvents = userEventsData
            .filter(e => e.start >= now)
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .slice(0, 5)
            .map(e => ({
                title: e.title,
                type: e.type,
                startTime: e.start.toLocaleString(),
            }));

        const userContentData = isAdmin ? contentEntries : contentEntries.filter(c => c.ownerId === user.id);
        const upcomingContent = userContentData
            .filter(c => c.publishDate >= now)
            .sort((a,b) => a.publishDate.getTime() - b.publishDate.getTime())
            .slice(0, 5)
            .map(c => ({
                title: c.title,
                status: c.status,
                publishDate: c.publishDate.toLocaleDateString(),
                platforms: c.platformInfo.map(pi => pi.platform).join(', '),
            }));

        const accountData = {
            projects: userProjects,
            clients: userClients,
            upcomingEvents,
            upcomingContent,
        };

        const baseInstruction = `You are Kazi, a friendly and helpful AI assistant for the Kazi Flow productivity app. Your purpose is to assist users by answering questions about their account, their work, and providing general knowledge. Be concise and professional. When asked about data, present it in a clear, user-friendly way.

        Here is the current user's account information:
        - Name: ${user.name}
        - Email: ${user.email}
        - Role: ${user.category}
        - Productivity Score: ${user.productivityScore}`;
        
        const dataInstruction = `Here is a summary of the user's current activity and data in JSON format. Use this to answer specific questions about their work. Do not just recite the JSON; interpret it and answer questions naturally. If the user asks for a list (e.g., "list my projects"), format it as a readable list.
${JSON.stringify(accountData, null, 2)}`;

        return `${baseInstruction}\n\n${dataInstruction}`;
    }, [user, projects, clients, events, contentEntries]);

    const initializeChat = useCallback(() => {
        if (initialSystemInstruction && !chatSessionRef.current && user) {
             chatSessionRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: initialSystemInstruction
                }
            });
            const welcomeText = user.category.includes('Admin')
                ? `Hello ${user.name.split(' ')[0]}! As an admin, you have elevated privileges. How can I assist you with user management, system settings, or an overview of your projects and clients?`
                : `Hello ${user.name.split(' ')[0]}! Welcome to Kazi Flow. How can I help you be more productive today? You can ask me about your account, your projects, upcoming deadlines, or a general knowledge question.`;
            
            setMessages([{ role: 'model', text: welcomeText }]);
        }
    }, [initialSystemInstruction, user]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);


    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading || !chatSessionRef.current) return;
        
        const text = userInput;
        setUserInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        setIsLoading(true);

        try {
            const stream = await chatSessionRef.current.sendMessageStream({ message: text });
            
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.text += chunkText;
                    }
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Gemini Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I seem to be having trouble connecting. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div 
            className="w-full h-full bg-light-secondary dark:bg-dark-secondary flex flex-col transition-all duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assistant-title"
        >
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <AiIcon />
                    <h4 id="ai-assistant-title" className="font-bold text-gray-800 dark:text-gray-100">AI Assistant</h4>
                 </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close Assistant"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>

            <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center text-white flex-shrink-0"><AiIcon /></div>}
                        <div className={`flex flex-col max-w-[80%] leading-1.5 p-3 rounded-xl ${msg.role === 'user' ? 'bg-brand-teal text-white rounded-br-none' : 'bg-white dark:bg-dark-primary rounded-bl-none'}`}>
                            <p className="text-sm font-normal whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.role === 'user' && user && <img className="w-8 h-8 rounded-full flex-shrink-0" src={user.avatarUrl} alt="user"/>}
                    </div>
                ))}
                 {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-teal flex items-center justify-center text-white flex-shrink-0"><AiIcon /></div>
                        <div className="flex flex-col max-w-[80%] leading-1.5 p-3 rounded-xl bg-white dark:bg-dark-primary rounded-bl-none">
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                    <input 
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="flex-grow px-3 py-2 bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal disabled:bg-gray-200 dark:disabled:bg-gray-800"
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="p-2 bg-brand-teal text-white rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600">
                         <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiAssistant;
