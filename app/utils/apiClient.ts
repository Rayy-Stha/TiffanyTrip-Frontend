import { API_BASE_URL } from '../config/api';

interface ApiOptions extends RequestInit {
    data?: any;
}

class ApiError extends Error {
    response?: { data: any; status: number };
    constructor(message: string, responseData?: any, status?: number) {
        super(message);
        this.name = 'ApiError';
        if (responseData !== undefined) {
            this.response = { data: responseData, status: status || 0 };
        }
    }
}

export const apiClient = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const { data, headers, ...customConfig } = options;

    const config: RequestInit = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(headers as HeadersInit),
        },
        ...customConfig,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('📡 API Request:', {
        url: fullUrl,
        method: config.method,
        endpoint,
        body: data ? JSON.stringify(data) : undefined,
    });

    try {
        const response = await fetch(fullUrl, config);
        const result = await response.json();

        console.log('📡 API Response:', {
            url: fullUrl,
            status: response.status,
            ok: response.ok,
            result: JSON.stringify(result).substring(0, 300),
        });

        if (!response.ok) {
            const errorMessage = result.message || result.error || 'Something went wrong';
            throw new ApiError(errorMessage, result, response.status);
        }

        return result;
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error; // Re-throw ApiError as-is
        }
        // Network error or JSON parse error
        throw new ApiError(error.message || 'Network request failed');
    }
};
