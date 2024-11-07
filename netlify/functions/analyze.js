import { pipeline } from '@xenova/transformers';

let classifier = null;
let isInitializing = false;
let initializationError = null;

async function initializeClassifier() {
    if (classifier) return classifier;
    if (isInitializing) {
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (initializationError) throw initializationError;
        return classifier;
    }

    isInitializing = true;
    try {
        classifier = await pipeline('sentiment-analysis');
        return classifier;
    } catch (error) {
        initializationError = error;
        throw error;
    } finally {
        isInitializing = false;
    }
}

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        let { text } = JSON.parse(event.body);
        
        if (!text || typeof text !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Valid text is required' })
            };
        }

        // Trim and limit text length if needed
        text = text.trim().slice(0, 1000);

        const classifierInstance = await initializeClassifier();
        const result = await classifierInstance(text);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text,
                sentiment: result[0].label,
                score: result[0].score
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Analysis failed',
                message: error.message
            })
        };
    }
}; 