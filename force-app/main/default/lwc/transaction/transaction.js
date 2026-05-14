import { LightningElement, api, wire, track } from 'lwc';

import getTransactions from '@salesforce/apex/Transactionservice.getTransactions';
import { refreshApex } from '@salesforce/apex';

export default class Transaction extends LightningElement {

    @api familyId;

    @track transactions = [];

    wiredResult;

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

    @wire(getTransactions, { familyId: '$familyId' })
wiredTransactions(result) {

    this.wiredResult = result;

    const { data, error } = result;

        if(data) {

             let tempData = [];

            data.forEach(member => {

                // if transaction exists
                if(member.transactions__r) {

                    member.transactions__r.forEach(txn => {

                        tempData.push({

                            memberName: member.Name,
                            amount: txn.amount__c,
                            type: txn.type__c,
                            paid: txn.paid__c,
                            paymentDate: txn.payment_date__c
                        });
                    });
                }

                });

            this.transactions = tempData;
        }

        else if(error) {

            console.error(error);
        }
    }

    // AUTO REFRESH METHOD
    refreshTransactionTable() {

        refreshApex(this.wiredResult);
    }
}
