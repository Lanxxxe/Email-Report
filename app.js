// app.js
import { generatePendingTasksTable, calculateProgress } from './public/scripts/emailFunctions.js';
import express from 'express';
import cors from 'cors';
import cron, { schedule } from 'node-cron';
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dateNow = new Date();
const app = express();
// Start the server
const PORT = 3000; 

// Enable CORS for all routes
app.use(cors()); 

// To parse JSON bodies// for parsing application/json
app.use(express.json()); 
app.use(express.static('public'));

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
        const usersData = await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8');
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
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Endpoint to send an email
app.post('/send-email', (req, res) => {
    const { recipient, emailBody } = req.body; // Get recipient email from request body
    console.log(recipient);
    const mailOptions = {
        from: 'testemail@gmail.com',
        to: recipient, // Send to the recipient from the frontend
        subject: 'Progress Report',
        html: emailBody
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        } else {
            console.log('Email sent:', info.response);
            return res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});


// Endpoint to save daily report
app.post('/save-daily-report', (req, res) => {
    const { AssignedTasks, date, personnel } = req.body;
    const { position, tasks } = AssignedTasks;

    const progressPath = path.join(__dirname, 'public/scripts/storage/progress.json');
    const tasksPath = path.join(__dirname, 'public/scripts/storage/task.json');

    // Read and update progress.json
    fs.readFile(progressPath, (err, data) => {
        let weeklyReports = { "Daily Progress": {} };

        if (!err) {
            try {
                weeklyReports = JSON.parse(data);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                return res.status(500).send("Error reading weekly reports data.");
            }
        }

        // Calculate total tasks and tasks done
        const totalTasks = Object.keys(tasks).length;
        const tasksDone = Object.values(tasks).filter(task => task.remarks === 'Done').length;

        if (!weeklyReports["Daily Progress"][date]) {
            weeklyReports["Daily Progress"][date] = {};
        }

        weeklyReports["Daily Progress"][date][position] = {
            "Assigned Person": personnel,
            "Total Tasks": totalTasks,
            "Task Done": tasksDone
        };

        // Write back to progress.json
        fs.writeFile(progressPath, JSON.stringify(weeklyReports, null, 2), (err) => {
            if (err) {
                console.error("Error writing to progress.json file:", err);
                return res.status(500).send("Error saving daily report.");
            }
        });
    });

    // Read, update, and write task.json
    fs.readFile(tasksPath, (err, data) => {
        if (err) {
            console.error("Error reading task.json:", err);
            return res.status(500).send("Error reading tasks data.");
        }

        let tasksData;
        try {
            tasksData = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing task.json:", parseError);
            return res.status(500).send("Error parsing tasks data.");
        }

        // Find the user’s tasks by position and update remarks
        const userAssignedTasks = tasksData.AssignedTasks.find(t => t.position === position);
        if (userAssignedTasks) {
            for (const taskName in tasks) {
                if (userAssignedTasks.tasks[taskName]) {
                    userAssignedTasks.tasks[taskName].remarks = tasks[taskName].remarks;
                }
            }

            // Write the updated data back to task.json
            fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2), (err) => {
                if (err) {
                    console.error("Error writing to task.json file:", err);
                    return res.status(500).send("Error updating task data.");
                }
                console.log("Daily report and task data saved successfully");
                res.status(200).send("Daily report and task data saved successfully");
            });
        } else {
            res.status(404).send("User's assigned tasks not found.");
        }
    });
});


// Endpoint to update user position in users.json
app.post("/updateUserPosition", (req, res) => {
    const { username, position } = req.body;

    // Read the current users.json data
    fs.readFile("./public/scripts/storage/users.json", "utf8", (err, data) => {
        if (err) {
            console.error("Error reading users.json", err);
            return res.status(500).send("Error reading user data");
        }

        // Parse the data and find the specific user to update
        const users = JSON.parse(data);
        const user = users.Accounts.find(user => user.username === username);

        if (user) {
            user.position = position;  // Update only the position

            // Write the updated data back to users.json
            fs.writeFile("./public/scripts/storage/users.json", JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    console.error("Error writing to users.json", err);
                    return res.status(500).send("Error saving user data");
                }
                res.send("User position updated successfully");
            });
        } else {
            res.status(404).send("User not found");
        }
    });
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
    const usersFile = path.join(__dirname, 'public/scripts/storage/users.json');
    const tasksFile = path.join(__dirname, 'public/scripts/storage/task.json');

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

