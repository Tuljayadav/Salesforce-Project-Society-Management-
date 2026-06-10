import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';

import chartjs from '@salesforce/resourceUrl/ChartJS';

import getMonthlyContributions
from '@salesforce/apex/transactionservice.getMonthlyContributions';

export default class ChartDashboard extends LightningElement {

    @api familyId;
    
   totalContribution = 0;

    chartInitialized = false;
   
    chart;
 renderedCallback() {

        if (this.chartInitialized) {
            return;
        }

        this.chartInitialized = true;

        Promise.all([
            loadScript(this, chartjs),
            getMonthlyContributions({
                familyId: this.familyId
            })
        ])

        .then(results => {

            const contributionData = results[1];

            const labels = [];

            const values = [];

            const monthNames = [
                '',
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ];

            contributionData.forEach(item => {

                labels.push(
                    monthNames[item.monthNo]
                );

                values.push(
                    item.totalAmount
                );
            });

            this.totalContribution =
    values.reduce(
        (sum, value) => sum + value,
        0
    );

            const ctx =
                this.template
                    .querySelector('canvas')
                    .getContext('2d');

            this.chart = new Chart(ctx, {

                type: 'bar',

                data: {

                    labels: labels,

                    datasets: [{

    label: 'Monthly Contribution',

    data: values,

    backgroundColor: '#4F46E5',

    borderColor: '#3730A3',

    borderWidth: 2,

    borderRadius: 10,

    maxBarThickness: 60,

    
}]
                },

                options: {

    responsive: true,
    animation: {

    duration: 1500
},

    plugins: {

        legend: {
            display: true
        }
    },

   scales: {
     offset: false,

    x: {

        grid: {

            display: false
        }
    },

    y: {

        beginAtZero: true,

        grid: {

            color: '#E5E7EB'
        }
    }
}
}
            });
        })

        .catch(error => {

            console.error(
                'Chart Error:',
                error
            );
        });
    }
    @api
refreshChart() {
console.log('REFRESH CHART CALLED');
    getMonthlyContributions({
        familyId: this.familyId
    })

    .then(data => {

        const labels = [];
        const values = [];

        const monthNames = [
            '',
            'Jan','Feb','Mar','Apr',
            'May','Jun','Jul','Aug',
            'Sep','Oct','Nov','Dec'
        ];

        data.forEach(item => {

            labels.push(
                monthNames[item.monthNo]
            );

            values.push(
                item.totalAmount
            );
        });

        this.totalContribution =
    values.reduce(
        (sum, value) => sum + value,
        0
    );

        this.chart.data.labels = labels;

        this.chart.data.datasets[0].data = values;

        this.chart.update();
    })

    .catch(error => {

        console.error(error);
    });
}
}