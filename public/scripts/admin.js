// Logout Function
const logoutUser = () => {
    try {
        localStorage.removeItem('User');
    } catch (error) {
        alert(error);
    }
    // Redirect immediately after removing User from storage
    location.replace('index.html');
};


// Load the users.json file
const loadUsers = async () => {
    const api = axios.create({
        baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://email-report.onrender.com'
    });
    try {
        const response = await api.get('/api/users');
        const data = response.data; // Axios automatically parses JSON
        return data.Accounts || []; // Safeguard in case Accounts is undefined
    } catch (error) {
        alert('Error loading users:', error);
        return []; // Return an empty array on error
    }
};


// Generate form for each user except admin
const generateUserForms = (users) => {
    users.forEach(user => {
        if (user.position === 'Admin') return; // Skip admin user

        // Create a form group
        const formGroup = document.createElement('div');
        formGroup.classList.add('input-group', 'mb-3', 'w-75');

        // Create an input field with the user's name
        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('form-control');
        input.value = user.name;
        input.setAttribute('readonly', 'true'); // Prevent editing

        // Create a dropdown button
        const dropdownButton = document.createElement('button');
        dropdownButton.classList.add('btn', 'btn-outline-secondary', 'dropdown-toggle');
        dropdownButton.type = 'button';
        dropdownButton.dataset.bsToggle = 'dropdown';
        dropdownButton.textContent = user.position;

        // Create a dropdown menu with position options
        const dropdownMenu = document.createElement('ul');
        dropdownMenu.classList.add('dropdown-menu');
        ['Leader', 'Counter 1', 'Counter 2', 'Back Office'].forEach(position => {
            const dropdownItem = document.createElement('li');
            const link = document.createElement('a');
            link.classList.add('dropdown-item');
            link.href = '#';
            link.textContent = position;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                dropdownButton.textContent = position;
                updateUserPosition(user.username, position);
            });
            dropdownItem.appendChild(link);
            dropdownMenu.appendChild(dropdownItem);
        });

        // Append elements to the form group
        formGroup.appendChild(input);
        formGroup.appendChild(dropdownButton);
        formGroup.appendChild(dropdownMenu);

        // Append the form group to the container
        userForms.appendChild(formGroup);
    });
};

// Update user position in users.json (this requires server-side handling)
const updateUserPosition = async (username, newPosition) => {
    const api = axios.create({
        baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://email-report.onrender.com'
    });
    try {
        // Send a POST request to update the user's position
        await api.post('/updateUserPosition', {
            username,
            position: newPosition
        });
        alert(`${username}'s position updated to ${newPosition}`);
        location.reload(true);
    
    } catch (error) {
        alert(`Error updating position: ${error}`);
        location.reload(true);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const userForms = document.getElementById('userForms');
    const userSpan = document.getElementById('user');

    const logoutButton = document.querySelector('#logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }

    // Check if the user is logged in
    const getUser = localStorage.getItem('User');
    if (!getUser) {
        // Redirect to login if no user data is found
        window.location.href = 'index.html';
        return;
    } 

    // Parse User data and check position
    const parseUser = JSON.parse(getUser);
    if (parseUser) {
        document.querySelector('#user').innerHTML = `${parseUser.name}!`;
        if (parseUser.position !== "Admin") {
            // Redirect to User Dashboard if the user is not an Admin
            window.location.href = 'iUserDashboard.html';
        }

    }

    // Display the logged-in admin's name (assuming admin is logged in)
    const adminData = localStorage.getItem('User');
    if (adminData) {
        const admin = JSON.parse(adminData);
        userSpan.textContent = admin.name;
    }
    // Load users and generate forms
    const users = await loadUsers();
    generateUserForms(users);

});