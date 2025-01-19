// Logout user function
const logoutUser = () => {
  try {
      localStorage.removeItem('User');
  } catch (error) {
      console.log(error);
  }
  location.replace('index.html'); // Force immediate redirect to the login page
};

// Calculate Weekly Average Task Done
const calculateWeeklyAverage = (jsonData) => {
  const dailyProgress = jsonData["Daily Progress"];
  const weeks = [[], [], [], [], []]; // Up to 5 weeks

  // Group daily data by week
  Object.keys(dailyProgress).forEach(dateStr => {
    const date = new Date(dateStr);
    const weekNumber = Math.floor((date.getDate() - 1) / 7);
    weeks[weekNumber].push(dailyProgress[dateStr]);
  });

  // Calculate weekly averages for each position
  return weeks.map((weekData, index) => {
    if (weekData.length === 0) return { week: `Week ${index + 1}`, data: null };

    const weekTotal = {};
    const daysInWeek = weekData.length;

    weekData.forEach(dayData => {
      for (const position in dayData) {
        if (!weekTotal[position]) {
          weekTotal[position] = { totalTasks: 0, taskDone: 0, assignedPerson: dayData[position]["Assigned Person"] };
        }
        weekTotal[position].totalTasks += dayData[position]["Total Tasks"];
        weekTotal[position].taskDone += dayData[position]["Task Done"];
      }
    });

    const weekAverage = {};
    for (const position in weekTotal) {
      weekAverage[position] = {
        averageTaskDone: (weekTotal[position].taskDone / daysInWeek).toFixed(2),
        averageTotalTasks: (weekTotal[position].totalTasks / daysInWeek).toFixed(2),
        assignedPerson: weekTotal[position].assignedPerson // Add assigned person for labels
      };
    }
    return { week: `Week ${index + 1}`, data: weekAverage };
  });
};

// Render charts with multi-line labels for each week
const renderWeeklyReports = (weeklyAverages) => {
  weeklyAverages.forEach((weekData, index) => {
    const canvasId = `chartWeek${index + 1}`;
    const canvas = document.getElementById(canvasId);

    if (canvas && weekData.data) {
      const labels = Object.keys(weekData.data).map(position => [
        weekData.data[position].assignedPerson,
        `(${position})`
      ]);

      const taskData = Object.keys(weekData.data).map(position => weekData.data[position].averageTaskDone);

      new Chart(canvas, {
        type: "bar",
        data: {
          labels: labels, // Multi-line labels
          datasets: [{
            label: "Average Tasks Done",
            data: taskData,
            backgroundColor: ["#4CAF50", "#FAD000", "#158FAD", "#844DFF"],
            borderColor: ["#4CAF50", "#FAD000", "#158FAD", "#844DFF"],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 10, // Assuming total tasks out of 10
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
            legend: { display: false }
          }
        }
      });
    } else if (canvas) {
      // Display "Data is not available" if there's no data for the week
      const message = document.createElement("p");
      message.textContent = `Data is not available`;
      message.style.color = "red";
      message.style.textAlign = "center";
      canvas.style.marginTop = '-15rem'; 
      canvas.parentElement.appendChild(message);
    }
  });
};


document.addEventListener('DOMContentLoaded', () => {
  const getUser = localStorage.getItem('User');
    
    if (!getUser) {
        location.replace('index.html'); // Redirect if User is not in localStorage
    }
    logoutButton.addEventListener('click', logoutUser);
    

  // Fetch JSON data, calculate weekly averages, and render charts
  fetch("./scripts/storage/progress.json")
    .then(response => response.json())
    .then(jsonData => {
      const weeklyAverages = calculateWeeklyAverage(jsonData);
      renderWeeklyReports(weeklyAverages);
    });
})