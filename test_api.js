// using built-in fetch

async function testApi() {
    try {
        console.log('Testing GET http://localhost:8000/');
        const resRoot = await fetch('http://localhost:8000/');
        console.log('Root status:', resRoot.status);
        const textRoot = await resRoot.text();
        console.log('Root text:', textRoot);

        console.log('Testing POST http://localhost:8000/api/users/login');
        const resLogin = await fetch('http://localhost:8000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password' })
        });
        console.log('Login status:', resLogin.status);
        const jsonLogin = await resLogin.json();
        console.log('Login response:', jsonLogin);

    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
