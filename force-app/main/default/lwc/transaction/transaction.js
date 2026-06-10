import { LightningElement, api, track } from 'lwc';

import getTransactions from '@salesforce/apex/Transactionservice.getTransactions';

export default class Transaction extends LightningElement {

    @api familyId;
     @track transactions = [];
     @track dataLoaded = false;

     @api
refreshChartData() {

    const chartCmp =
        this.template.querySelector('.chartCmp');

    if(chartCmp) {

        chartCmp.refreshChart();
    }
}

@api
refreshTransactionTable() {

    console.log('Transaction Refresh Called');

    this.loadTransactions();

    const chartCmp =
        this.template.querySelector('.chartCmp');

    if(chartCmp){

        console.log('Chart Refresh Called');

        chartCmp.refreshChart();
    }
}

    columns = [

        {
            label: 'Member Name',
            fieldName: 'memberName'
        },

        {
            label: 'Amount',
            fieldName: 'amount'
        },

        {       
             label: 'Type',
             fieldName: 'type'
        },

        {
            label: 'Paid',
            fieldName: 'paid',
            type: 'boolean'
        },

        {
            label: 'Payment Date',
            fieldName: 'paymentDate'
        }
    ];

    connectedCallback() {

        this.loadTransactions();
    }

    loadTransactions() {

        getTransactions({ familyId: this.familyId })

        .then(data => {

            let tempData = [];

            data.forEach(member => {

                if(member.transactions__r) {

                    member.transactions__r.forEach(txn => {
                         console.log('Transaction Record', txn);


                        tempData.push({

                            Id: txn.Id,

                            memberName: member.Name,
                            amount: txn.amount__c,
                            type:
                            txn.type__c === 'contribution'
                            ? '🔵 Contribution'
                            : '🟢 EMI',
                            
                            paid: txn.paid__c,
                            paymentDate: txn.payment_date__c
                        });
                    });
                }
            });

            this.transactions = tempData;
            this.dataLoaded = true;
        })

        .catch(error => {

            console.error(error);
            this.dataLoaded = true;
        });
    }

    handleBackMember() {

    this.dispatchEvent(
        new CustomEvent('backmember')
    );
}

   handleBackFamily() {

    this.dispatchEvent(
        new CustomEvent('backfamily')
    );
}
}