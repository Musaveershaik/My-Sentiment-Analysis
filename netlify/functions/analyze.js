import { pipeline } from '@xenova/transformers';

let classifier = null;
let isInitializing = false;

const initializeClassifier = async () => {
    if (classifier) return classifier;
    if (isInitializing) {
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return classifier;
    }

    isInitializing = true;
    try {
        classifier = await pipeline('sentiment-analysis');
        return classifier;
    } finally {
        isInitializing = false;
    }
};

export const handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { text } = JSON.parse(event.body);
        const model = await initializeClassifier();
        const result = await model(text);

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
            body: JSON.stringify({ error: error.message })
        };
    }
}; 