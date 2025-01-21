const api = axios.create({
    baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://email-report.onrender.com'
});
const verifyUser = async (username, password) => {
    try {
        const response = await api.post('/api/login', {
            username,
            password
        });

        const data = response.data;
        
        if (data.success) {
            const currentUser = data.user;
            localStorage.setItem('User', JSON.stringify(currentUser));

            await Swal.fire({
                title: 'Login Successful!',
                text: `Welcome, ${currentUser.name}!`,
                icon: 'success',
                confirmButtonText: 'OK'
            });

            if (currentUser.position === "Admin") {
                window.location.href = 'iAdminDashboard.html';    
            } else {
                window.location.href = 'iUserDashboard.html';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle different types of errors
        if (error.response) {
            // Server responded with error (e.g., 401 unauthorized)
            await Swal.fire({
                title: 'Login Failed',
                text: error.response.data.message || 'Invalid credentials',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } else if (error.request) {
            // Request made but no response received
            await Swal.fire({
                title: 'Server Error',
                text: 'Cannot connect to server',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } else {
            // Other errors
            await Swal.fire({
                title: 'Error',
                text: 'Something went wrong',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
};

// Your event listener code remains the same
document.addEventListener("DOMContentLoaded", () => {
    const userUsername = document.querySelector('#username');
    const userPassword = document.querySelector('#password');
    const loginButton = document.querySelector('#loginButton');

    loginButton.addEventListener('click', (event) => {
        event.preventDefault();
        verifyUser(userUsername.value, userPassword.value);
    });
})