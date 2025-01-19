const logoutUser = () => {
    try {
        localStorage.removeItem('User');
    } catch (error) {
        console.log(error);
    }
    location.replace('index.html'); // Force immediate redirect to the login page
};

const getDailyProgress = () => {
    return fetch('scripts/storage/progress.json')
        .then(response => response.json())
        .then(data => {
            return data;
        });
};

const fetchDailyProgress = () => {
    return getDailyProgress().then(progress => {
        let accounts = progress['Daily Progress']; // Access the 'Accounts' key if it exists
        return accounts;
    });
};


document.addEventListener('DOMContentLoaded', () => {
    
    // USER LOGOUT LOGIC
    const getUser = localStorage.getItem('User');
    
    if (!getUser) {
        location.replace('index.html'); // Redirect if User is not in localStorage
    }
    logoutButton.addEventListener('click', logoutUser);
    

    // BAR GRAPH LOGIC
    fetchDailyProgress().then(dailyProgress => {
        console.log(dailyProgress);

        // Positions and week days
        const positions = Object.keys(dailyProgress[Object.keys(dailyProgress)[0]] || {});
        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        // Get today's date in Asia/Manila timezone
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // UTC offset in milliseconds
        const today = new Date(now.getTime() + offset + (8 * 60 * 60 * 1000));; // Today in Asia/Manila timezone
        console.log(today);

        // Calculate the start of the week (Monday)
        const startOfWeek = new Date(today);
        const dayOfWeek = startOfWeek.getUTCDay(); // Get the day of the week in UTC (0 = Sunday, 1 = Monday, etc.)
        const daysSinceMonday = (dayOfWeek + 7) % 7; // Calculate days since the last Monday
        startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday); // Set date to Monday

        console.log(`Start of the week: ${startOfWeek.toDateString()}`);

        // Loop through each weekday and generate the chart up to today's date
        weekDays.forEach((day, dayIndex) => {
            // console.log(`start of the week: ${startOfWeek}`);

             // Create a new date object for the current day based on startOfWeek
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + dayIndex);

            // Adjust currentDate to Manila timezone
            const offset = currentDate.getTimezoneOffset() * 60000; // Get the UTC offset in milliseconds
            const manilaDate = new Date(currentDate.getTime() + offset + (8 * 60 * 60 * 1000)); // Adjust for UTC+8

            const dateString = `${manilaDate.getMonth() + 1}/${manilaDate.getDate()}/${manilaDate.getFullYear()}`;
            
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const currentDateOfTheDay = manilaDate.toLocaleDateString('en-US', options);
            console.log(`Date: Today ${currentDateOfTheDay}`);

            // Create the bar chart for each day
            const ctx = document.getElementById(`chart${day}`).getContext('2d');
            // console.log(manilaDate);
            // console.log(dateString);

            if (currentDateOfTheDay > today) {
                
                // Display "No data available" if the date is beyond today
                const noDataDiv = document.createElement('div');
                noDataDiv.textContent = "No data available";
                noDataDiv.style.color = 'red'; // Optional: style the message
                noDataDiv.style.textAlign = "center";
                noDataDiv.style.marginTop = "-16rem";
                noDataDiv.style.paddingBottom = "10rem";
                document.querySelector(`#${day}`).appendChild(noDataDiv);
                return; // Skip chart creation for future days
            }

            const dailyData = dailyProgress[dateString];
            const taskDoneData = positions.map(position => (dailyData && dailyData[position] ? dailyData[position]["Task Done"] : 0));
            const totalTasks = dailyData ? Math.max(...positions.map(position => dailyData[position]?.["Total Tasks"] || 0)) : 10;

            // Set the date in the span for each day
            const dateSpan = document.querySelector(`#${day} .date`);
            if (dateSpan) {
                dateSpan.innerText = currentDateOfTheDay;
            }
            const labels = positions.map(position => [
                dailyData && dailyData[position] && dailyData[position]["Assigned Person"] || "N/A",
                `(${position})`
            ]);

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${day} Tasks Done`,
                        data: taskDoneData,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                        borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: totalTasks,
                            ticks: { 
                                precision: 0,
                                color : '#000000',
                                font : {
                                    size: 16,
                                    family: 'Arial'
                                }
                                
                            }
                        }, 
                        x : {
                            ticks: { 
                                precision: 0,
                                color : '#000000',
                                font : {
                                    size: 16,
                                    family: 'Arial'
                                }
                                
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false, position: 'top' }
                    }
                }
            });
        });
    });    
})