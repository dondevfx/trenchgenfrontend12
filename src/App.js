import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const socket = io('https://trenchchat.onrender.com');

export default function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [alias, setAlias] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const messageContainerRef = useRef(null);

  useEffect(() => {
    let savedAlias = localStorage.getItem('anonAlias');
    if (!savedAlias) {
      savedAlias = 'Degen#' + Math.floor(Math.random() * 10000);
      localStorage.setItem('anonAlias', savedAlias);
    }
    setAlias(savedAlias);

    socket.on('chat message', (msg) => {
      setMessages((prev) => [msg, ...prev]);
    });

    return () => {
      socket.off('chat message');
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = {
      id: uuidv4(),
      alias,
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    socket.emit('chat message', msg);
    setMessage('');
  };

  const updateAlias = () => {
    if (!newAlias.trim()) return;
    localStorage.setItem('anonAlias', newAlias);
    setAlias(newAlias);
    setShowModal(false);
  };

  return (
    <div className="h-screen w-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="w-full max-w-4xl h-full p-6 flex flex-col">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-extrabold text-green-300">Degens Anonymous</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Connected as <span className="text-yellow-400 font-bold">{alias}</span></span>
            <button
              className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => setShowModal(true)}
            >
              Change Name
            </button>
          </div>
        </header>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-[#111] p-6 rounded-lg border border-green-600 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-green-300">Create Display Name</h2>
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="w-full p-3 mb-4 border border-green-700 bg-black text-green-200 rounded"
                placeholder="Enter your display name"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-600 rounded text-white">Cancel</button>
                <button onClick={updateAlias} className="px-4 py-2 bg-green-600 rounded text-white">Save</button>
              </div>
            </div>
          </div>
        )}

        <div ref={messageContainerRef} className="flex-1 overflow-y-scroll flex flex-col-reverse bg-[#111] rounded-lg p-6 space-y-4 border border-green-700 shadow-inner">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-500 text-black rounded-full flex items-center justify-center text-xl font-extrabold">
                {msg.alias.charAt(0)}
              </div>
              <div>
                <div className="text-lg">
                  <span className="text-yellow-300 font-extrabold">{msg.alias}</span>{' '}
                  <span className="text-gray-500 text-sm">[{msg.timestamp}]</span>
                </div>
                <div className="bg-green-900 text-green-200 rounded-lg p-4 text-xl font-bold max-w-2xl whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex mt-6 space-x-4">
          <input
            className="flex-1 bg-black text-green-300 text-lg font-bold border border-green-700 p-3 rounded focus:outline-none focus:ring focus:border-green-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your trench rant..."
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-white text-lg font-extrabold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
