import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import axios from 'axios';

const App = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://192.168.2.30:5000/api/data');
        const data = response.data;
        console.log(data[0].hostreport['Total Cpu Usage']);
        renderCPUChart(data);
        renderMemoryChart(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const renderCPUChart = (data) => {
      // const labels = data.filter(item => item.chart == 1).map(item => `Chart ${item.chart}`);
      const labels = data.filter(item => item.chart == 1).map(item => {
        const date = new Date(item.ts / 1000);

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        return `${hours}:${minutes}`;
      });

      const values = data.filter(item => item.chart == 1).map(item => item.hostreport['Total Cpu Usage']);
      console.log(values);

      const ctx = document.getElementById('myCpuChart');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'CPU Usage (%)',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };

    const renderMemoryChart = (data) => {
      // const labels = data.filter(item => item.chart == 1).map(item => `Chart ${item.chart}`);
      const labels = data.filter(item => item.chart == 2).map(item => {
        const date = new Date(item.ts / 1000);
  
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
  
        return `${hours}:${minutes}`;
      });
  
      const values = data.filter(item => item.chart == 2).map(item => item.hostreport['Memory (free)']);
      console.log(values);
  
      const ctx = document.getElementById('myMemoryChart');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Memory Free (%)',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };

    fetchData();
  }, []);

  

  return (
    <div className="App">
      <h1>System Metrics</h1>
      <div style={{ height: '400px', width: '600px' }}>
        <canvas id="myCpuChart" />
        <canvas id="myMemoryChart" />
      </div>
    </div>
  );
};

export default App;
