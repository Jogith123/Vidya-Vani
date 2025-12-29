import { useState, useCallback } from 'react';

const useNetwork = (baseUrl = 'http://localhost:3000') => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const post = useCallback(async (endpoint, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (err) {
            setError(err.message);
            console.error("Network Error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    const get = useCallback(async (endpoint) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    return { post, get, loading, error };
};

export default useNetwork;
