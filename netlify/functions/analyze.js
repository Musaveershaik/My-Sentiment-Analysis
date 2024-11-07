import { pipeline } from '@xenova/transformers';

// Initialize the classifier
let classifier;
const initializeClassifier = async () => {
    if (!classifier) {
        classifier = await pipeline('sentiment-analysis');
    }
    return classifier;
};

export const handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // Parse the incoming request body
        const { text } = JSON.parse(event.body);
        
        if (!text) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Text is required' }),
            };
        }

        // Initialize classifier if needed
        const classifierInstance = await initializeClassifier();
        
        // Analyze the text
        const result = await classifierInstance(text);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Configure CORS as needed
            },
            body: JSON.stringify({
                text,
                sentiment: result[0].label,
                score: result[0].score
            }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error processing request' }),
        };
    }
}; 