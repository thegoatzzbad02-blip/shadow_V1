(function () {
    const API_BASE = '/api';

    function getAuthToken() {
        return localStorage.getItem('token') || '';
    }

    function getAuthHeaders(extra = {}) {
        const headers = { ...extra };
        const token = getAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    async function apiRequest(path, options = {}) {
        const method = options.method || 'GET';
        const headers = getAuthHeaders(options.headers || {});
        const config = {
            method,
            headers,
            ...options,
        };

        if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
            config.body = JSON.stringify(options.body);
        }

        if (!headers['Content-Type'] && !(config.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : await response.text();

        if (!response.ok) {
            const message = typeof data === 'object' && data && data.message ? data.message : 'Error en la solicitud';
            throw new Error(message);
        }

        return data;
    }

    async function apiGet(path, options = {}) {
        return apiRequest(path, { ...options, method: 'GET' });
    }

    async function apiPost(path, body, options = {}) {
        return apiRequest(path, { ...options, method: 'POST', body });
    }

    async function apiPut(path, body, options = {}) {
        return apiRequest(path, { ...options, method: 'PUT', body });
    }

    async function apiDelete(path, options = {}) {
        return apiRequest(path, { ...options, method: 'DELETE' });
    }

    window.apiRequest = apiRequest;
    window.apiGet = apiGet;
    window.apiPost = apiPost;
    window.apiPut = apiPut;
    window.apiDelete = apiDelete;
})();
