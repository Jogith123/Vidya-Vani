import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const WebSocketContext = createContext({
    isConnected: false,
    logs: [],
    pipelineState: {},
    sendMessage: () => { },
    clearLogs: () => { },
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState([]);
    const [pipelineState, setPipelineState] = useState({});
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = () => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // const wsUrl = `${wsProtocol}//${window.location.hostname}:5050`;
        const wsUrl = `ws://localhost:5050`; // Hardcoded for local dev if needed, or derived

        console.log('Connecting to WS:', wsUrl);

        try {
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('✅ WebSocket Connected');
                setIsConnected(true);
                addLog('System', 'Connected to real-time server', 'success');
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error('Failed to parse WS message', e);
                }
            };

            socket.onclose = () => {
                console.log('❌ WebSocket Disconnected');
                setIsConnected(false);
                // Reconnect logic
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setIsConnected(false);
            };
        } catch (err) {
            console.error("WS Connection failed", err)
        }
    };

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) socketRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

    const handleMessage = (data) => {
        // Handle specific event types
        if (data.type === 'log') {
            addLog('Backend', data.message, data.level || 'info');
        }
        else if (data.event) {
            // Pipeline events
            setPipelineState(prev => ({ ...prev, activeStage: data.event }));
            addLog('Pipeline', `Stage Update: ${data.event}`, 'info');
        }
        else {
            // Generic log
            const msg = typeof data === 'string' ? data : JSON.stringify(data);
            addLog('Server', msg);
        }
    };

    const addLog = (source, message, type = 'info') => {
        setLogs(prev => [{
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            source,
            message,
            type
        }, ...prev].slice(0, 100)); // Keep last 100
    };

    const sendMessage = (msg) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify(msg));
        }
    };

    const clearLogs = () => setLogs([]);

    return (
        <WebSocketContext.Provider value={{ isConnected, logs, pipelineState, sendMessage, clearLogs }}>
            {children}
        </WebSocketContext.Provider>
    );
};
