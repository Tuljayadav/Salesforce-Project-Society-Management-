import { LightningElement, track, wire, api } from 'lwc';
import getMembers from '@salesforce/apex/MemberService.getMembers';
import createMember from '@salesforce/apex/MemberService.createMember';
import updateMember from '@salesforce/apex/MemberService.updateMember';
import deleteMember from '@salesforce/apex/MemberService.deleteMember';
import createTransaction from '@salesforce/apex/TransactionService.createTransaction';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';


export default class MemberDashboard extends LightningElement {

    @api familyId; 

    @track members = [];
    searchKey = '';

    showModal = false;
    showEditModal = false;
    showDeleteModal = false;
    showTransactions = false;
    showTransactionModal = false;

    name;
    address;
    age;
    phone;

    paymentDate;
    transactionType;
    amount = null;   
    selectedMemberId;

    wiredResult;

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Address', fieldName: 'address__c' },
        { label: 'Age', fieldName: 'age__c' },
        { label: 'Phone', fieldName: 'phone__c' },


    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'Edit', name: 'edit' },
                { label: 'Delete', name: 'delete' },
                { label: 'Add Transaction', name: 'add_transaction' }
            ]
        }
    }
 ];

    typeoptions=[
        {label:'Contribution',value:'Contribution'},
        {label:'EMI',value:'EMI'}
    ];

    //  family search
    @wire(getMembers, { familyId: '$familyId', searchKey: '$searchKey' })
    wiredMembers(result) {
        this.wiredResult = result;

        if (result.data) {
            this.members = result.data;
        } else if (result.error) {
            console.error(result.error);
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

}

openModal() {
        this.showModal = true;
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

handleTransactionType(event) {

    this.transactionType = event.target.value;

    // Contribution selected
    if(this.transactionType === 'Contribution') {
        this.amount = 500;
    }
    else {

        this.amount = null;
    }
}

handleAmount(event) {

    this.amount = event.target.value;
}

//  Save Member 
    handlesaveMember() {

        if (!this.name || !this.address || !this.age || !this.phone) {
            this.showToast('Error', 'All fields are required', 'error');
            return;
        }
        console.log('DATA:', this.name, this.address, this.age, this.phone, this.familyId);
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

            return refreshApex(this.wiredResult);
        })
        .catch(error => {
            console.error(error);
            this.showToast('Error', 'Error creating member', 'error');
        });
    }
    updateMemberHandler() {

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

saveTransaction() {

    if(this.transactionType === 'Contribution' && this.amount < 500) {
        
        this.showToast(
            'Error',
            'Amount should be minimum 500',
            'error'
        );

        return;
    }

    createTransaction({

        memberId: this.selectedMemberId,
        amount: this.amount,
        paymentDate: this.paymentDate,
        typeValue: this.transactionType
    })
    

    .then(() => {

        this.showToast(
            'Success',
            'Transaction Added',
            'success'
        );

        this.showTransactionModal = false;

// transaction component refresh
        this.showTransactions = false;

    setTimeout(() => {

        this.showTransactions = true;

    }, 300);
        
    })

    .catch(error => {

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