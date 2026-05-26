import { LightningElement, api ,wire,track} from 'lwc';
import getLoans from '@salesforce/apex/LoanService.getLoans';
import { refreshApex } from '@salesforce/apex';
export default class Loan extends LightningElement {

    @api memberId;
    @api memberName;
    @api familyId;
    @track loans = [];
    wiredLoanResult;

    
    
    columns = [

        {
            label: 'member Name',
            fieldName: 'memberName'
        },

        {
            label: 'Loan Amount',
            fieldName: 'loan_amount__c',
            type: 'currency',
            cellAttributes: {
            alignment: 'left'
           }
        },

        {
                label: 'Monthly EMI',
                fieldName: 'EMI_amount__c',
                type: 'currency',
                cellAttributes: {
                    alignment: 'left'
                }
        },

            {
                label: 'Paid EMI',
                fieldName: 'paid_EMI__c',
                type: 'number',
                cellAttributes: {
                    alignment: 'left'
                }
        },

        {
            label: 'Total Amount',
            fieldName: 'Total_amount__c',
            type: 'currency',
            cellAttributes: {
            alignment: 'left'
           }
        },

        {
            label: 'Loan Date',
            fieldName: 'Loan_date__c'
        },

        {
            label: 'Remaining EMI',
            fieldName: 'Remaining_EMI__c'
        },

        {
            label: 'Status',
            fieldName: 'Status__c'
        }
    ];

     @wire(getLoans, { familyId: '$familyId' })

     wiredLoans(result) {

        this.wiredLoanResult = result;

        const { data, error } = result;

        if(data) {

            this.loans = data.map(row => {

                return {

                    ...row,

                    memberName: row.member__r.Name
                };
            });
        }

        else if(error) {

            console.error(error);
        }
    }


    handleBack() {

        this.dispatchEvent(
            new CustomEvent('backmember')
        );
    }

    connectedCallback() {

    this.startAutoRefresh();
}

   startAutoRefresh() {

     this.refreshInterval = setInterval(() => {

        refreshApex(this.wiredLoanResult);

    }, 100);
}

   disconnectedCallback() {

      clearInterval(this.refreshInterval);
}
}