
const logoutUser = () => {
    try {
        localStorage.removeItem('User');
    } catch (error) {
        console.log(error);
    }
    location.replace('index.html'); // Force immediate redirect to the login page
  };

document.addEventListener('DOMContentLoaded', () => {
    
    /* 
    **********************************************
                  DISPLAYS THE USER
    ********************************************** 
    */
    const getUser = localStorage.getItem('User');
    const currentUser = JSON.parse(getUser);

    if (currentUser) {
        document.querySelector('#InUser').innerHTML = currentUser.name;
        document.querySelector('#userTask').innerHTML = currentUser.position;
    } else {
        document.querySelector('#InUser').innerHTML = 'Login First';
        document.querySelector('#userTask').innerHTML = 'Login First';
    }

    /*
    **********************************************
                    USER LOGOUT LOGIC
    ********************************************** 
    */
    const logoutButton = document.querySelector('#logoutButton');
    
    logoutButton.addEventListener('click', logoutUser);
        
    
    /*
    **********************************************
                  EMAIL SEND LOGIC
    **********************************************
    */ 
    const saveProgressButton = document.querySelector('#sendButton');

    saveProgressButton.addEventListener('click', async () => {
        const data = new Date();
        const options = { timeZone: 'Asia/Manila' };
        const dateInAsia = new Intl.DateTimeFormat('en-US', options).format(data);
    
        // Get user info and tasks from localStorage
        const userInfo = JSON.parse(localStorage.getItem('User'));
        const getTasks = JSON.parse(localStorage.getItem('UserTasks'));
        const assignedTasks = getTasks.AssignedTasks || [];
    
        // Find the user's assigned tasks by position
        const userAssignedTasks = assignedTasks.find(task => task.position === userInfo.position);
    
        if (!userAssignedTasks) {
            console.error('No tasks found for this user position:', userInfo.position);
            return;
        }
    
        // Update remarks for each task based on its current state
        const updatedTasks = {};
        Object.entries(userAssignedTasks.tasks).forEach(([taskId, taskData]) => {
            // Set remarks based on some criteria, e.g., checking completion
            taskData.remarks = taskData.remarks === 'Done' ? 'Done' : 'Pending';
            updatedTasks[taskId] = taskData;  // Save the updated task
        });
    
        // Calculate the task progress
        const tasksArray = Object.values(updatedTasks);
        const totalTasks = tasksArray.length;
        const completedTasks = tasksArray.filter(task => task.remarks === 'Done').length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
        console.log(`Progress for ${userInfo.position}:`, progressPercentage, '%');
    
        // Prepare data for saving daily report
        try {
            const response = await axios.post('http://192.168.100.30:3000/save-daily-report', {
                AssignedTasks: {
                    position: userAssignedTasks.position,
                    assignedPerson: userInfo.name,
                    tasks: updatedTasks
                },
                personnel: userInfo.name,
                date: dateInAsia // Format "YYYY-MM-DD"
            });
            alert(`Task successfully saved, Good job!`);
            location.reload(true);
        } catch (error) {
            if (error.response) {
                alert(`Error: ${error.response.data.message} \nPlease check if the server is running`);
                location.reload(true);
            } else {
                Swal.fire({
                    title: 'An Error Occurred!',
                    text: `Error: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                // console.error('Error saving report:', error.message);
            }
        }
    });

// =====================================================================================================


    /*
    **********************************************
                  DISPLAY TASK LOGIC
    **********************************************
    */
    fetch('scripts/storage/task.json')
    .then(response => response.json())
    .then(data => {
        // Check if UserTasks is already in localStorage
        let userTasks = localStorage.getItem('UserTasks');
        
        if (!userTasks) {
            // If no tasks in localStorage, save the data from the JSON file to localStorage
            localStorage.setItem('UserTasks', JSON.stringify(data));
            userTasks = data; // Use the JSON file's data
        } else {
            // If tasks are in localStorage, parse them
            userTasks = JSON.parse(userTasks);
        }

        // Assuming userPosition is stored in localStorage or available globally
        const userPosition = JSON.parse(localStorage.getItem('User')).position;

        // Find the user's assigned tasks based on their position
        if (Array.isArray(userTasks.AssignedTasks)) {
            const assignedTasks = userTasks.AssignedTasks.find(task => task.position === userPosition);

            if (assignedTasks && assignedTasks.tasks) {
                const taskBody = document.querySelector('.task-body');
                taskBody.innerHTML = ''; // Clear the table body before populating it

                // Use Object.keys to loop through tasks since tasks is an object
                Object.keys(assignedTasks.tasks).forEach((taskKey, index) => {
                    const task = assignedTasks.tasks[taskKey];
                    const isChecked = task.remarks === 'Done' ? 'checked' : ''; // Check if task is done

                    // Create the row HTML
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

                    // Insert the task row into the table body
                    taskBody.insertAdjacentHTML('beforeend', taskRow);
                });

                // Add event listener for checkbox change to update task remarks and localStorage
                document.querySelectorAll('.progressCheckbox').forEach(checkbox => {
                    checkbox.addEventListener('change', (event) => {
                        const taskKey = event.target.getAttribute('data-task-key');
                        const task = assignedTasks.tasks[taskKey];

                        // Update remarks based on checkbox status
                        task.remarks = event.target.checked ? 'Done' : 'Pending';

                        // Update the UI (remarks column)
                        event.target.closest('tr').querySelector('.remarksColumn').textContent = task.remarks;

                        // Save the updated task data back to localStorage
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
    .catch(error => console.error('Error:', error));


    let task = localStorage.getItem('UserTasks');
    let information = JSON.parse(task);
    // console.log(information);


// =====================================================================================================

})

// fetch('scripts/weeklyProgress.json')
// .then(response => response.json())
// .then(data => {
//     console.log(data["Weekly Progress"]["October 18, 2024"]);
// })


// const data = new Date();
// const dateToday = data.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
// console.log(dateToday); // Outputs the date in Asia/Manila timezone

// const data = new Date()
// const dateToday = data.toISOString();
// console.log(dateToday.split('T'))