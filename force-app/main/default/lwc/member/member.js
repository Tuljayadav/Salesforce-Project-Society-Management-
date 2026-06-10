import { LightningElement, track, wire, api } from 'lwc';
import getMembers from '@salesforce/apex/MemberService.getMembers';
import createMember from '@salesforce/apex/MemberService.createMember';
import updateMember from '@salesforce/apex/MemberService.updateMember';
import deleteMember from '@salesforce/apex/MemberService.deleteMember';
import ApplyLoan from '@salesforce/apex/LoanService.ApplyLoan';
import createTransaction from '@salesforce/apex/TransactionService.createTransaction';
import getEMIAmount from '@salesforce/apex/LoanService.getEMIAmount';
import updateLoanEMI from '@salesforce/apex/LoanService.updateLoanEMI';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class MemberDashboard extends LightningElement {

    @api familyId; 
    @track isLoading = false;

    @track members = [];

    @track dataLoaded = false;
    searchKey = '';

    showModal = false;
    showEditModal = false;
    showDeleteModal = false;
    showTransactions = false;
    showLoanModal = false;
    showTransactionModal = false;
    showLoans = false;
    loanAmount;
    loanDate;

    paperFee = 200;

    get totalAmount() {

    return Number(this.loanAmount || 0) + this.paperFee;
  }

    get monthlyEMI() {

    return (this.totalAmount / 24).toFixed(2);
  }

  get totalMembers(){
    return this.members.length;
}

    get eligibleMembers(){
        return this.members.filter(
            member => member.totalContribution >= 6000
        ).length;
    }

    name;
    address;
    age;
    phone;

    paymentDate;
    transactionType;
    amount = null;   
    selectedMemberId;
    selectedRows = [];
    

    wiredResult;

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Address', fieldName: 'address__c' },
        { label: 'Age', fieldName: 'age__c' },
        { label: 'Phone', fieldName: 'phone__c' },
        {
            label: 'Total Contribution',
            fieldName: 'totalContribution',
            type: 'currency',
            cellAttributes: {
                alignment: 'left'
    }
},

{
    label: 'Apply Loan',
    type: 'button',
    typeAttributes: {
        label: 'Apply Loan',
        name: 'Apply_loan',
        variant: 'brand',
        disabled: { fieldName: 'loanDisabled' }
    }
},
{
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'Edit', name: 'edit' },
                { label: 'Delete', name: 'delete' },
                { label: 'Add Transaction', name: 'add_transaction' }
            ]
        }
    },
];

    typeoptions=[
        {label:'Contribution',value:'contribution'},
        {label:'EMI',value:'EMI'}
 ];

    //  family search
    @wire(getMembers, { familyId: '$familyId', searchKey: '$searchKey' })
    wiredMembers(result) {

    this.wiredResult = result;

    if (result.data) {

        let tempMembers = [];

        result.data.forEach(member => {

            let total = 0;

            // child transactions
            if(member.transactions__r) {

                member.transactions__r.forEach(txn => {

                    total += txn.amount__c;
                });
            }

            tempMembers.push({

                ...member,

                totalContribution: total,
                isEligible: total >= 6000,
                loanDisabled: total < 6000
            });
        });

        this.members = tempMembers;
        this.dataLoaded = true;
    }

    else if (result.error) {

        console.error(result.error);
         this.dataLoaded = true;
    }
}
    //  Search
    handleSearch(e) {
        this.searchKey = e.target.value;
         
    }
     handleRowAction(event) {

    const actionName = event.detail.action.name;
    const row = event.detail.row;

    // EDIT
    if(actionName === 'edit') {

        this.selectedMemberId = row.Id;

        this.name = row.Name;
        this.address = row.address__c;
        this.age = row.age__c;
        this.phone = row.phone__c;

        this.showEditModal = true;
    }

    // DELETE
    else if(actionName === 'delete') {

        this.selectedMemberId = row.Id;

        this.name = row.Name;

        this.showDeleteModal = true;
    }

    // add transaction
    else if(actionName === 'add_transaction') {

    this.selectedMemberId = row.Id;

    this.name = row.Name;

    this.amount = null;

    this.showTransactionModal = true;
}

// CREATE LOAN
else if(actionName === 'Apply_loan') {

    // ELIGIBILITY CHECK
    if(row.totalContribution < 6000) {

        this.showToast(
            'Error',
            'Member is not eligible for loan',
            'error'
        );

        return;
    }

    this.selectedMemberId = row.Id;

    this.name = row.Name;


    this.loanDate =
        new Date().toISOString().split('T')[0];
    this.showLoanModal = true;
  }
}

 openModal() {
        this.showModal = true;
    }
     openLoans() {

    this.showLoans = true;
    }

    closeModal() {
        this.showModal = false;
    }

    closeEditModal() {
        this.showEditModal = false;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }
    closeTransactionModal() {

    this.showTransactionModal = false;
    }

    
 // Inputs
    handleName(e) { this.name = e.target.value; }
    handleAddress(e) { this.address = e.target.value; }
    handleAge(e) { this.age = e.target.value; }
    handlePhone(e) { this.phone = e.target.value; }
    handlePaymentDate(event) {

    this.paymentDate = event.target.value;
   }

   async handleTransactionType(event) {
        this.transactionType = event.target.value;
        console.log('Selected Type:', this.transactionType);

    // Contribution
    if(this.transactionType === 'contribution') {

        this.amount = 500;
        console.log('Amount:', this.amount);
    }

    // EMI
    else if(this.transactionType === 'EMI') {

        try {

            const emiAmount = await getEMIAmount({

                memberId: this.selectedMemberId
            });

            this.amount = emiAmount;
        }

        catch(error) {

            this.amount = null;

            this.showToast(
                'Error',
                error.body.message,
                'error'
            );
       }
    }

    else {

        this.amount = null;
    }
}

    handleAmount(event) {

    this.amount = event.target.value;
    }

    handleRowSelection(event) {

    this.selectedRows = event.detail.selectedRows;
    }

    handleLoanAmount(event) {

        this.loanAmount = event.target.value;
    }

    handleLoanDate(event) {

        this.loanDate = event.target.value;
    }

    closeLoanModal() {

        this.showLoanModal = false;
    }

    //Apply loan
    saveLoan() {

    ApplyLoan({

        memberId: this.selectedMemberId,
        loanAmount: this.loanAmount,
        loanDate: this.loanDate
    })

    .then(() => {

        this.showToast(
            'Success',
            'Loan Applied Successfully',
            'success'
        );
        

        this.showLoanModal = false;

        this.loanAmount = null;

        this.loanDate = null;

        this.dispatchEvent(
        new CustomEvent('refreshdashboard')
    );
    
    })
     .catch(error => {

        this.showToast(
            'Error',
            error.body.message,
            'error'
        );
    });
}

    handleBulkDelete() {

        if(this.selectedRows.length === 0) {

             this.showToast(
                'Error',
                'Please select at least one family',
                'error'
        );

        return;
    }

    const ids = this.selectedRows.map(row => row.Id);

    Promise.all(
        ids.map(id => deleteMember({ memberId: id }))
    )

    .then(() => {

        this.showToast(
            'Success',
            'Selected members deleted',
            'success'
        );

        this.selectedRows = [];

        return refreshApex(this.wiredResult);
    })

    .catch(error => {

        console.error(error);

        this.showToast(
            'Error',
            'Error deleting members',
            'error'
        );
    });
}

//  Save Member 
    handlesaveMember() {

        if (!this.name ) {
            this.showToast('Error', 'All fields are required', 'error');
            return;
        }

        const memberNameRegex = /^[A-Za-z ]+$/;

if(!memberNameRegex.test(this.name)) {

    this.showToast(
        'Error',
        'Member Name can contain only letters and spaces',
        'error'
    );

    return;
}

const addressRegex = /[A-Za-z]/;

if(!addressRegex.test(this.address)) {

    this.showToast(
        'Error',
        'Address must contain at least one alphabet',
        'error'
    );

    return;
}

if(this.age && (this.age < 1 || this.age > 120)) {

    this.showToast(
        'Error',
        'Please enter a valid age between 1 and 120',
        'error'
    );

    return;
}

        // PHONE VALIDATION
            if(this.phone && this.phone.length !== 10) {

            this.showToast(
                'Error',
                'Phone number must be exactly 10 digits',
                'error'
    );

    return;
   }
     createMember({
            name: this.name,
            address: this.address,
            age: this.age,
            phone: this.phone,
            familyId: this.familyId 
     })
        
        .then(() => {
            this.showToast('Success', 
                'Member Created',
                 'success');


            this.showModal = false;
            this.name = '';
            this.address = '';
            this.age = null;
            this.phone = '';
            this.dispatchEvent(
    new CustomEvent('refreshdashboard')
);
            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error creating member', 'error');
        });
    }

    updateMemberHandler() {

        // PHONE VALIDATION
    if(this.phone.length !== 10) {

        this.showToast(
            'Error',
            'Phone number must be exactly 10 digits',
            'error'
        );

        return;
    }

    updateMember({

        memberId: this.selectedMemberId,
        name: this.name,
        address: this.address,
        age: this.age,
        phone: this.phone
    })

    .then(() => {

        this.showToast(
            'Success',
            'Member Updated',
            'success'
        );

        this.showEditModal = false;

        return refreshApex(this.wiredResult);
    })

    .catch(error => {

        console.error(error);

        this.showToast(
            'Error',
            'Error updating member',
            'error'
        );
    });
 }
//Delete member
     confirmDelete() {

     deleteMember({
        memberId: this.selectedMemberId
    })

    .then(() => {

        this.showToast(
            'Success',
            'Member Deleted',
            'success'
        );
        this.dispatchEvent(
    new CustomEvent('refreshdashboard')
);

        this.showDeleteModal = false;

        return refreshApex(this.wiredResult);
    })

    .catch(error => {

        console.error(error);

        this.showToast(
            'Error',
            'Error deleting member',
            'error'
        );
    });
   }
    
// OPEN TRANSACTION PAGE
    openTransactions() {

    this.showTransactions = true;
   }

   handleBackTransaction() {

    this.showTransactions = false;
  }
    handleBackToFamily() {

        const backEvent = new CustomEvent('backtofamily');

        this.dispatchEvent(backEvent);
    }

    handleBackLoan() {

    this.showLoans = false;
}
   
saveTransaction() {
   

    if(this.transactionType === 'contribution' && this.amount < 500) {
        
        this.showToast(
            'Error',
            'Amount should be minimum 500',
            'error'
        );

        return;
    }

    if(this.transactionType === 'EMI' && !this.amount) {

    this.showToast(
        'Error',
        'No active loan found',
        'error'
    );

    return;
}
    this.isLoading = true;
    console.log('Spinner ON');
    createTransaction({

        memberId: this.selectedMemberId,
        amount: this.amount,
        paymentDate: this.paymentDate,
        typeValue: this.transactionType
    })

    .then(async() => {

        await new Promise(resolve =>
        setTimeout(resolve, 1000)
    );

 // EMI UPDATE
        if(this.transactionType === 'EMI') {

            await updateLoanEMI({

                memberId: this.selectedMemberId
            });
    

     const loanCmp =
        this.template.querySelector('c-loan');

    if(loanCmp) {

        setTimeout(async() => {

        await loanCmp.refreshLoanTable();

      }, 300);
    }
 }
        this.showToast(
            'Success',
            'Transaction Added',
            'success'
        );


        this.dispatchEvent(
    new CustomEvent('refreshdashboard')
);

    const transactionComponent =
    this.template.querySelector('c-transaction');

if(transactionComponent){
    transactionComponent.refreshTransactionTable();
}
        // CLOSE MODAL
        this.showTransactionModal = false;
console.log('Spinner OFF');
        // SPINNER OFF
         this.isLoading = false;


        // RESET FIELDS
        this.paymentDate = null;
        this.transactionType = null;
        this.amount = null;

        // MEMBER TABLE REFRESH
        await refreshApex(this.wiredResult);

        // TRANSACTION TABLE REFRESH
        const transactionCmp =
            this.template.querySelector('c-transaction');

        if(transactionCmp) {

            await transactionCmp.refreshTransactionTable();
        }

        
    })

    .catch(error => {

        this.isLoading = false;

        console.error(error);

        this.showToast(
            'Payment Status',
            error.body.message,
            'warning'
        );
    });
}

    //  Toast
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}