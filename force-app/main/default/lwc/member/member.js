import { LightningElement, track, wire, api } from 'lwc';
import getMembers from '@salesforce/apex/MemberService.getMembers';
import createMember from '@salesforce/apex/MemberService.createMember';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class MemberDashboard extends LightningElement {

    @api familyId; 

    @track members = [];
    searchKey = '';

    showModal = false;

    name;
    address;
    age;
    phone;

    wiredResult;

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Address', fieldName: 'address__c' },
        { label: 'Age', fieldName: 'age__c' },
        { label: 'Phone', fieldName: 'phone__c' }
    ];

    //  family search
    @wire(getMembers, { familyId: '$familyId', searchKey: '$searchKey' })
    wiredMembers(result) {
        this.wiredResult = result;

        if (result.data) {
            this.members= result.data;
        } else if (result.error) {
            console.error(result.error);
        }
    }

    //  Search
    handleSearch(e) {
        this.searchKey = e.target.value;
         
    }

    // Modal
    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    // Inputs
    handleName(e) { this.name = e.target.value; }
    handleAddress(e) { this.address = e.target.value; }
    handleAge(e) { this.age = e.target.value; }
    handlePhone(e) { this.phone = e.target.value; }

    //  Save Member 
    handleSaveMember() {

    console.log('CLICK WORKING'); // debug

    if (!this.name || !this.address || !this.age || !this.phone) {
        this.showToast('Error', 'All fields are required', 'error');
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
        this.showToast('Success', 'Member Created', 'success');

        // reset fields
        this.name = '';
        this.address = '';
        this.age = null;
        this.phone = '';

        this.showModal = false;

        refreshApex(this.wiredResult);
    })
    .catch(error => {
        console.error(error);

        this.showToast(
            'Error',
            error?.body?.message || 'Error creating member',
            'error'
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