const getUsers = () => {
    return fetch('scripts/storage/users.json')
        .then(response => response.json())
        .then(data => {
            return data;
        });
};

const fetchData = () => {
    return getUsers().then(users => {
        let accounts = users['Accounts']; // Access the 'Accounts' key if it exists
        return accounts;
    });
};

/*
**********************************************
            USER VERIFICATION LOGIC
********************************************** 
*/

const verifyUser = (username, password) => {
    // Check if the provided username and password match any in the Accounts array
    fetchData().then(accounts => {
        console.log(accounts);
        const user = accounts.find(account => account.username === username && account.password === password);
        // const user = 
        let currentUser;
        
        if (user) {
            // If user credentials are correct, save user info to currentUser dictionary
        currentUser = {
            username: user.username,
            name: user.name,
            position: user.position,
            email: user.email
        };
        
        localStorage.setItem('User', JSON.stringify(currentUser));

        // Success alert using SweetAlert
        Swal.fire({
            title: 'Login Successful!',
            text: `Welcome, ${user.name}!`,
            icon: 'success',
            confirmButtonText: 'OK'
        }).then((result) => {
            if (result.isConfirmed) {
                if (currentUser.position == "Admin") {
                    window.location.href = 'iAdminDashboard.html';    
                } else {
                    // Redirect to another page after clicking "OK"
                    window.location.href = 'iUserDashboard.html';  // Change to your desired page
                }
            }
        });
        return true;
    } else {
        // Error alert using SweetAlert
        Swal.fire({
            title: 'Invalid Credentials!',
            text: 'Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        }).then((result) => {
            if (result.isConfirmed) {
                // Reload the current page after clicking "OK"
                window.location.reload();  // Reload the current page
            };
        });
        return false;
    }
});
};

document.addEventListener("DOMContentLoaded", () => {
    /* 
    **********************************************
                  USER LOGIN LOGIC
    ********************************************** 
    */
    const userUsername = document.querySelector('#username');
    const userPassword = document.querySelector('#password');
    const loginButton = document.querySelector('#loginButton');

    loginButton.addEventListener('click', (event) => {
        // Prevent default form submission behavior
        event.preventDefault();

        // Call verifyUser function with username and password values
        verifyUser(userUsername.value, userPassword.value);
    });
});