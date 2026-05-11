import { LightningElement, api, wire, track } from 'lwc';

import getTransactions from '@salesforce/apex/TransactionService.getTransactions';

export default class Transaction extends LightningElement {

    @api familyId;

    @track transactions = [];

    columns = [

        {
            label: 'Member Name',
            fieldName: 'memberName'
        },

        {
            label: 'Amount',
            fieldName: 'amount__c'
        },

        {
            label: 'Type',
            fieldName: 'type__c'
        },

        {
            label: 'Month',
            fieldName: 'month__c'
        },

        {
            label: 'Year',
            fieldName: 'year__c'
        },

        {
            label: 'Paid',
            fieldName: 'paid__c',
            type: 'boolean'
        },

        {
            label: 'Payment Date',
            fieldName: 'payment_date__c'
        }
    ];

    @wire(getTransactions, { familyId: '$familyId' })

    wiredTransactions({ data, error }) {

        if(data) {

            this.transactions = data.map(row => {

                return {

                    ...row,

                    memberName: row.member__r
                        ? row.member__r.Name
                        : ''
                };
            });
        }

        else if(error) {

            console.error(error);
        }
    }
}