// app.js
import { generatePendingTasksTable, calculateProgress } from './public/scripts/emailFunctions.js';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from 'dotenv';
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5500', 
            'https://email-report.onrender.com'
        ];
        
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

const PORT = process.env.PORT || 3000; // Use environment variable for port

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); 
app.use(express.static('public'));

const dateNow = new Date();

const recipientEmails = [
    process.env.EMAIL,
    'benjucorpuz070309@gmail.com',
    "benju@riway.com",
    "bnjcrps@gmail.com",
    "benjusokor@gmail.com",
];

// Configure the email transporter (use your credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
});

 
// Add authentication endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Read users from JSON file on the server
         // Read users file using fs.promises
         const usersData = await fs.readFile(
            path.join(__dirname, 'data', 'users.json'),
            'utf8'
        );
        const users = JSON.parse(usersData);
        const accounts = users.Accounts;
        
        const user = accounts.find(account => 
            account.username === username && 
            account.password === password
        );

        if (user) {
            // Don't send password back to client
            const safeUser = {
                username: user.username,
                name: user.name,
                position: user.position,
                email: user.email
            };
            res.json({ success: true, user: safeUser });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get the daily progress
app.get('/api/progress', async (req, res) => {
    try {
        const progressData = await fs.readFile(
            path.join(__dirname, 'data', 'progress.json'),
            'utf8'
        );
        res.json(JSON.parse(progressData));
        console.log(progressData);
    } catch (error) {
        console.error('Error reading progress data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading progress data'
        });
    }
});

// Get users endpoint
app.get('/api/users', async (req, res) => {
    try {
        const usersData = await fs.readFile(
            path.join(__dirname, 'data', 'users.json'),
            'utf8'
        );
        res.json(JSON.parse(usersData));
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading users' 
        });
    }
});

// Get tasks endpoint
app.get('/api/tasks', async (req, res) => {
    try {
        const tasksData = await fs.readFile(
            path.join(__dirname, 'data', 'task.json'),
            'utf8'
        );
        res.json(JSON.parse(tasksData));
    } catch (error) {
        console.error('Error reading tasks:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading tasks' 
        });
    }
});

// Endpoint to get weekly progress report
app.get('/api/weekly-report', async (req, res) => {
    try {
        const progressData = await fs.readFile(
            path.join(__dirname, 'data', 'progress.json'),
            'utf8'
        );
        const progress = JSON.parse(progressData)['Daily Progress'];

        // Prepare weekly report
        const weeklyReport = {};
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday of the current week

        // Calculate weekly data
        for (const [date, positions] of Object.entries(progress)) {
            const entryDate = new Date(date);
            if (entryDate >= startOfWeek && entryDate <= currentDate) {
                weeklyReport[date] = positions;
            }
        }

        // Prepare data summary for charting
        const summary = {
            dates: [],
            totalTasks: [],
            tasksDone: []
        };

        for (const [date, positions] of Object.entries(weeklyReport)) {
            summary.dates.push(date);
            let dailyTotalTasks = 0;
            let dailyTasksDone = 0;

            for (const positionData of Object.values(positions)) {
                dailyTotalTasks += positionData['Total Tasks'] || 0;
                dailyTasksDone += positionData['Task Done'] || 0;
            }

            summary.totalTasks.push(dailyTotalTasks);
            summary.tasksDone.push(dailyTasksDone);
        }

        res.json({
            success: true,
            weeklyReport,
            summary
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error reading progress data for weekly report'
        });
    }
});

// Save daily report endpoint
app.post('/api/save-daily-report', async (req, res) => {
    try {
        const { AssignedTasks, personnel, date } = req.body;

        // Read the existing progress file
        const progressPath = path.join(__dirname, 'data', 'progress.json');
        let progressData = {};
        
        try {
            const existingData = await fs.readFile(progressPath, 'utf8');
            progressData = JSON.parse(existingData);
        } catch (error) {
        }

        // Update the progress data
        if (!progressData['Daily Progress']) {
            progressData['Daily Progress'] = {};
        }

        if (!progressData['Daily Progress'][date]) {
            progressData['Daily Progress'][date] = {};
        }

        progressData['Daily Progress'][date][AssignedTasks.position] = {
            "Assigned Person": personnel,
            "Tasks": AssignedTasks.tasks,
            "Total Tasks": Object.keys(AssignedTasks.tasks).length,
            "Task Done": Object.values(AssignedTasks.tasks).filter(task => task.remarks === 'Done').length
        };

        // Save the updated data
        await fs.writeFile(progressPath, JSON.stringify(progressData, null, 2));

        res.json({ success: true, message: 'Daily report saved successfully' });
    } catch (error) {
        console.error('Error saving daily report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving daily report' 
        });
    }
});

// Endpoint to update user position in users.json
app.post("/updateUserPosition", async (req, res) => {
    const { username, position } = req.body;
    const usersPath = path.resolve(__dirname, 'data', 'users.json');
    try {
        const data = await fs.readFile(usersPath, 'utf8');
        // Parse the data and find the specific user to update
        const users = JSON.parse(data);
        const user = users.Accounts.find(user => user.username === username);
        if (user) {
            console.log('Updating user:', user);
            user.position = position;  // Update only the position
            // Write the updated data back to users.json
            await fs.promises.writeFile(usersPath, JSON.stringify(users, null, 2));
            res.send("User position updated successfully");
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) {
        res.status(500).send("An error occurred while processing the request");
    }
});


// Function to send individual email to each user
const sendEmailToUser = (user, progressPercentage, pendingTasksTable) => {
    const mailOptions = {
        from: 'lancegula05@gmail.com',
        to: user.email,
        subject: 'Daily Reminder - Task Progress',
        text: `Hello ${user.name},\n\nThis is your daily reminder about your tasks. Your current progress is ${progressPercentage.toFixed(2)}%. Please complete your tasks before the deadline.`,
        html: `<h1>Hello ${user.name},</h1>
               <p>This is your daily reminder about your tasks.</p>
               <p>Your current progress is <strong>${progressPercentage.toFixed(2)}%</strong>.</p>
               ${pendingTasksTable}
               <p>Please complete your tasks before the deadline.</p>`
    };


    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error sending email to', user.email, ':', error);
        }
        console.log('Email sent to', user.email, ':', info.response);
    });
};


// Function to send emails to all users
const scheduledSendEmail = () => {
    // Load users and tasks from JSON files
    const usersFile = path.join(__dirname, 'data/users.json');
    const tasksFile = path.join(__dirname, 'data/task.json');

    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8')).Accounts; 
    const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8')).AssignedTasks; 

    // Iterate over each user
    users.forEach(user => {
        // Find the tasks assigned to the user based on their position
        const userAssignedTasks = tasks.find(task => task.position === user.position);

        if (userAssignedTasks && userAssignedTasks.tasks) {
            const tasksArray = Object.values(userAssignedTasks.tasks);
            const progressPercentage = calculateProgress(tasksArray);

            // Generate a table for unfinished tasks
            const pendingTasksTable = generatePendingTasksTable(tasksArray);

            // Send email to the current user with progress and pending tasks table
            sendEmailToUser(user, progressPercentage, pendingTasksTable);
        } else {
            console.log(`No tasks found for user: ${user.name} (${user.position})`);
        }
    });
};


// Function to reset all tasks to "Pending"
const resetTasksToPending = () => {
    const taskPath = path.join(__dirname, 'task.json');
    
    fs.readFile(taskPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading task file:", err);
            return;
        }

        let tasksData;
        try {
            tasksData = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return;
        }

        // Update all tasks' remarks to "Pending"
        tasksData.AssignedTasks.forEach(assignedTask => {
            Object.values(assignedTask.tasks).forEach(task => {
                task.remarks = "Pending";
            });
        });

        // Write the updated data back to task.json
        fs.writeFile(taskPath, JSON.stringify(tasksData, null, 2), err => {
            if (err) {
                console.error("Error writing to task file:", err);
            } else {
                console.log("All tasks reset to 'Pending' at 12 AM.");
            }
        });
    });
}
// Schedule the function to run at 12:00 AM every day
cron.schedule('0 0 * * *', resetTasksToPending);


// Schedule the task to run every day at 5 PM PST (Manila time adjusted)
cron.schedule('00 17 * * *', () => {
    scheduledSendEmail();
    console.log('Scheduled emails sent.');
}, {
    scheduled: true,
    timezone: "Asia/Manila" 
});


// This should be the LAST route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

