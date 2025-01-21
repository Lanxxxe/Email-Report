const logoutUser = () => {
    try {
        localStorage.removeItem('User');
    } catch (error) {
        alert(error);
    }
    location.replace('index.html');
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('#logoutButton');
    const saveProgressButton = document.querySelector('#sendButton');
    const getUser = localStorage.getItem('User');
    const currentUser = JSON.parse(getUser);
    
    // Create axios instance
    const api = axios.create({
        baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://email-report.onrender.com'
    });

    if (currentUser) {
        document.querySelector('#InUser').innerHTML = currentUser.name;
        document.querySelector('#userTask').innerHTML = currentUser.position;
    } else {
        document.querySelector('#InUser').innerHTML = 'Login First';
        document.querySelector('#userTask').innerHTML = 'Login First';
    }
    
    saveProgressButton.addEventListener('click', async () => {
        const data = new Date();
        const options = { timeZone: 'Asia/Manila' };
        const dateInAsia = new Intl.DateTimeFormat('en-US', options).format(data);
    
        const userInfo = JSON.parse(localStorage.getItem('User'));
        const getTasks = JSON.parse(localStorage.getItem('UserTasks'));
        const assignedTasks = getTasks.AssignedTasks || [];
    
        const userAssignedTasks = assignedTasks.find(task => task.position === userInfo.position);
    
        if (!userAssignedTasks) {
            console.error('No tasks found for this user position:', userInfo.position);
            return;
        }
    
        const updatedTasks = {};
        Object.entries(userAssignedTasks.tasks).forEach(([taskId, taskData]) => {
            taskData.remarks = taskData.remarks === 'Done' ? 'Done' : 'Pending';
            updatedTasks[taskId] = taskData;
        });
    
        const tasksArray = Object.values(updatedTasks);
        const totalTasks = tasksArray.length;
        const completedTasks = tasksArray.filter(task => task.remarks === 'Done').length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;    
        try {
            const response = await api.post('/api/save-daily-report', {
                AssignedTasks: {
                    position: userAssignedTasks.position,
                    assignedPerson: userInfo.name,
                    tasks: updatedTasks
                },
                personnel: userInfo.name,
                date: dateInAsia
            });
            
            Swal.fire({
                title: 'Success!',
                text: 'Task successfully saved, Good job!',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => 'Okay');
        } catch (error) {
            if (error.response) {
                Swal.fire({
                    title: 'Server Error!',
                    text: `${error.response.data.message}\nPlease check if the server is running`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                }).then(() => location.reload(true));
            } else {
                Swal.fire({
                    title: 'An Error Occurred!',
                    text: `Error: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    });

    // Fetch tasks using axios
    api.get('/api/tasks')
        .then(response => {
            const data = response.data;
            let userTasks = localStorage.getItem('UserTasks');
            
            if (!userTasks) {
                localStorage.setItem('UserTasks', JSON.stringify(data));
                userTasks = data;
            } else {
                userTasks = JSON.parse(userTasks);
            }

            const userPosition = JSON.parse(localStorage.getItem('User')).position;
            
            if (Array.isArray(userTasks.AssignedTasks)) {
                const assignedTasks = userTasks.AssignedTasks.find(task => task.position === userPosition);
                if (assignedTasks && assignedTasks.tasks) {
                    const taskBody = document.querySelector('.task-body');
                    taskBody.innerHTML = '';
                    
                    Object.keys(assignedTasks.tasks).forEach((taskKey) => {
                        const task = assignedTasks.tasks[taskKey];
                        const isChecked = task.remarks === 'Done' ? 'checked' : '';
                        
                        const taskRow = `
                            <tr>
                                <td class="text-center">
                                    <input type="checkbox" class="progressCheckbox" ${isChecked} data-task-key="${taskKey}">
                                </td>
                                <td>${task.task}</td>
                                <td>${task.actionPlan}</td>
                                <td class="remarksColumn">${task.remarks}</td>
                            </tr>
                        `;
                        taskBody.insertAdjacentHTML('beforeend', taskRow);
                    });

                    document.querySelectorAll('.progressCheckbox').forEach(checkbox => {
                        checkbox.addEventListener('change', (event) => {
                            const taskKey = event.target.getAttribute('data-task-key');
                            const task = assignedTasks.tasks[taskKey];
                            task.remarks = event.target.checked ? 'Done' : 'Pending';
                            event.target.closest('tr').querySelector('.remarksColumn').textContent = task.remarks;
                            localStorage.setItem('UserTasks', JSON.stringify(userTasks));
                        });
                    });
                } else {
                    console.error('No tasks found for the current user position.');
                }
            } else {
                console.error('AssignedTasks is not an array.');
            }
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to load tasks. Please try again later.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });

    logoutButton.addEventListener('click', logoutUser);
});