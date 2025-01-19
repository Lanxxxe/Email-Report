const logoutUser = () => {
    try {
        localStorage.removeItem('User');
    } catch (error) {
        console.log(error);
    }
    location.replace('index.html'); // Force immediate redirect to the login page
};

// Function to get today's data
const getTodayData = (jsonData) => {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const todayData = jsonData["Daily Progress"][todayStr];

    return todayData ? todayData : {}; // Return today's data or empty if none exists
};

// Function to render today's chart
const renderTodayChart = (todayData) => {
    // Get the positions and their respective data
    const positions = Object.keys(todayData);
    const assignedPerson = positions.map(position => todayData[position]["Assigned Person"]);
    const tasksDone = positions.map(position => todayData[position]["Task Done"]);
    const totalTasks = positions.map(position => todayData[position]["Total Tasks"]);

    // Combine assignedPerson and positions into multiline labels
    const labels = positions.map((position, index) => [
        assignedPerson[index],   
        `(${position})`
    ]);
    
    // Get the canvas context
    const ctx = document.querySelector("#dailyReport").getContext("2d");

    // Generate chart
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
            {
                label: "Tasks Done",
                data: tasksDone,
                backgroundColor: ["#4CAF50", "#FAD000", "#158FAD", "#844DFF"],
                borderColor: ["#4CAF50", "#FAD000", "#158FAD", "#844DFF"],
                borderWidth: 1
            }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...totalTasks), // Set max y-axis value based on total tasks
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
            legend: { display: false, position: "top" }
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.querySelector("#save-file");
    const canvasContainer = document.querySelector("#dailyReport");
    const logoutButton = document.querySelector('#logoutButton');
    const getUser = localStorage.getItem('User');
    
    if (!getUser) {
        location.replace('index.html'); // Redirect if User is not in localStorage
    }
    logoutButton.addEventListener('click', logoutUser);
    


    // Fetch JSON data and render today's chart
    fetch("./scripts/storage/progress.json")
        .then(response => response.json())
        .then(jsonData => {
        const todayData = getTodayData(jsonData);
        if (Object.keys(todayData).length) {
            renderTodayChart(todayData);
        } else {
            canvasContainer.style.display = 'none';
            document.querySelector("#no-data").innerHTML = "No data available for today."
            console.log("No data available for today.");
        }
    });

    
    saveButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();


        // Add title/header
        const title = "Daily Report";
        const pageWidth = doc.internal.pageSize.getWidth();
        const titleX = pageWidth / 2 - (doc.getTextWidth(title) / 2); // Center the title horizontally

        doc.setFontSize(18);
        doc.text(title, titleX, 20); // Position title in the center at y=20

        // Add subheader with the current date
        const currentDate = new Date().toLocaleDateString();
        const dateX = pageWidth / 2 - (doc.getTextWidth(`Date: ${currentDate}`) / 2);
        doc.setFontSize(12);
        doc.text(`Date: ${currentDate}`, dateX, 30); // Center date below title

        // Assuming your chart is in a canvas element with id 'chartCanvas'
        const canvas = document.querySelector('#dailyReport');
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, 40, 180, 80);
        doc.save("dailyReport.pdf");

    })
    
  
})