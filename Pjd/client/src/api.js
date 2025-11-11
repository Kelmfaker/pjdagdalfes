// Simple API helper used by the client.
// Reads base URL from Vite env `import.meta.env.VITE_API_BASE` or falls back to localhost.
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
	? import.meta.env.VITE_API_BASE
	: 'http://localhost:5000/api';

export function getToken() {
	return localStorage.getItem('token');
}

export function setToken(token) {
	if (token) localStorage.setItem('token', token);
	else localStorage.removeItem('token');
}

async function handleResponse(res) {
	const text = await res.text();
	try { return JSON.parse(text); } catch(e) { return text; }
}

export async function request(path, options = {}) {
	const url = API_BASE + path;
	const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
	const token = getToken();
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(url, Object.assign({}, options, { headers }));
	if (!res.ok) {
		const body = await handleResponse(res);
		const err = new Error(`Request failed ${res.status} ${res.statusText}`);
		err.status = res.status;
		err.body = body;
		throw err;
	}
	return handleResponse(res);
}

export function login(username, password) {
	return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export default {
	login, request, getToken, setToken
};
