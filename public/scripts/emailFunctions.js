/*
**********************************************
PROGRESS CALCULATION AND GENERATING PENDING TASK
********************************************** 
*/

// Function to calculate task progress
export const calculateProgress = (tasks) => {
    const totalTasks = Object.keys(tasks).length;
    const completedTasks = Object.values(tasks).filter(task => task.remarks === 'Done').length;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
};

// Function to generate HTML table for pending tasks
export const generatePendingTasksTable = (tasks) => {
    const pendingTasks = tasks.filter(task => task.remarks === 'Pending');

    if (pendingTasks.length === 0) {
        return '<p>Great job! All tasks are completed.</p>';
    }

    let tableRows = '';
    pendingTasks.forEach(task => {
        tableRows += `
            <tr>
                <td>${task.task}</td>
                <td>${task.actionPlan}</td>
                <td>${task.remarks}</td>
            </tr>
        `;
    });

    return `
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Action Plan</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
};
