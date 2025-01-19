const verifyUser = async (username, password) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            const currentUser = data.user;
            localStorage.setItem('User', JSON.stringify(currentUser));

            // Success alert using SweetAlert
            Swal.fire({
                title: 'Login Successful!',
                text: `Welcome, ${currentUser.name}!`,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (currentUser.position === "Admin") {
                        window.location.href = 'iAdminDashboard.html';    
                    } else {
                        window.location.href = 'iUserDashboard.html';
                    }
                }
            });
        } else {
            // Error alert using SweetAlert
            Swal.fire({
                title: 'Invalid Credentials!',
                text: 'Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload();
                }
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        Swal.fire({
            title: 'Server Error',
            text: 'Please try again later.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
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