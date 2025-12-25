import axios from 'axios';

async function test() {
    const payloads = [
        { email: 'admin@example.com', password: 'admin' },
        { email: 'test@test.com', password: 'password' },
        { email: 'wrong@body.com' } // incomplete
    ];

    for (const payload of payloads) {
        console.log('\nTesting payload:', payload);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', payload);
            console.log('Response:', res.status, res.data);
        } catch (err) {
            console.log('Error:', err.response?.status || 'No Response', err.response?.data || err.message);
        }
    }
}
test();
