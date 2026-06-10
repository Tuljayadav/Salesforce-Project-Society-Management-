import { LightningElement, api ,wire,track} from 'lwc';
import getLoans from '@salesforce/apex/LoanService.getLoans';
import { refreshApex } from '@salesforce/apex';
export default class Loan extends LightningElement {

    @api memberId;
    @api memberName;
    @api familyId;
    @track loans = [];
    @track dataLoaded = false;

    get hasLoans() {

    return this.loans && this.loans.length > 0;
}
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
    label: 'Paper fee',
    fieldName: 'paper_fee__c',
    type: 'currency',
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
                label: 'Monthly EMI',
                fieldName: 'EMI_amount__c',
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
                label: 'Paid EMI',
                fieldName: 'paid_EMI__c',
                type: 'number',
                cellAttributes: {
                    alignment: 'left'
                }
        },


        {
            label: 'Remaining EMI',
            fieldName: 'Remaining_EMI__c'
        },

        {
            label: 'Status',
            fieldName: 'statusBadge'
        }
    ];

     @wire(getLoans, { familyId: '$familyId' })

     wiredLoans(result) {

        this.wiredLoanResult = result;

        const { data, error } = result;

        if(data) {

            this.loans = data.map(row => {
                 let statusBadge = '';

        if(row.Status__c === 'Active') {
            statusBadge = '🟢 Active';
        }
        else if(row.Status__c === 'Closed') {
            statusBadge = '🔴 Closed';
        }
        else if(row.Status__c === 'Pending') {
            statusBadge = '🟠 Pending';
        }
         const totalEMI =
                (row.paid_EMI__c || 0) +
                (row.Remaining_EMI__c || 0);

            const progress =
                totalEMI > 0
                ? ((row.paid_EMI__c || 0) / totalEMI) * 100
                : 0;

                
                let progressStatus = '';

                if(progress <= 30) {

                    progressStatus = '🔴 Low Progress';
                }
                else if(progress <= 70) {

                    progressStatus = '🟠 Medium Progress';
                }
                else {

                    progressStatus = '🟢 High Progress';
                }

                return {

                    ...row,

                    memberName: row.member__r.Name,
                    statusBadge: statusBadge,
                     progress: Math.round(progress),

                emiProgress:
                    (row.paid_EMI__c || 0) +
                    '/' +
                    totalEMI,

                    progressStatus: progressStatus
                };
            });
          this.dataLoaded = true;
        }
        

        else if(error) {

            console.error(error);
            this.dataLoaded = true;
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

                }, 5000);
            }

            disconnectedCallback() {

                clearInterval(this.refreshInterval);
         }
     }